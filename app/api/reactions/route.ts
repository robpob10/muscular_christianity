import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { target_user_id, exercise_id, workout_date, stars, comment } = await request.json()

  if (!target_user_id || !exercise_id || !workout_date || !stars) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Stars must be 1–5' }, { status: 400 })
  }

  const { rows: [reactorUser] } = await sql`
    SELECT id FROM users WHERE email = ${session.user.email}
  `
  if (!reactorUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  if (reactorUser.id === target_user_id) {
    return NextResponse.json({ error: 'Cannot react to own workout' }, { status: 400 })
  }

  const { rows } = await sql`
    INSERT INTO feed_reactions (reactor_user_id, target_user_id, exercise_id, workout_date, stars, comment)
    VALUES (${reactorUser.id}, ${target_user_id}, ${exercise_id}, ${workout_date}::date, ${stars}, ${comment ?? null})
    ON CONFLICT (reactor_user_id, target_user_id, exercise_id, workout_date)
    DO UPDATE SET stars = EXCLUDED.stars, comment = EXCLUDED.comment
    RETURNING *
  `

  return NextResponse.json(rows[0])
}

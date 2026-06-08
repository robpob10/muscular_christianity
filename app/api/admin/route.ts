import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = 'robpob10@gmail.com'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { rows } = await sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.created_at,
      COUNT(wl.id)        AS workout_count,
      MAX(wl.logged_at)   AS last_workout
    FROM users u
    LEFT JOIN workout_logs wl ON wl.user_id = u.id AND wl.deleted = FALSE
    GROUP BY u.id, u.name, u.email, u.created_at
    ORDER BY u.created_at DESC
  `

  return NextResponse.json(rows)
}

import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // The user's most recently done exercises first, then the rest by when anyone last did them
    const { rows } = await sql`
      SELECT e.id, e.name
      FROM exercises e
      INNER JOIN workout_logs wl ON wl.exercise_id = e.id AND wl.deleted = FALSE
      GROUP BY e.id, e.name
      ORDER BY MAX(wl.logged_at) FILTER (WHERE wl.user_id = ${userId}) DESC NULLS LAST,
               MAX(wl.logged_at) DESC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/exercises error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const trimmedName = name.trim().toLowerCase()

    const { rows } = await sql`
      INSERT INTO exercises (name) VALUES (${trimmedName})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/exercises error:', error)
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}

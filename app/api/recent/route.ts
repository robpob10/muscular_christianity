import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '3')

    const { rows } = await sql`
      SELECT
        wl.id,
        wl.weight_kg,
        wl.reps,
        wl.sets,
        wl.passed,
        wl.logged_at,
        u.name  AS user_name,
        e.name  AS exercise_name
      FROM workout_logs wl
      JOIN users     u ON u.id = wl.user_id
      JOIN exercises e ON e.id = wl.exercise_id
      WHERE wl.deleted = FALSE
      ORDER BY wl.logged_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/recent error:', error)
    return NextResponse.json({ error: 'Failed to fetch recent workouts' }, { status: 500 })
  }
}

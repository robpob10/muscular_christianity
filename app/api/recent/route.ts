import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') ?? '3')

    const { rows } = await sql`
      SELECT
        u.name                                                        AS user_name,
        e.name                                                        AS exercise_name,
        MAX(wl.logged_at)                                             AS last_logged_at,
        json_agg(
          json_build_object('weight_kg', wl.weight_kg, 'reps', wl.reps)
          ORDER BY wl.logged_at
        )                                                             AS sets
      FROM workout_logs wl
      JOIN users     u ON u.id = wl.user_id
      JOIN exercises e ON e.id = wl.exercise_id
      WHERE wl.deleted = FALSE
      GROUP BY u.name, e.name, DATE(wl.logged_at)
      ORDER BY last_logged_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/recent error:', error)
    return NextResponse.json({ error: 'Failed to fetch recent workouts' }, { status: 500 })
  }
}

import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '3'), 50)

    const { rows } = await sql`
      WITH workout_sessions AS (
        SELECT
          u.id                                                        AS user_id,
          u.name                                                      AS user_name,
          e.id                                                        AS exercise_id,
          e.name                                                      AS exercise_name,
          DATE(wl.logged_at)                                          AS workout_date,
          MAX(wl.logged_at)                                           AS last_logged_at,
          json_agg(
            json_build_object('weight_kg', wl.weight_kg, 'reps', wl.reps)
            ORDER BY wl.logged_at, wl.id
          )                                                           AS sets
        FROM workout_logs wl
        JOIN users     u ON u.id = wl.user_id
        JOIN exercises e ON e.id = wl.exercise_id
        WHERE wl.deleted = FALSE
        GROUP BY u.id, u.name, e.id, e.name, DATE(wl.logged_at)
      ),
      reaction_groups AS (
        SELECT
          fr.target_user_id,
          fr.exercise_id,
          fr.workout_date,
          json_agg(json_build_object(
            'reactor_user_id', fr.reactor_user_id,
            'reactor_name',    ru.name,
            'stars',           fr.stars,
            'comment',         fr.comment
          )) AS reactions
        FROM feed_reactions fr
        JOIN users ru ON ru.id = fr.reactor_user_id
        GROUP BY fr.target_user_id, fr.exercise_id, fr.workout_date
      )
      SELECT
        ws.*,
        COALESCE(rg.reactions, '[]'::json) AS reactions
      FROM workout_sessions ws
      LEFT JOIN reaction_groups rg
        ON  rg.target_user_id = ws.user_id
        AND rg.exercise_id    = ws.exercise_id
        AND rg.workout_date   = ws.workout_date
      ORDER BY ws.last_logged_at DESC
      LIMIT ${limit}
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/recent error:', error)
    return NextResponse.json({ error: 'Failed to fetch recent workouts' }, { status: 500 })
  }
}

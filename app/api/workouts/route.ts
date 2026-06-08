import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const exerciseId = searchParams.get('exerciseId')

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'exerciseId is required' },
        { status: 400 }
      )
    }

    let rows

    if (userId) {
      // Logs for specific user + exercise
      const result = await sql`
        SELECT
          wl.id,
          wl.weight_kg,
          wl.reps,
          wl.sets,
          wl.passed,
          wl.logged_at,
          u.id as user_id,
          u.name as user_name
        FROM workout_logs wl
        JOIN users u ON u.id = wl.user_id
        WHERE wl.exercise_id = ${exerciseId}
          AND wl.user_id = ${userId}
          AND wl.deleted = FALSE
        ORDER BY wl.logged_at ASC
      `
      rows = result.rows
    } else {
      // All logs for the exercise (all users) — used by progress chart
      const result = await sql`
        SELECT
          wl.id,
          wl.weight_kg,
          wl.reps,
          wl.sets,
          wl.passed,
          wl.logged_at,
          u.id as user_id,
          u.name as user_name
        FROM workout_logs wl
        JOIN users u ON u.id = wl.user_id
        WHERE wl.exercise_id = ${exerciseId}
          AND wl.deleted = FALSE
        ORDER BY wl.logged_at ASC
      `
      rows = result.rows
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/workouts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, exerciseId, weightKg, reps, sets, passed, loggedAt } = body

    if (!userId || !exerciseId || weightKg == null || !reps || !sets) {
      return NextResponse.json(
        { error: 'userId, exerciseId, weightKg, reps, and sets are required' },
        { status: 400 }
      )
    }

    if (
      typeof weightKg !== 'number' ||
      typeof reps !== 'number' ||
      typeof sets !== 'number'
    ) {
      return NextResponse.json(
        { error: 'weightKg, reps, and sets must be numbers' },
        { status: 400 }
      )
    }

    const didPass = passed !== false
    const ts = loggedAt ? new Date(loggedAt).toISOString() : new Date().toISOString()

    const { rows } = await sql`
      INSERT INTO workout_logs (user_id, exercise_id, weight_kg, reps, sets, passed, logged_at)
      VALUES (${userId}, ${exerciseId}, ${weightKg}, ${reps}, ${sets}, ${didPass}, ${ts})
      RETURNING id, user_id, exercise_id, weight_kg, reps, sets, passed, logged_at
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/workouts error:', error)
    return NextResponse.json({ error: 'Failed to log workout' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 })
    }

    const { rowCount } = await sql`
      UPDATE workout_logs SET deleted = TRUE
      WHERE id = ${id} AND user_id = ${userId} AND deleted = FALSE
    `

    if (!rowCount || rowCount === 0) {
      return NextResponse.json({ error: 'Entry not found or not yours' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/workouts error:', error)
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })
  }
}

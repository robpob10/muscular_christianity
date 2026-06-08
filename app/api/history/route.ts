import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const { rows } = await sql`
      SELECT
        e.id                                                          AS exercise_id,
        e.name                                                        AS exercise_name,
        DATE(wl.logged_at)                                            AS workout_date,
        json_agg(
          json_build_object('id', wl.id, 'weight_kg', wl.weight_kg, 'reps', wl.reps)
          ORDER BY wl.logged_at, wl.id
        )                                                             AS sets
      FROM workout_logs wl
      JOIN exercises e ON e.id = wl.exercise_id
      WHERE wl.user_id = ${userId}
        AND wl.deleted = FALSE
      GROUP BY e.id, e.name, DATE(wl.logged_at)
      ORDER BY MAX(wl.logged_at) DESC
    `

    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/history error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const ids = searchParams.get('ids')

    if (!userId || !ids) {
      return NextResponse.json({ error: 'userId and ids are required' }, { status: 400 })
    }

    const idList = ids.split(',').map(Number).filter(Boolean)
    if (idList.length === 0) {
      return NextResponse.json({ error: 'No valid ids' }, { status: 400 })
    }

    for (const id of idList) {
      await sql`
        UPDATE workout_logs SET deleted = TRUE
        WHERE id = ${id} AND user_id = ${userId} AND deleted = FALSE
      `
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/history error:', error)
    return NextResponse.json({ error: 'Failed to delete entries' }, { status: 500 })
  }
}

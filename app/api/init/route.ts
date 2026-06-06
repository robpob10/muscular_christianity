import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

const DEFAULT_EXERCISES = [
  'bench press',
  'leg press',
  'seated military press',
  'hammer curls',
  'dips',
  'tricep pulldown',
]

export async function GET() {
  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS workout_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
        weight_kg DECIMAL(6,2) NOT NULL,
        reps INTEGER NOT NULL,
        sets INTEGER NOT NULL,
        logged_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Seed default exercises if table is empty
    const { rowCount } = await sql`SELECT id FROM exercises LIMIT 1`
    if (!rowCount || rowCount === 0) {
      for (const name of DEFAULT_EXERCISES) {
        await sql`
          INSERT INTO exercises (name) VALUES (${name})
          ON CONFLICT (name) DO NOTHING
        `
      }
    }

    return NextResponse.json({ ok: true, message: 'Database initialized' })
  } catch (error) {
    console.error('Init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}

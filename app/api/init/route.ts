import { sql } from '@vercel/postgres'
import { NextResponse } from 'next/server'

const DEFAULT_EXERCISES = [
  'bench press',
  'leg press',
  'shoulder push',
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
        passed BOOLEAN NOT NULL DEFAULT TRUE,
        logged_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Migrations for columns added after initial deploy
    await sql`ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS passed BOOLEAN NOT NULL DEFAULT TRUE`
    await sql`ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE`
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email) WHERE email IS NOT NULL`
    // Drop name uniqueness — email is now the unique key
    await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_name_key`
    // Remove legacy users with no email (their workout data cascades)
    await sql`DELETE FROM users WHERE email IS NULL`

    await sql`
      CREATE TABLE IF NOT EXISTS feed_reactions (
        id SERIAL PRIMARY KEY,
        reactor_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        target_user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        workout_date DATE NOT NULL,
        stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(reactor_user_id, target_user_id, exercise_id, workout_date)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS magic_links (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Rename exercises
    await sql`UPDATE exercises SET name = 'shoulder push' WHERE name = 'seated military press'`

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

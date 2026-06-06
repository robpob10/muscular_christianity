import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, name, created_at FROM users ORDER BY name ASC
    `
    return NextResponse.json(rows)
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()

    // Try to find existing user first
    const { rows: existing } = await sql`
      SELECT id, name FROM users WHERE LOWER(name) = LOWER(${trimmedName}) LIMIT 1
    `

    if (existing.length > 0) {
      return NextResponse.json(existing[0])
    }

    // Create new user
    const { rows } = await sql`
      INSERT INTO users (name) VALUES (${trimmedName})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

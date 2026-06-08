import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { rows } = await sql`
    SELECT id, name, email FROM users WHERE email = ${session.user.email}
  `

  if (rows.length === 0) return NextResponse.json(null)
  return NextResponse.json(rows[0])
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { name } = await request.json()
  const nameTrimmed = name?.trim()
  if (!nameTrimmed) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const email = session.user.email

  try {
    // If user already exists (e.g. double-submit), just return them
    const { rows: existing } = await sql`SELECT id, name, email FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return NextResponse.json(existing[0])
    }

    const { rows } = await sql`
      INSERT INTO users (name, email) VALUES (${nameTrimmed}, ${email})
      RETURNING id, name, email
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/me error:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { name } = await request.json()
  const nameTrimmed = name?.trim()
  if (!nameTrimmed) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  try {
    const { rows } = await sql`
      UPDATE users SET name = ${nameTrimmed}
      WHERE email = ${session.user.email}
      RETURNING id, name, email
    `
    if (rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('PATCH /api/me error:', error)
    return NextResponse.json({ error: 'Failed to update name' }, { status: 500 })
  }
}

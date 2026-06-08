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

  // Check name isn't taken by a different email
  const { rows: taken } = await sql`
    SELECT id, email FROM users WHERE LOWER(name) = LOWER(${nameTrimmed})
  `
  if (taken.length > 0 && taken[0].email !== email) {
    return NextResponse.json({ error: 'That name is already taken' }, { status: 409 })
  }

  const { rows } = await sql`
    INSERT INTO users (name, email) VALUES (${nameTrimmed}, ${email})
    ON CONFLICT (email) DO UPDATE SET name = ${nameTrimmed}
    RETURNING id, name, email
  `
  return NextResponse.json(rows[0], { status: 201 })
}

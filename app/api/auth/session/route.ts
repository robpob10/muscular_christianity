import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 401 })
    }

    const { rows } = await sql`
      SELECT u.id, u.name, u.email
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ${token}
        AND s.expires_at > NOW()
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error('POST /api/auth/session error:', error)
    return NextResponse.json({ error: 'Failed to validate session' }, { status: 500 })
  }
}

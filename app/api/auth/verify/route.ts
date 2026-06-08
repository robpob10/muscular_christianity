import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const { rows: links } = await sql`
      SELECT id, email, expires_at, used FROM magic_links WHERE token = ${token}
    `

    if (links.length === 0) {
      return NextResponse.json({ error: 'Invalid login link' }, { status: 400 })
    }

    const link = links[0]

    if (link.used) {
      return NextResponse.json({ error: 'This link has already been used. Request a new one.' }, { status: 400 })
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This link has expired. Request a new one.' }, { status: 400 })
    }

    // Consume the token
    await sql`UPDATE magic_links SET used = TRUE WHERE token = ${token}`

    const { rows: users } = await sql`
      SELECT id, name, email FROM users WHERE email = ${link.email}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    const user = users[0]

    // Create 1-year session
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      sessionToken,
    })
  } catch (error) {
    console.error('GET /api/auth/verify error:', error)
    return NextResponse.json({ error: 'Failed to verify link' }, { status: 500 })
  }
}

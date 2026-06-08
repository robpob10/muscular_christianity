import { sql } from '@vercel/postgres'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { email, name } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()

    // Check if a user with this email already exists
    const { rows: existing } = await sql`
      SELECT id FROM users WHERE email = ${emailLower}
    `

    let userId: number

    if (existing.length > 0) {
      userId = existing[0].id
    } else {
      // New email — need a name
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ status: 'needs_name' })
      }

      const nameTrimmed = name.trim()

      // Check if name is already taken by a different user
      const { rows: takenRows } = await sql`
        SELECT id, email FROM users WHERE LOWER(name) = LOWER(${nameTrimmed})
      `

      if (takenRows.length > 0) {
        if (takenRows[0].email && takenRows[0].email !== emailLower) {
          return NextResponse.json({ status: 'name_taken' })
        }
        // Legacy user without email — link it
        await sql`UPDATE users SET email = ${emailLower} WHERE id = ${takenRows[0].id}`
        userId = takenRows[0].id
      } else {
        const { rows: newUser } = await sql`
          INSERT INTO users (name, email) VALUES (${nameTrimmed}, ${emailLower}) RETURNING id
        `
        userId = newUser[0].id
      }
    }

    // Create magic link (24h)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await sql`
      INSERT INTO magic_links (email, token, expires_at)
      VALUES (${emailLower}, ${token}, ${expiresAt})
    `

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const loginUrl = `${appUrl}/auth/verify?token=${token}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Muscular Christianity <onboarding@resend.dev>',
      to: emailLower,
      subject: 'Your login link',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#191c2d;color:#d0d4e4;border-radius:12px;">
          <h2 style="color:#d0d4e4;margin-top:0;">Muscular Christianity</h2>
          <p style="color:#6d728a;">Click below to log in. This link expires in 24 hours.</p>
          <a href="${loginUrl}"
            style="display:inline-block;background:#A67C52;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;margin:16px 0;text-transform:uppercase;letter-spacing:0.05em;">
            Enter the Gymdom of Heaven
          </a>
          <p style="color:#484d6e;font-size:12px;margin-top:24px;">Or copy this link:<br>${loginUrl}</p>
          <p style="color:#484d6e;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    })

    // suppress unused variable warning
    void userId

    return NextResponse.json({ status: 'sent' })
  } catch (error) {
    console.error('POST /api/auth/request error:', error)
    return NextResponse.json({ error: 'Failed to send login link' }, { status: 500 })
  }
}

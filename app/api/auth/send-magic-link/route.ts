import { NextRequest, NextResponse } from 'next/server'
import { sql, ensureSession } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { email, session_id } = await req.json()

    if (!email || !session_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    await ensureSession(session_id)

    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await sql`
      INSERT INTO magic_links (id, session_id, token, email, expires_at)
      VALUES (${crypto.randomUUID()}, ${session_id}, ${token}, ${email}, ${expiresAt.toISOString()})
    `

    await sql`
      UPDATE sessions SET email = ${email} WHERE id = ${session_id}
    `

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hivebodylog.hive.baby'
    const link = `${appUrl}/auth/verify?token=${token}&session=${session_id}`

    await resend.emails.send({
      from: 'HiveBodyLog <noreply@hive.baby>',
      to: email,
      subject: 'Your HiveBodyLog recovery link',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#fafaf9">
          <div style="background:#fff;border-radius:0.75rem;padding:2rem;border:1px solid #e7e5e4">
            <p style="margin:0 0 0.5rem;font-size:1.1rem;font-weight:700;color:#1c1917">Your health story recovery link</p>
            <p style="margin:0 0 1.5rem;color:#78716c;font-size:0.95rem">Click below to access your health story on this device. Link expires in 1 hour.</p>
            <a href="${link}" style="display:inline-block;padding:0.75rem 1.75rem;background:#0d9488;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:600;font-size:0.95rem">Open my health story</a>
            <p style="margin:1.5rem 0 0;font-size:0.75rem;color:#a8a29e">If you didn't request this, you can safely ignore this email.</p>
            <p style="margin:0.5rem 0 0;font-size:0.75rem;color:#a8a29e">HiveBodyLog · Free forever · No ads · No tracking</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('send-magic-link error:', e)
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 })
  }
}

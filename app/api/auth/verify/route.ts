import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const sessionId = req.nextUrl.searchParams.get('session')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hivebodylog.hive.baby'

  if (!token || !sessionId) {
    return NextResponse.redirect(new URL('/?auth=error', appUrl))
  }

  try {
    const links = await sql`
      SELECT * FROM magic_links
      WHERE token = ${token} AND used = false AND expires_at > now()
      LIMIT 1
    `

    if (links.length === 0) {
      return NextResponse.redirect(new URL('/?auth=expired', appUrl))
    }

    const link = links[0]

    await sql`UPDATE magic_links SET used = true WHERE id = ${link.id}`
    await sql`
      UPDATE sessions SET email = ${link.email}, email_verified = true
      WHERE id = ${link.session_id}
    `

    return NextResponse.redirect(
      new URL(`/auth/verify?session=${link.session_id}&email=${encodeURIComponent(link.email)}`, appUrl)
    )
  } catch (e) {
    console.error('verify error:', e)
    return NextResponse.redirect(new URL('/?auth=error', appUrl))
  }
}

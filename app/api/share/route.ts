import { NextRequest, NextResponse } from 'next/server'
import { sql, ensureSession } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

    await ensureSession(session_id)

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await sql`
      INSERT INTO share_links (token, session_id, expires_at)
      VALUES (${token}, ${session_id}, ${expiresAt})
    `

    return NextResponse.json({ token, expires_at: expiresAt })
  } catch (e) {
    console.error('POST /api/share:', e)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  try {
    const links = await sql`
      SELECT session_id, expires_at, scope_text, entry_ids, salutation FROM share_links
      WHERE token = ${token} AND expires_at > now()
    `
    if (!links.length) return NextResponse.json({ error: 'Link expired or not found' }, { status: 404 })

    const { session_id, expires_at, scope_text, entry_ids, salutation } = links[0] as {
      session_id: string; expires_at: string; scope_text: string | null;
      entry_ids: string[] | null; salutation: string | null
    }

    const hasFilter = Array.isArray(entry_ids) && entry_ids.length > 0

    const [entries, uploads] = await Promise.all([
      hasFilter
        ? sql`
            SELECT id, raw_text, summary, tags, intensity, time_of_day, created_at
            FROM entries WHERE session_id = ${session_id} AND id = ANY(${entry_ids}::text[])
            ORDER BY created_at DESC
          `
        : sql`
            SELECT id, raw_text, summary, tags, intensity, time_of_day, created_at
            FROM entries WHERE session_id = ${session_id}
            ORDER BY created_at DESC LIMIT 50
          `,
      sql`
        SELECT id, file_name, file_type, claude_summary, created_at
        FROM uploads WHERE session_id = ${session_id}
        ORDER BY created_at DESC LIMIT 20
      `,
    ])

    return NextResponse.json({ entries, uploads, expires_at, scope_text, salutation })
  } catch (e) {
    console.error('GET /api/share:', e)
    return NextResponse.json({ error: 'Failed to fetch share data' }, { status: 500 })
  }
}

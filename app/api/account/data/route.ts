import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const [session, entries, uploads] = await Promise.all([
      sql`SELECT id, email, email_verified, created_at FROM sessions WHERE id = ${session_id}`,
      sql`SELECT id, raw_text, structured, summary, follow_up, tags, intensity, time_of_day, created_at FROM entries WHERE session_id = ${session_id} ORDER BY created_at DESC`,
      sql`SELECT id, file_name, file_type, file_size, claude_summary, structured, created_at FROM uploads WHERE session_id = ${session_id} ORDER BY created_at DESC`,
    ])

    if (!session.length) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      session: session[0],
      entries,
      uploads,
    })
  } catch (e) {
    console.error('GET /api/account/data:', e)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

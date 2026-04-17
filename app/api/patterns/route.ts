import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { analyzePatterns } from '@/lib/claude'
import type { Entry } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const rows = await sql`
      SELECT id, session_id, raw_text, structured, summary, follow_up,
             tags, intensity, time_of_day, supplement_assessment, created_at
      FROM entries
      WHERE session_id = ${session_id}
      ORDER BY created_at DESC
      LIMIT 100
    ` as Entry[]

    if (rows.length < 3) {
      return NextResponse.json({
        insufficient: true,
        message: 'Log at least 3 entries to see patterns.',
        count: rows.length,
      })
    }

    const analysis = await analyzePatterns(rows)
    return NextResponse.json(analysis)
  } catch (e) {
    console.error('GET /api/patterns:', e)
    return NextResponse.json({ error: 'Failed to analyse patterns' }, { status: 500 })
  }
}

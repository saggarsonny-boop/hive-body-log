import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import type { Entry } from '@/lib/types'

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const entries = await sql`
      SELECT id, raw_text, structured, summary, tags, intensity, time_of_day,
             supplement_assessment, created_at
      FROM entries
      WHERE session_id = ${session_id}
      ORDER BY created_at ASC
      LIMIT 500
    ` as Entry[]

    return NextResponse.json({ entries })
  } catch (e) {
    console.error('GET /api/export:', e)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { sql, ensureSession } from '@/lib/db'
import { processEntry } from '@/lib/claude'
import type { Entry } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      session_id,
      raw_text,
      tags = [],
      intensity = null,
      time_of_day = null,
      supplement_image = null,
    } = body

    if (!session_id || !raw_text?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      console.error('POST /api/entries: DATABASE_URL not set')
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('POST /api/entries: ANTHROPIC_API_KEY not set')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    await ensureSession(session_id)

    const aiResponse = await processEntry(raw_text, tags, intensity, time_of_day, supplement_image)

    const id = crypto.randomUUID()

    await sql`
      INSERT INTO entries (
        id, session_id, raw_text, structured, summary, follow_up,
        tags, intensity, time_of_day, supplement_image, supplement_assessment
      ) VALUES (
        ${id},
        ${session_id},
        ${raw_text},
        ${aiResponse.structured ? JSON.stringify(aiResponse.structured) : null}::jsonb,
        ${aiResponse.summary},
        ${aiResponse.follow_up},
        ${JSON.stringify(tags)}::jsonb,
        ${intensity},
        ${time_of_day},
        ${supplement_image},
        ${aiResponse.supplement_assessment ? JSON.stringify(aiResponse.supplement_assessment) : null}::jsonb
      )
    `

    const entry: Entry = {
      id,
      session_id,
      raw_text,
      structured: aiResponse.structured ?? null,
      summary: aiResponse.summary,
      follow_up: aiResponse.follow_up,
      tags,
      intensity,
      time_of_day,
      supplement_image: supplement_image ? '[photo]' : null,
      supplement_assessment: aiResponse.supplement_assessment ?? null,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ entry, ai_response: aiResponse })
  } catch (e) {
    console.error('POST /api/entries:', e)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const rows = await sql`
      SELECT
        id, session_id, raw_text, structured, summary, follow_up,
        tags, intensity, time_of_day,
        CASE WHEN supplement_image IS NOT NULL THEN '[photo]' ELSE NULL END AS supplement_image,
        supplement_assessment, created_at
      FROM entries
      WHERE session_id = ${session_id}
      ORDER BY created_at DESC
      LIMIT 200
    `
    return NextResponse.json({ entries: rows })
  } catch (e) {
    console.error('GET /api/entries:', e)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { sql, ensureSession } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const PROMPT = `You are helping someone build their health story from a medical document or image. Extract key information in plain language for the health story timeline.

Return ONLY valid JSON:
{
  "summary": "1-2 sentence plain-language summary of the key finding",
  "key_findings": ["array of specific findings — plain language, no jargon"],
  "document_date": "ISO date if visible, null if not found",
  "document_type": "e.g. Blood test, ECG, X-ray, Discharge summary, Prescription, Referral letter",
  "for_health_story": "2-3 sentence narrative that fits naturally in a personal health timeline"
}

Rules: No diagnosis. No treatment recommendations. Plain language. Pattern literacy only. Tone: calm, factual, human.`

export async function POST(req: NextRequest) {
  try {
    const { session_id, file_name, file_type, file_data, file_size } = await req.json()

    if (!session_id || !file_name || !file_type || !file_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (file_size && file_size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
    }

    await ensureSession(session_id)

    // Build Claude content based on file type
    let content: Anthropic.MessageParam['content']

    if (file_type === 'application/pdf') {
      content = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: file_data },
        } as Anthropic.DocumentBlockParam,
        { type: 'text', text: PROMPT },
      ]
    } else {
      const mediaType = file_type.startsWith('image/') ? file_type as Anthropic.Base64ImageSource['media_type'] : 'image/jpeg'
      content = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: file_data },
        },
        { type: 'text', text: PROMPT },
      ]
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in Claude response')
    const structured = JSON.parse(jsonMatch[0])

    const id = crypto.randomUUID()

    await sql`
      INSERT INTO uploads (id, session_id, file_name, file_type, file_size, claude_summary, structured)
      VALUES (
        ${id}, ${session_id}, ${file_name}, ${file_type}, ${file_size ?? null},
        ${structured.for_health_story}, ${JSON.stringify(structured)}::jsonb
      )
    `

    return NextResponse.json({
      upload: {
        id,
        session_id,
        file_name,
        file_type,
        file_size: file_size ?? null,
        claude_summary: structured.for_health_story,
        structured,
        created_at: new Date().toISOString(),
      },
      structured,
    })
  } catch (e) {
    console.error('POST /api/upload:', e)
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const session_id = req.nextUrl.searchParams.get('session_id')
  if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

  try {
    const rows = await sql`
      SELECT id, session_id, file_name, file_type, file_size, claude_summary, structured, created_at
      FROM uploads
      WHERE session_id = ${session_id}
      ORDER BY created_at DESC
      LIMIT 100
    `
    return NextResponse.json({ uploads: rows })
  } catch (e) {
    console.error('GET /api/upload:', e)
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { sql, ensureSession } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'

// Ensure schema has the enhanced columns
async function ensureShareColumns() {
  await sql`ALTER TABLE share_links ADD COLUMN IF NOT EXISTS scope_text TEXT`
  await sql`ALTER TABLE share_links ADD COLUMN IF NOT EXISTS entry_ids JSONB`
  await sql`ALTER TABLE share_links ADD COLUMN IF NOT EXISTS recipient_email TEXT`
  await sql`ALTER TABLE share_links ADD COLUMN IF NOT EXISTS salutation TEXT`
}

async function scopeEntries(
  scopeText: string,
  entries: { id: string; raw_text: string; summary: string | null; tags: string[]; created_at: string }[]
): Promise<string[]> {
  if (!entries.length) return []

  // If scope says "everything" or is blank-ish, return all
  const lower = scopeText.toLowerCase().trim()
  if (!lower || lower.includes('everything') || lower.includes('all entries') || lower.includes('entire') && lower.includes('history')) {
    return entries.map(e => e.id)
  }

  try {
    const client = new Anthropic()
    const entryList = entries.map(e => ({
      id: e.id,
      date: new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      tags: e.tags,
      summary: (e.summary || e.raw_text).slice(0, 120),
    }))

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are filtering health log entries for a share link. The user wants to share: "${scopeText}"

Here are all their entries (id, date, tags, summary):
${JSON.stringify(entryList, null, 2)}

Return ONLY a JSON array of the IDs that match the scope. Be inclusive — if in doubt, include it. Return the raw JSON array with no explanation.`,
      }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0]) as string[]
    return entries.map(e => e.id)
  } catch {
    return entries.map(e => e.id)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session_id, scope_text, recipient_email, salutation, send_copy } = await req.json()
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

    await ensureSession(session_id)
    await ensureShareColumns()

    // Get all entries for scoping
    const allEntries = await sql`
      SELECT id, raw_text, summary, tags, created_at
      FROM entries WHERE session_id = ${session_id}
      ORDER BY created_at DESC
    ` as { id: string; raw_text: string; summary: string | null; tags: string[]; created_at: string }[]

    const entryIds = scope_text?.trim()
      ? await scopeEntries(scope_text.trim(), allEntries)
      : allEntries.map(e => e.id)

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    await sql`
      INSERT INTO share_links (token, session_id, expires_at, scope_text, entry_ids, recipient_email, salutation)
      VALUES (
        ${token}, ${session_id}, ${expiresAt},
        ${scope_text || null},
        ${JSON.stringify(entryIds)},
        ${recipient_email || null},
        ${salutation || null}
      )
    `

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hivebodylog.hive.baby'
    const shareUrl = `${appUrl}/share/${token}`

    // Send email via Resend
    if (recipient_email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const greeting = salutation ? `${salutation},` : 'Hello,'
      const scopeNote = scope_text ? `<p style="color:#78716c;font-size:0.85rem;margin:0 0 1.25rem">Scope: <em>${scope_text}</em></p>` : ''

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:2rem;background:#0c0a09">
          <div style="background:#1c1917;border-radius:0.75rem;padding:2rem;border:1px solid #292524">
            <p style="margin:0 0 0.5rem;font-size:1rem;color:#f5f5f4">${greeting}</p>
            <p style="margin:0 0 1rem;color:#78716c;font-size:0.9rem">A health story has been shared with you for clinical review.</p>
            ${scopeNote}
            <a href="${shareUrl}" style="display:inline-block;padding:0.75rem 1.75rem;background:#0f766e;color:#ccfbf1;text-decoration:none;border-radius:0.5rem;font-weight:600;font-size:0.95rem">View health record</a>
            <p style="margin:1.5rem 0 0;font-size:0.75rem;color:#57534e">This link expires in 30 days. For clinical review only — not a diagnosis.</p>
            <p style="margin:0.5rem 0 0;font-size:0.75rem;color:#44403c">HiveBodyLog · No ads · No tracking · Free forever</p>
          </div>
        </div>
      `

      const toList: string[] = [recipient_email]

      // Get user's email for CC if send_copy
      if (send_copy) {
        const sessions = await sql`SELECT email FROM sessions WHERE id = ${session_id}`
        const userEmail = (sessions as { email: string | null }[])[0]?.email
        if (userEmail && userEmail !== recipient_email) toList.push(userEmail)
      }

      await resend.emails.send({
        from: 'HiveBodyLog <hive@hive.baby>',
        to: toList,
        subject: 'Health record shared with you',
        html,
      }).catch(err => console.error('Resend error:', err))
    }

    return NextResponse.json({ token, share_url: shareUrl, entry_count: entryIds.length })
  } catch (e) {
    console.error('POST /api/share/send:', e)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  try {
    const { session_id } = await req.json()
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })

    // Cascade deletes via FK: entries, uploads, magic_links, share_links all reference sessions
    await sql`DELETE FROM sessions WHERE id = ${session_id}`

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('DELETE /api/account/delete:', e)
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
  }
}

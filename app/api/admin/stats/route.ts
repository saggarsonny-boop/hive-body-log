import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [accounts, entries, newAccounts, activeUsers] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM sessions`,
      sql`SELECT COUNT(*) AS count FROM entries`,
      sql`SELECT COUNT(*) AS count FROM sessions WHERE created_at >= NOW() - INTERVAL '7 days'`,
      sql`SELECT COUNT(DISTINCT session_id) AS count FROM entries WHERE created_at >= NOW() - INTERVAL '7 days'`,
    ])

    return NextResponse.json({
      total_accounts: Number((accounts as any[])[0].count),
      total_entries: Number((entries as any[])[0].count),
      new_accounts_7d: Number((newAccounts as any[])[0].count),
      active_users_7d: Number((activeUsers as any[])[0].count),
    })
  } catch (e) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  }
}

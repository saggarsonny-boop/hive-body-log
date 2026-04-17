import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export async function ensureSession(sessionId: string): Promise<void> {
  await sql`
    INSERT INTO sessions (id)
    VALUES (${sessionId})
    ON CONFLICT (id) DO NOTHING
  `
}

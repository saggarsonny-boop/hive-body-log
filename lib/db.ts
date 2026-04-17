import { neon } from '@neondatabase/serverless'

// Defer neon() call to request time so process.env.DATABASE_URL is resolved
// from the Vercel runtime, not inlined at build time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  return neon(process.env.DATABASE_URL!)(strings as any, ...values)
}

export async function ensureSession(sessionId: string): Promise<void> {
  await sql`
    INSERT INTO sessions (id)
    VALUES (${sessionId})
    ON CONFLICT (id) DO NOTHING
  `
}

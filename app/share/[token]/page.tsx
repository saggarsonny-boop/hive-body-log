import { notFound } from 'next/navigation'

interface ShareEntry {
  id: string
  raw_text: string
  summary: string | null
  tags: string[]
  intensity: number | null
  time_of_day: string | null
  created_at: string
}

interface ShareUpload {
  id: string
  file_name: string
  file_type: string
  claude_summary: string | null
  created_at: string
}

async function getShareData(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://hivebodylog.hive.baby'
  try {
    const res = await fetch(`${base}/api/share?token=${token}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getShareData(token)
  if (!data) notFound()

  const { entries, uploads, expires_at, scope_text, salutation } = data
  const expiresDate = new Date(expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const combined = [
    ...entries.map((e: ShareEntry) => ({ ...e, _type: 'entry' as const })),
    ...uploads.map((u: ShareUpload) => ({ ...u, _type: 'upload' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-200">
      <header className="border-b border-stone-900 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-200 text-sm">HiveBodyLog</span>
              <span className="text-stone-700 text-xs ml-2">health story</span>
            </div>
            <span className="text-xs text-amber-700 border border-amber-900 rounded-full px-2.5 py-0.5">
              Read-only · Expires {expiresDate}
            </span>
          </div>
          <p className="text-xs text-stone-600 mt-1.5">Shared health record — for clinical review only · Not a diagnosis</p>
        </div>
      </header>

      {(salutation || scope_text) && (
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
            {salutation && <p className="text-stone-300 text-sm font-medium">{salutation},</p>}
            {scope_text && (
              <p className="text-stone-500 text-xs">
                This record covers: <span className="italic text-stone-400">{scope_text}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {combined.length === 0 && (
          <p className="text-stone-600 text-sm text-center py-12">No entries in this health story.</p>
        )}

        {combined.map(item => {
          if (item._type === 'entry') {
            const e = item as ShareEntry & { _type: 'entry' }
            return (
              <div key={e.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {(e.tags || []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-stone-800 text-stone-500 text-xs rounded-full">{tag}</span>
                    ))}
                    {e.time_of_day && (
                      <span className="px-2 py-0.5 bg-stone-800 text-stone-600 text-xs rounded-full">{e.time_of_day}</span>
                    )}
                    {e.intensity !== null && (
                      <span className="px-2 py-0.5 bg-stone-800 text-stone-600 text-xs rounded-full">Intensity {e.intensity}/10</span>
                    )}
                  </div>
                  <span className="text-xs text-stone-600 shrink-0">
                    {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-stone-300 text-sm leading-relaxed">{e.raw_text}</p>
                {e.summary && <p className="text-stone-500 text-xs mt-2 italic leading-relaxed">{e.summary}</p>}
              </div>
            )
          } else {
            const u = item as ShareUpload & { _type: 'upload' }
            return (
              <div key={u.id} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-stone-800 text-stone-500 text-xs rounded-full">Document</span>
                  <span className="text-xs text-stone-600 shrink-0">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-stone-400 text-xs mb-1">{u.file_name}</p>
                {u.claude_summary && <p className="text-stone-300 text-sm leading-relaxed">{u.claude_summary}</p>}
              </div>
            )
          }
        })}
      </main>

      <footer className="border-t border-stone-900 mt-8 py-5 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 text-xs text-stone-700">
          <a href="https://hive.baby/about" className="hover:text-stone-400 transition-colors">A social experiment</a>
          <span>·</span>
          <a href="https://hive.baby/contribute" className="hover:text-stone-400 transition-colors">Contribute</a>
          <span>·</span>
          <a href="https://hive.baby" className="hover:text-stone-400 transition-colors">hive.baby</a>
        </div>
      </footer>
    </div>
  )
}

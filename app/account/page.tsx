'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HiveFooter from '@/components/HiveFooter'

interface AccountData {
  session: { id: string; email: string | null; email_verified: boolean; created_at: string }
  entries: unknown[]
  uploads: unknown[]
  exported_at: string
}

export default function AccountPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem('hbl_session_id')
    const em = localStorage.getItem('hbl_email')
    if (!id) { router.replace('/'); return }
    setSessionId(id)
    setEmail(em)

    fetch(`/api/account/data?session_id=${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  async function exportJSON() {
    if (!sessionId || exporting) return
    setExporting(true)
    try {
      const res = await fetch(`/api/account/data?session_id=${sessionId}`)
      const json = await res.json()
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hivebodylog-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setExporting(false)
  }

  async function deleteAccount() {
    if (!sessionId || deleting) return
    setDeleting(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      if (res.ok) {
        localStorage.clear()
        router.replace('/')
      }
    } catch {}
    setDeleting(false)
  }

  function signOut() {
    localStorage.clear()
    router.replace('/')
  }

  const joinDate = data?.session?.created_at
    ? new Date(data.session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const entryCount = data?.entries?.length ?? 0
  const uploadCount = data?.uploads?.length ?? 0

  return (
    <div className="min-h-screen bg-[#0c0a09]">
      <header className="border-b border-stone-900 px-4 py-4 sticky top-0 bg-[#0c0a09] z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xs text-stone-700 hover:text-stone-500 transition-colors">← Back to my story</a>
          <span className="text-sm font-semibold text-stone-300">Account</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Identity card */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          {loading ? (
            <div className="h-16 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-stone-700 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-900 border border-teal-800 flex items-center justify-center">
                  <span className="text-teal-300 text-sm font-semibold uppercase">
                    {email ? email[0] : '?'}
                  </span>
                </div>
                <div>
                  <p className="text-stone-200 text-sm font-medium">{email || 'Anonymous'}</p>
                  <p className="text-stone-600 text-xs">
                    {data?.session?.email_verified ? '✓ Verified' : email ? 'Email set' : 'Device-only — email not added'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Joined', value: joinDate },
                  { label: 'Entries', value: String(entryCount) },
                  { label: 'Documents', value: String(uploadCount) },
                ].map(item => (
                  <div key={item.label} className="bg-stone-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-stone-600 mb-1">{item.label}</p>
                    <p className="text-stone-300 text-sm font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
              {!email && (
                <div className="mt-4 pt-4 border-t border-stone-800">
                  <p className="text-xs text-amber-600 mb-2">Your story is saved to this device only.</p>
                  <a href="/login" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">Add email to protect it →</a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Data actions */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-800">
            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Your data</p>
          </div>
          <div className="divide-y divide-stone-800">
            <button
              onClick={exportJSON}
              disabled={exporting || !data}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-800/50 transition-colors disabled:opacity-40"
            >
              <div>
                <p className="text-sm text-stone-200">Export all my data</p>
                <p className="text-xs text-stone-600 mt-0.5">Download a complete JSON backup</p>
              </div>
              <span className="text-xs text-teal-600">{exporting ? '…' : '↓'}</span>
            </button>

            <a
              href={sessionId ? `/export?s=${sessionId}&clinician=GP+%2F+Primary+Care` : '#'}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-between px-5 py-4 hover:bg-stone-800/50 transition-colors"
            >
              <div>
                <p className="text-sm text-stone-200">Export clinician summary</p>
                <p className="text-xs text-stone-600 mt-0.5">PDF of your last 90 days</p>
              </div>
              <span className="text-xs text-teal-600">↗</span>
            </a>
          </div>
        </div>

        {/* Account actions */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-800">
            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Account</p>
          </div>
          <div className="divide-y divide-stone-800">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-800/50 transition-colors"
            >
              <p className="text-sm text-stone-400">Sign out</p>
              <span className="text-xs text-stone-600">→</span>
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm text-red-600">Delete all my data</p>
                  <p className="text-xs text-stone-600 mt-0.5">Permanently removes all entries and uploads</p>
                </div>
              </button>
            ) : (
              <div className="px-5 py-4">
                <p className="text-sm text-red-400 mb-3">This permanently deletes everything. Are you sure?</p>
                <div className="flex gap-2">
                  <button
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-900 text-red-200 text-sm rounded-lg hover:bg-red-800 transition-colors disabled:opacity-40"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete everything'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 bg-stone-800 text-stone-400 text-sm rounded-lg hover:bg-stone-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-stone-700 text-center pb-4">
          HiveBodyLog · No ads · No tracking · Free forever
        </p>
      </main>

      <HiveFooter />
    </div>
  )
}

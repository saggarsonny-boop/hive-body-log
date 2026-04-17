'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EntryInput from '@/components/EntryInput'
import AIResponseCard from '@/components/AIResponseCard'
import LogView from '@/components/LogView'
import TimelineView from '@/components/TimelineView'
import PatternsView from '@/components/PatternsView'
import AccountPrompt from '@/components/AccountPrompt'
import type { Entry, AIEntryResponse } from '@/lib/types'

type Tab = 'log' | 'timeline' | 'patterns'

function AuthBanner() {
  const params = useSearchParams()
  const auth = params.get('auth')
  if (!auth) return null
  return (
    <div className={`text-center text-sm px-4 py-2 ${auth === 'expired' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
      {auth === 'expired' ? 'That link has expired. Request a new one.' : 'Something went wrong with the link. Try again.'}
    </div>
  )
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [lastResponse, setLastResponse] = useState<AIEntryResponse | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [showAccountPrompt, setShowAccountPrompt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const entryCountRef = useRef(0)

  useEffect(() => {
    let id = localStorage.getItem('hbl_session_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('hbl_session_id', id)
    }
    setSessionId(id)
    fetch(`/api/entries?session_id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.entries) {
          setEntries(data.entries)
          entryCountRef.current = data.entries.length
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(
    text: string,
    tags: string[],
    intensity: number | null,
    timeOfDay: string | null,
    supplementImage: string | null
  ) {
    if (!sessionId) return
    setIsSubmitting(true)
    setLastResponse(null)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, raw_text: text, tags, intensity, time_of_day: timeOfDay, supplement_image: supplementImage }),
      })
      if (res.ok) {
        const data = await res.json()
        setLastResponse(data.ai_response)
        setEntries(prev => [data.entry, ...prev])
        entryCountRef.current += 1
        if (entryCountRef.current === 3 && !localStorage.getItem('hbl_email_prompted')) {
          setTimeout(() => setShowAccountPrompt(true), 1200)
        }
      }
    } catch {}
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-stone-800 tracking-tight">HiveBodyLog</span>
          <span className="text-xs text-stone-400 hidden sm:inline">health story</span>
        </div>
        <a
          href={`/export?s=${sessionId}`}
          target="_blank"
          rel="noopener"
          className="text-xs text-stone-500 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-50 transition-colors no-print"
        >
          Export PDF
        </a>
      </header>

      <Suspense>
        <AuthBanner />
      </Suspense>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <EntryInput onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        {lastResponse && (
          <AIResponseCard response={lastResponse} onDismiss={() => setLastResponse(null)} />
        )}

        {showAccountPrompt && sessionId && (
          <AccountPrompt
            sessionId={sessionId}
            onDismiss={() => {
              setShowAccountPrompt(false)
              localStorage.setItem('hbl_email_prompted', '1')
            }}
          />
        )}

        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 no-print">
          {(['log', 'timeline', 'patterns'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'log' && <LogView entries={entries} />}
        {activeTab === 'timeline' && <TimelineView entries={entries} />}
        {activeTab === 'patterns' && <PatternsView sessionId={sessionId} />}

        <p className="text-center text-xs text-stone-300 pb-6 no-print">
          HiveBodyLog · Free forever · No ads · No diagnosis
        </p>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense>
      <App />
    </Suspense>
  )
}

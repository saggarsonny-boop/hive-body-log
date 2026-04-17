'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Entry } from '@/lib/types'

// Architecture note: export format is PDF for v1.
// When Universal Document (UD) is live, add ExportFormat toggle here:
// 'Export as PDF' | 'Export as UD'

function groupByDate(entries: Entry[]) {
  const groups = new Map<string, Entry[]>()
  for (const entry of entries) {
    const label = new Date(entry.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(entry)
  }
  return Array.from(groups.entries()).map(([date, entries]) => ({ date, entries }))
}

function ExportContent() {
  const params = useSearchParams()
  const sessionId = params.get('s')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) { setLoading(false); return }
    fetch(`/api/export?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => { setEntries(data.entries || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  useEffect(() => {
    if (!loading && entries.length > 0) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, entries])

  const exportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const groups = groupByDate(entries)

  if (loading) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#78716c' }}>Loading your health story…</div>
  }

  if (!sessionId || entries.length === 0) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#78716c' }}>No entries found.</div>
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1c1917' }}>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #e7e5e4', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700 }}>Patient Health Log Summary</h1>
        <p style={{ margin: '0', fontSize: '0.85rem', color: '#78716c' }}>
          Exported {exportDate} · {entries.length} {entries.length === 1 ? 'entry' : 'entries'} ·
          {' '}{entries.length > 0 ? `${new Date(entries[0].created_at).toLocaleDateString('en-GB')} – ${new Date(entries[entries.length - 1].created_at).toLocaleDateString('en-GB')}` : ''}
        </p>
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fafaf9', borderRadius: '0.5rem', border: '1px solid #e7e5e4', fontSize: '0.75rem', color: '#a8a29e' }}>
          <strong style={{ color: '#78716c' }}>For clinical reference only.</strong> Patient-reported log. Non-diagnostic. Not a medical record.
        </div>
      </div>

      {/* Entries by date */}
      {groups.map(({ date, entries: dayEntries }) => (
        <div key={date} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8a29e', marginBottom: '0.75rem', borderBottom: '1px solid #f5f5f4', paddingBottom: '0.35rem' }}>
            {date}
          </h2>
          {dayEntries.map(entry => (
            <div key={entry.id} style={{ marginBottom: '1rem', paddingLeft: '1rem', borderLeft: '2px solid #e7e5e4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  {entry.summary || entry.raw_text}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#a8a29e', whiteSpace: 'nowrap' }}>
                  {new Date(entry.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  {entry.time_of_day ? ` · ${entry.time_of_day}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {entry.tags?.map((tag: string) => (
                  <span key={tag} style={{ padding: '0.1rem 0.5rem', background: '#f5f5f4', borderRadius: '999px', fontSize: '0.7rem', color: '#78716c' }}>{tag}</span>
                ))}
                {entry.intensity !== null && (
                  <span style={{ padding: '0.1rem 0.5rem', background: '#f0fdf9', borderRadius: '999px', fontSize: '0.7rem', color: '#0f766e' }}>intensity {entry.intensity}/10</span>
                )}
              </div>
              {entry.supplement_assessment && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#78716c', background: '#fafaf9', padding: '0.5rem 0.75rem', borderRadius: '0.4rem' }}>
                  <strong>Supplement:</strong> {entry.supplement_assessment.product_name && `${entry.supplement_assessment.product_name} · `}
                  {entry.supplement_assessment.plain_assessment}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.72rem', color: '#a8a29e', display: 'flex', justifyContent: 'space-between' }}>
        <span>HiveBodyLog · hivebodylog.hive.baby · Free forever</span>
        <span>Patient-reported only · Not a clinical record</span>
      </div>
    </div>
  )
}

export default function ExportPage() {
  return (
    <Suspense>
      <ExportContent />
    </Suspense>
  )
}

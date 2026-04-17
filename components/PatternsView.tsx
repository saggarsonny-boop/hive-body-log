'use client'

import { useEffect, useState } from 'react'
import type { PatternAnalysis } from '@/lib/types'

interface Props {
  sessionId: string | null
}

type State = 'idle' | 'loading' | 'insufficient' | 'done' | 'error'

const TREND_ICONS: Record<string, string> = {
  increasing: '↑',
  decreasing: '↓',
  stable: '→',
}

export default function PatternsView({ sessionId }: Props) {
  const [state, setState] = useState<State>('idle')
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null)
  const [insufficientCount, setInsufficientCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    setState('loading')
    fetch(`/api/patterns?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.insufficient) {
          setInsufficientCount(data.count ?? 0)
          setState('insufficient')
        } else if (data.error) {
          setError(data.error)
          setState('error')
        } else {
          setAnalysis(data)
          setState('done')
        }
      })
      .catch(() => {
        setError('Could not load patterns. Try again.')
        setState('error')
      })
  }, [sessionId])

  if (state === 'loading') {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="w-6 h-6 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin mx-auto" />
        <p className="text-stone-400 text-sm">Analysing your health story…</p>
      </div>
    )
  }

  if (state === 'insufficient') {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500 text-sm font-medium">
          {3 - insufficientCount} more {3 - insufficientCount === 1 ? 'entry' : 'entries'} needed
        </p>
        <p className="text-stone-300 text-xs mt-1">Log at least 3 entries to see patterns.</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="text-center py-12">
        <p className="text-stone-400 text-sm">{error}</p>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Overview</p>
        <p className="text-stone-700 text-sm leading-relaxed">{analysis.overview}</p>
        <p className="mt-2 text-xs text-stone-300">
          Based on entries up to {new Date(analysis.computed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Flags */}
      {analysis.flags?.length > 0 && (
        <div className="space-y-2">
          {analysis.flags.map((flag, i) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <span className="text-amber-500 text-lg leading-none shrink-0 mt-0.5">◎</span>
              <p className="text-amber-800 text-sm leading-snug">{flag.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recurring themes */}
      {analysis.recurring_themes?.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Recurring themes</p>
          <div className="space-y-2.5">
            {analysis.recurring_themes.map((theme, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-stone-700 text-sm font-medium">{theme.theme}</p>
                  <p className="text-stone-400 text-xs">{theme.frequency}</p>
                </div>
                <span className={`text-sm font-bold ${
                  theme.trend === 'increasing' ? 'text-amber-500' :
                  theme.trend === 'decreasing' ? 'text-teal-500' : 'text-stone-400'
                }`}>
                  {TREND_ICONS[theme.trend] ?? '→'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body areas */}
      {analysis.body_areas?.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Body areas mentioned</p>
          <div className="space-y-2">
            {analysis.body_areas.sort((a, b) => b.count - a.count).map((area, i) => {
              const max = Math.max(...analysis.body_areas.map(a => a.count))
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-stone-600 text-sm w-20 shrink-0">{area.area}</span>
                  <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full"
                      style={{ width: `${(area.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-stone-400 w-6 text-right">{area.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-stone-300 pb-4">
        Pattern literacy only · Not a diagnosis · Not medical advice
      </p>
    </div>
  )
}

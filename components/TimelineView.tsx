'use client'

import { useState } from 'react'
import type { Entry } from '@/lib/types'

interface Props {
  entries: Entry[]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(entries: Entry[]): Array<{ dateLabel: string; entries: Entry[] }> {
  const groups = new Map<string, Entry[]>()
  for (const entry of entries) {
    const label = formatDate(entry.created_at)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(entry)
  }
  return Array.from(groups.entries()).map(([dateLabel, entries]) => ({ dateLabel, entries }))
}

const ALL_TAGS = ['Head', 'Neck', 'Chest', 'Gut', 'Back', 'Joints', 'Limbs', 'Skin',
                  'Sleep', 'Mood', 'Pain', 'Energy', 'Digestion', 'Medication', 'Injury', 'Mental']

export default function TimelineView({ entries }: Props) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-400 text-sm">Your timeline will appear here as you log entries.</p>
      </div>
    )
  }

  const usedTags = ALL_TAGS.filter(tag => entries.some(e => e.tags?.includes(tag)))
  const filtered = activeFilter ? entries.filter(e => e.tags?.includes(activeFilter)) : entries
  const groups = groupByDate(filtered)

  return (
    <div>
      {/* Tag filter */}
      {usedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {usedTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveFilter(prev => prev === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === tag
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-8">No entries match this filter.</p>
      ) : (
        <div className="space-y-6">
          {groups.map(({ dateLabel, entries: dayEntries }) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">{dateLabel}</p>
              <div className="space-y-2 border-l-2 border-stone-100 ml-2 pl-4">
                {dayEntries.map(entry => (
                  <div key={entry.id} className="relative">
                    <div className="absolute -left-5 top-2 w-2 h-2 rounded-full bg-stone-300" />
                    <div className="bg-white rounded-xl border border-stone-200 p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-stone-700 text-sm leading-snug flex-1">
                          {entry.summary || entry.raw_text}
                        </p>
                        <span className="text-xs text-stone-300 shrink-0">{formatTime(entry.created_at)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                        {entry.tags?.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-xs">{tag}</span>
                        ))}
                        {entry.intensity !== null && (
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full text-xs font-medium">{entry.intensity}/10</span>
                        )}
                        {entry.supplement_assessment && (
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-xs">📷 supplement</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

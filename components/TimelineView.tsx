'use client'

import { useState } from 'react'
import type { Entry, Upload } from '@/lib/types'

interface Props {
  entries: Entry[]
  uploads: Upload[]
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

type Item = { type: 'entry'; item: Entry; date: string } | { type: 'upload'; item: Upload; date: string }

const ALL_TAGS = ['Head', 'Neck', 'Chest', 'Gut', 'Back', 'Joints', 'Limbs', 'Skin',
                  'Sleep', 'Mood', 'Pain', 'Energy', 'Digestion', 'Medication', 'Injury', 'Mental']

export default function TimelineView({ entries, uploads }: Props) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  if (entries.length === 0 && uploads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600 text-sm">Your timeline will appear here as you log entries.</p>
      </div>
    )
  }

  const usedTags = ALL_TAGS.filter(tag => entries.some(e => e.tags?.includes(tag)))
  const filteredEntries = activeFilter ? entries.filter(e => e.tags?.includes(activeFilter)) : entries

  const all: Item[] = [
    ...filteredEntries.map(e => ({ type: 'entry' as const, item: e, date: e.created_at })),
    ...(!activeFilter ? uploads.map(u => ({ type: 'upload' as const, item: u, date: u.created_at })) : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const groups = new Map<string, Item[]>()
  for (const item of all) {
    const label = formatDate(item.date)
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(item)
  }

  return (
    <div>
      {usedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {usedTags.map(tag => (
            <button key={tag} onClick={() => setActiveFilter(prev => prev === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === tag ? 'bg-stone-300 text-stone-900' : 'bg-stone-800 text-stone-500 hover:text-stone-300'
              }`}>{tag}</button>
          ))}
        </div>
      )}

      {all.length === 0 ? (
        <p className="text-stone-600 text-sm text-center py-8">No entries match this filter.</p>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide mb-3">{dateLabel}</p>
              <div className="space-y-2 border-l-2 border-stone-800 ml-2 pl-4">
                {items.map(({ type, item }) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-5 top-2 w-2 h-2 rounded-full bg-stone-700" />
                    {type === 'entry' ? (
                      <div className="bg-stone-900 rounded-xl border border-stone-800 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-stone-200 text-sm leading-snug flex-1">{(item as Entry).summary || (item as Entry).raw_text}</p>
                          <span className="text-xs text-stone-700 shrink-0">{formatTime(item.created_at)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                          {(item as Entry).tags?.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-stone-800 text-stone-500 rounded-full text-xs">{tag}</span>
                          ))}
                          {(item as Entry).intensity !== null && (
                            <span className="px-2 py-0.5 bg-teal-950 text-teal-500 rounded-full text-xs font-medium">{(item as Entry).intensity}/10</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-stone-900 rounded-xl border border-stone-800 p-3.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-stone-500 uppercase tracking-wide font-medium">
                            📄 {(item as Upload).structured?.document_type || 'Document'}
                          </span>
                          <span className="text-xs text-stone-700 ml-auto">{formatTime(item.created_at)}</span>
                        </div>
                        <p className="text-stone-200 text-sm">
                          {(item as Upload).structured?.for_health_story || (item as Upload).claude_summary}
                        </p>
                      </div>
                    )}
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

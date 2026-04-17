'use client'

import type { Entry } from '@/lib/types'

interface Props {
  entries: Entry[]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export default function LogView({ entries }: Props) {
  const todayEntries = entries.filter(e => isToday(e.created_at))

  if (todayEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-400 text-sm">Nothing logged today yet.</p>
        <p className="text-stone-300 text-xs mt-1">Write your first entry above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Today</p>
      {todayEntries.map(entry => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  )
}

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-stone-700 text-sm leading-snug flex-1">
          {entry.summary || entry.raw_text}
        </p>
        <span className="text-xs text-stone-400 shrink-0 mt-0.5">{formatTime(entry.created_at)}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {entry.tags?.map((tag: string) => (
          <span key={tag} className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-xs">
            {tag}
          </span>
        ))}
        {entry.intensity !== null && (
          <span className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-full text-xs font-medium">
            {entry.intensity}/10
          </span>
        )}
        {entry.time_of_day && (
          <span className="text-xs text-stone-300">{entry.time_of_day}</span>
        )}
        {entry.supplement_image && (
          <span className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full text-xs">📷 supplement</span>
        )}
      </div>

      {entry.follow_up && (
        <p className="mt-2 text-xs text-stone-400 italic">{entry.follow_up}</p>
      )}
    </div>
  )
}

'use client'

import type { Entry, Upload } from '@/lib/types'

interface Props {
  entries: Entry[]
  uploads: Upload[]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

export default function LogView({ entries, uploads }: Props) {
  const todayEntries = entries.filter(e => isToday(e.created_at))
  const todayUploads = uploads.filter(u => isToday(u.created_at))

  if (todayEntries.length === 0 && todayUploads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600 text-sm">Nothing logged today yet.</p>
        <p className="text-stone-700 text-xs mt-1">Write your first entry above.</p>
      </div>
    )
  }

  const combined = [
    ...todayEntries.map(e => ({ type: 'entry' as const, item: e, date: e.created_at })),
    ...todayUploads.map(u => ({ type: 'upload' as const, item: u, date: u.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-600 font-medium uppercase tracking-wide">Today</p>
      {combined.map(({ type, item }) =>
        type === 'entry'
          ? <EntryCard key={item.id} entry={item as Entry} />
          : <UploadCard key={item.id} upload={item as Upload} />
      )}
    </div>
  )
}

function EntryCard({ entry }: { entry: Entry }) {
  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-stone-200 text-sm leading-snug flex-1">{entry.summary || entry.raw_text}</p>
        <span className="text-xs text-stone-600 shrink-0 mt-0.5">{formatTime(entry.created_at)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {entry.tags?.map((tag: string) => (
          <span key={tag} className="px-2 py-0.5 bg-stone-800 text-stone-500 rounded-full text-xs">{tag}</span>
        ))}
        {entry.intensity !== null && (
          <span className="px-2 py-0.5 bg-teal-950 text-teal-500 rounded-full text-xs font-medium border border-teal-900">{entry.intensity}/10</span>
        )}
        {entry.time_of_day && <span className="text-xs text-stone-700">{entry.time_of_day}</span>}
        {entry.supplement_image && <span className="px-2 py-0.5 bg-stone-800 text-stone-500 rounded-full text-xs">📷 supplement</span>}
      </div>
      {entry.follow_up && <p className="mt-2 text-xs text-stone-600 italic">{entry.follow_up}</p>}
    </div>
  )
}

function UploadCard({ upload }: { upload: Upload }) {
  return (
    <div className="bg-stone-900 rounded-xl border border-stone-800 p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-stone-500 text-xs">📄</span>
          <span className="text-stone-400 text-xs font-medium uppercase tracking-wide">
            {upload.structured?.document_type || 'Document'}
          </span>
        </div>
        <span className="text-xs text-stone-600">{formatTime(upload.created_at)}</span>
      </div>
      <p className="text-stone-200 text-sm leading-snug">
        {upload.structured?.for_health_story || upload.claude_summary || upload.file_name}
      </p>
      {upload.structured?.key_findings && upload.structured.key_findings.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {upload.structured.key_findings.slice(0, 3).map((f, i) => (
            <li key={i} className="text-xs text-stone-500 flex gap-1.5"><span className="text-stone-700">·</span>{f}</li>
          ))}
        </ul>
      )}
      <p className="mt-1.5 text-xs text-stone-700">{upload.file_name}</p>
    </div>
  )
}

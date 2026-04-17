'use client'

import { useState } from 'react'
import type { AIEntryResponse } from '@/lib/types'

interface Props {
  response: AIEntryResponse
  onDismiss: () => void
}

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  good:     { label: 'Manufacturing looks good',  color: 'text-teal-300 bg-teal-950 border-teal-800' },
  concerns: { label: 'Some concerns noted',        color: 'text-amber-300 bg-amber-950 border-amber-800' },
  unknown:  { label: 'Quality unclear from label', color: 'text-stone-400 bg-stone-800 border-stone-700' },
}

export default function AIResponseCard({ response, onDismiss }: Props) {
  const [showSupplement, setShowSupplement] = useState(false)
  const sa = response.supplement_assessment

  return (
    <div className="bg-teal-950 border border-teal-900 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-teal-100 font-medium leading-snug">{response.summary}</p>

          {response.follow_up && (
            <p className="mt-2 text-teal-400 text-sm italic">{response.follow_up}</p>
          )}

          {response.structured?.confirmed_tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {response.structured.confirmed_tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-teal-900 text-teal-300 rounded-full text-xs font-medium border border-teal-800">{tag}</span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-sm text-teal-500 font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Saved to your health story
          </div>

          {sa && (
            <div className="mt-3">
              <button onClick={() => setShowSupplement(v => !v)} className="text-xs text-teal-600 font-medium underline underline-offset-2">
                {showSupplement ? 'Hide' : 'View'} supplement assessment
              </button>
              {showSupplement && (
                <div className={`mt-2 rounded-xl border p-3 text-sm ${QUALITY_LABELS[sa.manufacturer_quality]?.color ?? 'bg-stone-800 border-stone-700 text-stone-300'}`}>
                  <div className="font-semibold mb-1">
                    {sa.product_name && <span>{sa.product_name} · </span>}
                    {QUALITY_LABELS[sa.manufacturer_quality]?.label}
                  </div>
                  <p className="mb-2 opacity-90">{sa.plain_assessment}</p>
                  {sa.ingredients_summary && <p className="text-xs mb-2 opacity-70"><strong>Ingredients:</strong> {sa.ingredients_summary}</p>}
                  {sa.red_flags.length > 0 && (
                    <ul className="list-disc list-inside text-xs opacity-80 space-y-0.5">
                      {sa.red_flags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  )}
                  <p className="mt-2 text-xs opacity-50">Manufacturing and ingredient quality only — not a medical assessment.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={onDismiss} className="text-stone-700 hover:text-stone-500 text-xl leading-none shrink-0 mt-0.5">×</button>
      </div>
    </div>
  )
}

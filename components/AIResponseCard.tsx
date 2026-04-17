'use client'

import { useState } from 'react'
import type { AIEntryResponse } from '@/lib/types'

interface Props {
  response: AIEntryResponse
  onDismiss: () => void
}

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  good: { label: 'Manufacturing looks good', color: 'text-green-700 bg-green-50 border-green-200' },
  concerns: { label: 'Some concerns noted', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  unknown: { label: 'Quality unclear from label', color: 'text-stone-600 bg-stone-50 border-stone-200' },
}

export default function AIResponseCard({ response, onDismiss }: Props) {
  const [showSupplement, setShowSupplement] = useState(false)
  const sa = response.supplement_assessment

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {/* Summary */}
          <p className="text-stone-800 font-medium leading-snug">{response.summary}</p>

          {/* Follow-up question */}
          {response.follow_up && (
            <p className="mt-2 text-stone-500 text-sm italic">{response.follow_up}</p>
          )}

          {/* Tags confirmed */}
          {response.structured?.confirmed_tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {response.structured.confirmed_tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Confirmation */}
          <div className="mt-3 flex items-center gap-1.5 text-sm text-teal-700 font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Saved to your health story
          </div>

          {/* Supplement assessment toggle */}
          {sa && (
            <div className="mt-3">
              <button
                onClick={() => setShowSupplement(v => !v)}
                className="text-xs text-teal-600 font-medium underline underline-offset-2"
              >
                {showSupplement ? 'Hide' : 'View'} supplement assessment
              </button>

              {showSupplement && (
                <div className={`mt-2 rounded-xl border p-3 text-sm ${QUALITY_LABELS[sa.manufacturer_quality]?.color ?? 'bg-stone-50 border-stone-200'}`}>
                  <div className="font-semibold mb-1">
                    {sa.product_name && <span>{sa.product_name} · </span>}
                    {QUALITY_LABELS[sa.manufacturer_quality]?.label}
                  </div>
                  <p className="text-stone-700 mb-2">{sa.plain_assessment}</p>
                  {sa.ingredients_summary && (
                    <p className="text-stone-600 text-xs mb-2"><strong>Ingredients:</strong> {sa.ingredients_summary}</p>
                  )}
                  {sa.red_flags.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs font-semibold text-amber-700 mb-0.5">Notes:</p>
                      <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5">
                        {sa.red_flags.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-stone-400">Manufacturing and ingredient quality only — not a safety or medical assessment.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-stone-300 hover:text-stone-500 text-xl leading-none shrink-0 mt-0.5"
        >×</button>
      </div>
    </div>
  )
}

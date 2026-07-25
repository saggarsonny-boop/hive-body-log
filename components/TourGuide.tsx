'use client'

import { useState, useEffect } from 'react'

export interface TourStep {
  target: string
  title: string
  description: string
}

interface Props {
  steps: TourStep[]
  tourKey: string
}

export default function TourGuide({ steps, tourKey }: Props) {
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(tourKey)) {
      const timer = setTimeout(() => setActive(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [tourKey])

  useEffect(() => {
    if (!active) return
    const step = steps[stepIdx]
    if (!step) return
    const el = document.getElementById(step.target)
    if (!el) {
      if (stepIdx < steps.length - 1) setStepIdx(i => i + 1)
      else dismiss()
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setTimeout(() => {
      const r = el.getBoundingClientRect()
      setHighlightRect(r)
      const tooltipWidth = 256
      let top = r.bottom + 10
      let left = r.left + r.width / 2 - tooltipWidth / 2
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8))
      if (top + 150 > window.innerHeight) top = r.top - 160
      setTooltipPos({ top, left })
    }, 320)
  }, [active, stepIdx])

  function next() {
    setTooltipPos(null)
    setHighlightRect(null)
    if (stepIdx < steps.length - 1) setStepIdx(i => i + 1)
    else dismiss()
  }

  function dismiss() {
    setActive(false)
    setTooltipPos(null)
    setHighlightRect(null)
    localStorage.setItem(tourKey, '1')
  }

  const step = steps[stepIdx]

  if (!active) return (
    <button
      onClick={() => { setStepIdx(0); setActive(true) }}
      title="How to use this"
      style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 50,
        background: 'rgba(28,20,14,0.9)', border: '1px solid rgba(217,119,6,0.3)',
        borderRadius: 20, padding: '6px 11px', color: 'rgb(217,119,6,0.6)',
        fontSize: 12, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit', backdropFilter: 'blur(4px)', lineHeight: 1,
      }}
    >?</button>
  )

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={dismiss} />

      {highlightRect && (
        <div
          className="fixed z-[101] pointer-events-none rounded-xl"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 0 2px rgb(217 119 6 / 0.7), 0 0 24px 6px rgb(217 119 6 / 0.15)',
          }}
        />
      )}

      {tooltipPos && step && (
        <div
          className="fixed z-[102] bg-stone-900 border border-amber-800 rounded-xl shadow-2xl p-4"
          style={{ top: tooltipPos.top, left: tooltipPos.left, width: 256 }}
        >
          <p className="text-amber-400 text-xs font-semibold mb-1">{step.title}</p>
          <p className="text-stone-400 text-xs leading-relaxed mb-3">{step.description}</p>
          <div className="flex items-center justify-between">
            <button onClick={dismiss} className="text-xs text-stone-700 hover:text-stone-500 transition-colors">
              Skip tour
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] text-stone-700">{stepIdx + 1}/{steps.length}</span>
              <button onClick={next} className="text-xs text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                {stepIdx < steps.length - 1 ? 'Next →' : 'Done ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
// useRef retained for textareaRef
import { getStrings, type LangCode } from '@/lib/i18n'

const BODY_TAGS = ['Head', 'Neck', 'Chest', 'Gut', 'Back', 'Joints', 'Limbs', 'Skin']
const CATEGORY_TAGS = ['Sleep', 'Mood', 'Pain', 'Energy', 'Digestion', 'Medication', 'Injury', 'Mental']

interface Props {
  onSubmit: (text: string, tags: string[], intensity: number | null, timeOfDay: string | null, supplementImage: string | null) => Promise<void>
  isSubmitting: boolean
  lang?: LangCode
}

function getCurrentTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  if (h < 21) return 'Evening'
  return 'Night'
}

export default function EntryInput({ onSubmit, isSubmitting, lang = 'en' }: Props) {
  const t = getStrings(lang)
  const placeholders = t.placeholders
  const [text, setText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [intensity, setIntensity] = useState<number | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<string>(getCurrentTimeOfDay())
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setFadingOut(true)
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % placeholders.length)
        setFadingOut(false)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [placeholders.length])

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit() {
    if (!text.trim() || isSubmitting) return
    await onSubmit(text.trim(), selectedTags, intensity, timeOfDay, null)
    setText('')
    setSelectedTags([])
    setIntensity(null)
    textareaRef.current?.focus()
  }

  const showIntensity = selectedTags.some(t => ['Pain', 'Injury', 'Energy', 'Mood'].includes(t))

  return (
    <div>
      <textarea
        id="entry-input-text"
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
        placeholder={placeholders[placeholderIdx]}
        rows={4}
        style={{ transition: 'opacity 0.3s', opacity: fadingOut && !text ? 0.3 : 1 }}
        className="w-full resize-none text-stone-100 placeholder-stone-700 text-base leading-relaxed bg-transparent outline-none"
      />

      <div className="mt-4 border-t border-stone-800 pt-4">
        {/* Body tags */}
        <div id="entry-tags" className="flex flex-wrap gap-1.5 mb-2">
          {BODY_TAGS.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-teal-900 text-teal-300 border border-teal-700'
                  : 'bg-stone-800 text-stone-500 border border-transparent hover:text-stone-300'
              }`}>{tag}</button>
          ))}
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TAGS.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-teal-900 text-teal-300 border border-teal-700'
                  : 'bg-stone-800 text-stone-500 border border-transparent hover:text-stone-300'
              }`}>{tag}</button>
          ))}
        </div>

        {showIntensity && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-stone-500 font-medium">{t.intensity}</span>
              <span className="text-xs text-stone-600">{intensity !== null ? `${intensity}/10` : '—'}</span>
            </div>
            <input type="range" min={0} max={10} step={1} value={intensity ?? 5}
              onChange={e => setIntensity(Number(e.target.value))}
              onClick={() => { if (intensity === null) setIntensity(5) }}
              className="w-full h-1.5 cursor-pointer" />
            <div className="flex justify-between text-xs text-stone-700 mt-0.5"><span>0</span><span>5</span><span>10</span></div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          {/* Time of day */}
          <div id="entry-timeofday" className="flex gap-1">
            {t.timeOfDay.map(tod => (
              <button key={tod} onClick={() => setTimeOfDay(tod)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  timeOfDay === tod ? 'bg-stone-700 text-stone-200' : 'text-stone-600 hover:text-stone-400'
                }`}>{tod}</button>
            ))}
          </div>

          <button id="entry-save-btn" onClick={handleSubmit} disabled={!text.trim() || isSubmitting}
            className="px-4 py-2 bg-teal-700 text-teal-100 text-sm font-semibold rounded-xl disabled:opacity-30 hover:bg-teal-600 active:scale-95 transition-all">
            {isSubmitting ? t.saving : t.saveCta}
          </button>
        </div>
      </div>
    </div>
  )
}

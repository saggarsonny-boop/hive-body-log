'use client'

import { useState, useEffect, useRef } from 'react'

const PLACEHOLDERS = [
  'Write what happened, where in the body, and when.',
  'If you are not sure it matters, write it anyway.',
]

const BODY_TAGS = ['Head', 'Neck', 'Chest', 'Gut', 'Back', 'Joints', 'Limbs', 'Skin']
const CATEGORY_TAGS = ['Sleep', 'Mood', 'Pain', 'Energy', 'Digestion', 'Medication', 'Injury', 'Mental']
const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Night']

interface Props {
  onSubmit: (
    text: string,
    tags: string[],
    intensity: number | null,
    timeOfDay: string | null,
    supplementImage: string | null
  ) => Promise<void>
  isSubmitting: boolean
}

function getCurrentTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  if (h < 21) return 'Evening'
  return 'Night'
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 1024
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height / width) * maxDim; width = maxDim }
        else { width = (width / height) * maxDim; height = maxDim }
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      URL.revokeObjectURL(url)
      resolve(base64)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function EntryInput({ onSubmit, isSubmitting }: Props) {
  const [text, setText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [intensity, setIntensity] = useState<number | null>(null)
  const [timeOfDay, setTimeOfDay] = useState<string>(getCurrentTimeOfDay())
  const [supplementImage, setSupplementImage] = useState<string | null>(null)
  const [supplementPreview, setSupplementPreview] = useState<string | null>(null)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [showIntensity, setShowIntensity] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  function toggleTag(tag: string) {
    setSelectedTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      if (!showIntensity && (next.includes('Pain') || next.includes('Injury'))) setShowIntensity(true)
      return next
    })
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSupplementPreview(URL.createObjectURL(file))
    const compressed = await compressImage(file)
    setSupplementImage(compressed)
  }

  async function handleSubmit() {
    if (!text.trim() || isSubmitting) return
    await onSubmit(text.trim(), selectedTags, intensity, timeOfDay, supplementImage)
    setText('')
    setSelectedTags([])
    setIntensity(null)
    setSupplementImage(null)
    setSupplementPreview(null)
    setShowIntensity(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    textareaRef.current?.focus()
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
        placeholder={PLACEHOLDERS[placeholderIdx]}
        rows={4}
        className="w-full resize-none text-stone-800 placeholder-stone-300 text-base leading-relaxed bg-transparent outline-none"
      />

      {/* Supplement photo preview */}
      {supplementPreview && (
        <div className="mt-3 flex items-center gap-3">
          <img src={supplementPreview} alt="Supplement" className="h-16 w-16 object-cover rounded-lg border border-stone-200" />
          <div>
            <p className="text-xs font-medium text-stone-600">Supplement photo added</p>
            <p className="text-xs text-stone-400">Claude will assess manufacturing quality</p>
          </div>
          <button
            onClick={() => { setSupplementImage(null); setSupplementPreview(null) }}
            className="ml-auto text-stone-300 hover:text-stone-500 text-lg leading-none"
          >×</button>
        </div>
      )}

      {/* Separator */}
      <div className="mt-4 border-t border-stone-100 pt-4">

        {/* Body tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {BODY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-teal-100 text-teal-700 border border-teal-300'
                  : 'bg-stone-100 text-stone-500 border border-transparent hover:bg-stone-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-teal-100 text-teal-700 border border-teal-300'
                  : 'bg-stone-100 text-stone-500 border border-transparent hover:bg-stone-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Intensity slider */}
        {(showIntensity || selectedTags.some(t => ['Pain', 'Injury', 'Energy', 'Mood'].includes(t))) && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-500 font-medium">Intensity</span>
              <span className="text-xs text-stone-400">{intensity !== null ? `${intensity}/10` : 'not set'}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={intensity ?? 5}
              onChange={e => setIntensity(Number(e.target.value))}
              onClick={() => { if (intensity === null) setIntensity(5) }}
              className="w-full accent-teal-600 h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-stone-300 mt-0.5">
              <span>0</span><span>5</span><span>10</span>
            </div>
          </div>
        )}

        {/* Time of day + actions row */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-1">
            {TIME_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setTimeOfDay(t)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  timeOfDay === t
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Supplement photo button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Add supplement photo"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-teal-700 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Saving…' : 'Save to my health story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

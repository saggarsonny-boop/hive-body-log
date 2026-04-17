'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EntryInput from '@/components/EntryInput'
import AIResponseCard from '@/components/AIResponseCard'
import LogView from '@/components/LogView'
import TimelineView from '@/components/TimelineView'
import PatternsView from '@/components/PatternsView'
import AccountPrompt from '@/components/AccountPrompt'
import HiveFooter from '@/components/HiveFooter'
import type { Entry, Upload, AIEntryResponse } from '@/lib/types'
import { detectLang, getStrings, SUPPORTED_LANGS, type LangCode } from '@/lib/i18n'

type Tab = 'log' | 'timeline' | 'patterns'
type EntryMode = 'type' | 'upload' | 'photo'

const CLINICIAN_TYPES = [
  'GP / Primary Care',
  'Emergency / A&E / ER',
  'Specialist / Consultant',
  'Psychologist / Therapist',
  'Pharmacist',
  'Dentist',
]

const PHOTO_TYPES = ['Supplement', 'Medication', 'Food / Ingredients', 'Wound / Rash', 'Other']

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 1280
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height / width) * maxDim; width = maxDim }
        else { width = (width / height) * maxDim; height = maxDim }
      }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82).split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function AuthBanner() {
  const params = useSearchParams()
  const auth = params.get('auth')
  if (!auth) return null
  return (
    <div className={`text-center text-sm px-4 py-2 border-b ${auth === 'expired' ? 'bg-amber-950 text-amber-400 border-amber-900' : 'bg-red-950 text-red-400 border-red-900'}`}>
      {auth === 'expired' ? 'That link has expired. Request a new one.' : 'Something went wrong with the link. Try again.'}
    </div>
  )
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [uploads, setUploads] = useState<Upload[]>([])
  const [lastResponse, setLastResponse] = useState<AIEntryResponse | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [entryMode, setEntryMode] = useState<EntryMode>('type')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoType, setPhotoType] = useState(PHOTO_TYPES[0])
  const [photoNote, setPhotoNote] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [lang, setLang] = useState<LangCode>('en')
  const [savedEmail, setSavedEmail] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const t = getStrings(lang)
  const isRTL = t.dir === 'rtl'

  useEffect(() => {
    const detectedLang = detectLang()
    setLang(detectedLang)
    document.documentElement.dir = getStrings(detectedLang).dir
    document.documentElement.lang = detectedLang

    let id = localStorage.getItem('hbl_session_id')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('hbl_session_id', id) }
    setSessionId(id)
    setSavedEmail(localStorage.getItem('hbl_email'))

    fetch(`/api/entries?session_id=${id}`).then(r => r.json()).then(d => { if (d.entries) setEntries(d.entries) }).catch(() => {})
    fetch(`/api/upload?session_id=${id}`).then(r => r.json()).then(d => { if (d.uploads) setUploads(d.uploads) }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleEntrySubmit(text: string, tags: string[], intensity: number | null, timeOfDay: string | null, supplementImage: string | null) {
    if (!sessionId) return
    setIsSubmitting(true); setLastResponse(null)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, raw_text: text, tags, intensity, time_of_day: timeOfDay, supplement_image: supplementImage }),
      })
      if (res.ok) {
        const data = await res.json()
        setLastResponse(data.ai_response)
        setEntries(prev => [data.entry, ...prev])
      }
    } catch {}
    setIsSubmitting(false)
  }

  async function handleFileUpload(file: File) {
    if (!sessionId) return
    setUploadStatus('processing')
    try {
      const isPdf = file.type === 'application/pdf'
      const fileData = isPdf ? await fileToBase64(file) : await compressImageFile(file)
      const res = await fetch('/api/upload', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, file_name: file.name, file_type: file.type, file_data: fileData, file_size: file.size }),
      })
      if (res.ok) {
        const data = await res.json()
        setUploads(prev => [data.upload, ...prev])
        setLastResponse({ summary: data.structured.for_health_story, follow_up: '', structured: { what: data.structured.summary, body_part: null, when_it_happened: data.structured.document_date || '', confirmed_tags: [data.structured.document_type] } })
        setUploadStatus('done')
        setTimeout(() => setUploadStatus('idle'), 2000)
      } else { setUploadStatus('error') }
    } catch { setUploadStatus('error') }
  }

  async function handlePhotoSubmit() {
    if (!sessionId || !photoBase64) return
    setIsSubmitting(true); setLastResponse(null)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, raw_text: `[Photo: ${photoType}]${photoNote ? ' ' + photoNote : ''}`, tags: [photoType], intensity: null, time_of_day: null, supplement_image: photoBase64 }),
      })
      if (res.ok) {
        const data = await res.json()
        setLastResponse(data.ai_response)
        setEntries(prev => [data.entry, ...prev])
        setPhotoPreview(null); setPhotoBase64(null); setPhotoNote('')
      }
    } catch {}
    setIsSubmitting(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [sessionId])

  return (
    <div className="min-h-screen bg-[#0c0a09]" dir={t.dir}>
      {/* Header */}
      <header className="bg-[#0c0a09] border-b border-stone-900 px-4 py-3 flex items-center justify-between sticky top-0 z-20 no-print">
        <div className="flex items-center gap-3">
          <a href="https://hive.baby" className="text-xs text-stone-700 hover:text-stone-500 transition-colors">{t.backToPlanet}</a>
          <span className="text-stone-800">·</span>
          <span className="font-semibold text-stone-200 tracking-tight text-sm">{t.appName}</span>
          <span className="text-xs text-stone-700 hidden sm:inline">{t.tagline}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <select
            value={lang}
            onChange={e => { const l = e.target.value as LangCode; setLang(l); localStorage.setItem('hbl_lang', l); document.documentElement.dir = getStrings(l).dir; document.documentElement.lang = l }}
            className="bg-transparent text-stone-700 text-xs border-none outline-none cursor-pointer hover:text-stone-400"
            aria-label="Language"
          >
            {SUPPORTED_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>

          {/* Export with clinician dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="text-xs text-stone-600 border border-stone-800 rounded-lg px-3 py-1.5 hover:text-stone-400 hover:border-stone-700 transition-colors flex items-center gap-1"
            >
              {t.exportLabel}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-stone-900 border border-stone-800 rounded-xl shadow-xl z-30 min-w-[220px] py-1 overflow-hidden">
                {CLINICIAN_TYPES.map(type => (
                  <a
                    key={type}
                    href={`/export?s=${sessionId}&clinician=${encodeURIComponent(type)}`}
                    target="_blank"
                    rel="noopener"
                    onClick={() => setShowExportMenu(false)}
                    className="block px-4 py-2.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition-colors"
                  >
                    {type}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <Suspense><AuthBanner /></Suspense>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">

        {/* Entry mode card */}
        <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
          {/* Mode tabs */}
          <div className="flex border-b border-stone-800">
            {(['type', 'upload', 'photo'] as EntryMode[]).map(mode => (
              <button key={mode} onClick={() => setEntryMode(mode)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  entryMode === mode ? 'text-teal-400 border-b-2 border-teal-600 bg-stone-900' : 'text-stone-600 hover:text-stone-400 bg-stone-950'
                }`}>
                {mode === 'type' ? t.modeType : mode === 'upload' ? t.modeUpload : t.modePhoto}
              </button>
            ))}
          </div>

          {/* TYPE mode */}
          {entryMode === 'type' && (
            <div className="p-5">
              <EntryInput onSubmit={handleEntrySubmit} isSubmitting={isSubmitting} lang={lang} />
            </div>
          )}

          {/* UPLOAD mode */}
          {entryMode === 'upload' && (
            <div className="p-5">
              <div
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => uploadInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-teal-600 bg-teal-950/30' : 'border-stone-700 hover:border-stone-600'
                }`}
              >
                {uploadStatus === 'processing' ? (
                  <div className="space-y-2">
                    <div className="w-6 h-6 border-2 border-stone-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
                    <p className="text-stone-500 text-sm">{t.uploadProcessing}</p>
                  </div>
                ) : uploadStatus === 'done' ? (
                  <div className="space-y-1">
                    <p className="text-teal-400 text-sm font-medium">{t.savedConfirm}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-stone-400 text-sm font-medium">{t.uploadDrop}</p>
                    <p className="text-stone-700 text-xs">{t.uploadBrowse}</p>
                    {uploadStatus === 'error' && <p className="text-red-500 text-xs mt-2">Failed to process. Try again.</p>}
                  </div>
                )}
              </div>
              <input ref={uploadInputRef} type="file" accept=".pdf,image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }} />
            </div>
          )}

          {/* PHOTO mode */}
          {entryMode === 'photo' && (
            <div className="p-5 space-y-4">
              {/* Photo type selector */}
              <div className="flex flex-wrap gap-1.5">
                {PHOTO_TYPES.map(pt => (
                  <button key={pt} onClick={() => setPhotoType(pt)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      photoType === pt ? 'bg-teal-900 text-teal-300 border border-teal-700' : 'bg-stone-800 text-stone-500 hover:text-stone-300'
                    }`}>{pt}</button>
                ))}
              </div>

              {/* Photo capture */}
              {!photoPreview ? (
                <button onClick={() => photoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-stone-700 rounded-xl p-10 text-center hover:border-stone-600 transition-colors">
                  <p className="text-stone-400 text-sm">{t.photoCapture}</p>
                  <p className="text-stone-700 text-xs mt-1">JPEG, PNG, HEIC</p>
                </button>
              ) : (
                <div className="relative">
                  <img src={photoPreview} alt="Photo" className="w-full rounded-xl max-h-48 object-cover" />
                  <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null) }}
                    className="absolute top-2 right-2 bg-stone-900/80 text-stone-300 rounded-full w-7 h-7 flex items-center justify-center text-sm">×</button>
                </div>
              )}

              <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]; if (!file) return
                  setPhotoPreview(URL.createObjectURL(file))
                  setPhotoBase64(await compressImageFile(file))
                  e.target.value = ''
                }} />

              <input value={photoNote} onChange={e => setPhotoNote(e.target.value)}
                placeholder="Optional note about this photo…"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-teal-700" />

              <button onClick={handlePhotoSubmit} disabled={!photoBase64 || isSubmitting}
                className="w-full py-2.5 bg-teal-700 text-teal-100 text-sm font-semibold rounded-xl disabled:opacity-30 hover:bg-teal-600 transition-colors">
                {isSubmitting ? t.saving : t.saveCta}
              </button>
            </div>
          )}
        </div>

        {/* AI response card */}
        {lastResponse && <AIResponseCard response={lastResponse} onDismiss={() => setLastResponse(null)} />}

        {/* Account section */}
        {sessionId && (
          <div className="px-1">
            <AccountPrompt sessionId={sessionId} emailSaved={savedEmail} />
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 bg-stone-950 rounded-xl p-1 border border-stone-900 no-print">
          {(['log', 'timeline', 'patterns'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === tab ? 'bg-stone-800 text-stone-200' : 'text-stone-700 hover:text-stone-500'
              }`}>
              {tab === 'log' ? t.tabLog : tab === 'timeline' ? t.tabTimeline : t.tabPatterns}
            </button>
          ))}
        </div>

        {activeTab === 'log' && <LogView entries={entries} uploads={uploads} />}
        {activeTab === 'timeline' && <TimelineView entries={entries} uploads={uploads} />}
        {activeTab === 'patterns' && <PatternsView sessionId={sessionId} />}
      </main>

      <HiveFooter />
    </div>
  )
}

export default function Home() {
  return <Suspense><App /></Suspense>
}

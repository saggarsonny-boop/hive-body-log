'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EntryInput from '@/components/EntryInput'
import AIResponseCard from '@/components/AIResponseCard'
import LogView from '@/components/LogView'
import TimelineView from '@/components/TimelineView'
import PatternsView from '@/components/PatternsView'
import HiveFooter from '@/components/HiveFooter'
import TourGuide from '@/components/TourGuide'
import AutoDemo from '@/components/AutoDemo'
import type { Entry, Upload, AIEntryResponse } from '@/lib/types'
import { detectLang, getStrings, SUPPORTED_LANGS, type LangCode } from '@/lib/i18n'

type Tab = 'log' | 'timeline' | 'patterns'
type EntryMode = 'type' | 'upload' | 'photo'
type AppStep = 'onboarding' | 'account_setup' | 'main'

const CLINICIAN_TYPES = [
  'GP / Primary Care',
  'Emergency / A&E / ER',
  'Specialist / Consultant',
  'Psychologist / Therapist',
  'Pharmacist',
  'Dentist',
]

const PHOTO_TYPES = ['Supplement', 'Medication', 'Food / Ingredients', 'Wound / Rash', 'Other']

const TOUR_STEPS = [
  { target: 'mode-selector', title: 'Three ways to add to your story', description: 'Type a note, upload a document, or take a photo. Pick what fits.' },
  { target: 'entry-input-text', title: 'Describe anything', description: 'Symptoms, how you feel, what you took, what you ate. No diagnosis. Just your story.' },
  { target: 'entry-tags', title: 'Quick tags', description: 'Tap to tag a body area or category. Helps with pattern analysis later.' },
  { target: 'entry-timeofday', title: 'When did this happen?', description: 'Auto-selected based on the time. Tap to change.' },
  { target: 'entry-save-btn', title: 'Add to your story', description: 'Every entry builds your health picture over time.' },
  { target: 'tab-bar', title: 'Your story grows here', description: 'Log is today. Timeline is your history. Patterns is the bigger picture.' },
  { target: 'export-btn', title: 'Share with any clinician', description: 'Export a tailored PDF for your GP, specialist, or any healthcare professional.' },
]

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

function computeWeeklySummary(entries: Entry[]) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weekEntries = entries.filter(e => new Date(e.created_at) >= weekAgo)
  if (weekEntries.length < 3) return null
  const tagCounts: Record<string, number> = {}
  weekEntries.forEach(e => { (e.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1 }) })
  const uniqueDays = new Set(weekEntries.map(e => new Date(e.created_at).toDateString())).size
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag)
  return { entryCount: weekEntries.length, uniqueDays, topTags }
}

function detectRepeatedSymptoms(entries: Entry[]) {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const recent = entries.filter(e => new Date(e.created_at) >= twoWeeksAgo)
  const tagDays: Record<string, Set<string>> = {}
  recent.forEach(e => {
    const day = new Date(e.created_at).toDateString()
    ;(e.tags || []).forEach(tag => {
      if (!tagDays[tag]) tagDays[tag] = new Set()
      tagDays[tag].add(day)
    })
  })
  return Object.entries(tagDays)
    .filter(([, days]) => days.size >= 3)
    .map(([tag, days]) => ({ tag, days: days.size }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 2)
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

function AccountSetupOverlay({ sessionId, onDone, onSkip }: { sessionId: string; onDone: (email: string) => void; onSkip: () => void }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleProtect() {
    if (!email.trim() || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), session_id: sessionId }),
      })
      if (!res.ok) throw new Error()
      localStorage.setItem('hbl_email', email.trim())
      localStorage.setItem('hbl_email_prompted', '1')
      setState('sent')
      setTimeout(() => onDone(email.trim()), 2000)
    } catch {
      setState('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0a09]/95 flex items-center justify-center px-4">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        {state === 'sent' ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-stone-200 font-semibold text-lg mb-1">Your story is protected</p>
            <p className="text-stone-500 text-sm">Check {email} for your access link.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-stone-100 text-lg font-semibold mb-2">Your health story, protected</h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                Add your email to keep your story safe across devices. No password. No tracking. Just a magic link.
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleProtect() }}
                autoFocus
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 outline-none focus:border-teal-700 text-sm transition-colors"
              />
              <button
                onClick={handleProtect}
                disabled={!email.trim() || state === 'sending'}
                className="w-full py-3 bg-teal-700 text-teal-100 font-semibold rounded-xl disabled:opacity-40 hover:bg-teal-600 transition-colors text-sm"
              >
                {state === 'sending' ? 'Sending…' : 'Protect my story'}
              </button>
              {state === 'error' && <p className="text-amber-600 text-xs text-center">We&apos;re still setting up email delivery — try again in a few hours.</p>}
            </div>

            <button
              onClick={onSkip}
              className="w-full mt-3 text-xs text-stone-600 hover:text-stone-400 transition-colors py-1"
            >
              Skip for now — story saved to this device only
            </button>
          </>
        )}
      </div>
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
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoType, setPhotoType] = useState(PHOTO_TYPES[0])
  const [photoNote, setPhotoNote] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [lang, setLang] = useState<LangCode>('en')
  const [savedEmail, setSavedEmail] = useState<string | null>(null)
  const [appStep, setAppStep] = useState<AppStep>('main')
  const [showDeviceBanner, setShowDeviceBanner] = useState(false)
  const [reminderDue, setReminderDue] = useState<string | null>(null)
  const [showReminderPrompt, setShowReminderPrompt] = useState<string | null>(null)
  const [weekSummary, setWeekSummary] = useState<{ entryCount: number; uniqueDays: number; topTags: string[] } | null>(null)
  const [showWeeklySummary, setShowWeeklySummary] = useState(false)
  const [symptomNotices, setSymptomNotices] = useState<{ tag: string; days: number }[]>([])
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const t = getStrings(lang)

  useEffect(() => {
    const detectedLang = detectLang()
    setLang(detectedLang)
    document.documentElement.dir = getStrings(detectedLang).dir
    document.documentElement.lang = detectedLang

    let id = localStorage.getItem('hbl_session_id')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('hbl_session_id', id) }
    setSessionId(id)

    const em = localStorage.getItem('hbl_email')
    setSavedEmail(em)

    const onboarded = localStorage.getItem('hbl_onboarded')
    const accountSetupSeen = localStorage.getItem('hbl_account_setup_seen')

    if (!onboarded) {
      setAppStep('onboarding')
    } else if (!em && !accountSetupSeen) {
      // Return visitor who never saw account setup
      setAppStep('account_setup')
      localStorage.setItem('hbl_account_setup_seen', '1')
    } else {
      setAppStep('main')
      if (!em && typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('hbl_banner_dismissed')) {
        setShowDeviceBanner(true)
      }
    }

    const reminderAt = localStorage.getItem('hbl_reminder_at')
    if (reminderAt && Date.now() >= new Date(reminderAt).getTime()) {
      setReminderDue(localStorage.getItem('hbl_reminder_label') || 'medication')
      localStorage.removeItem('hbl_reminder_at')
      localStorage.removeItem('hbl_reminder_label')
    }

    fetch(`/api/entries?session_id=${id}`).then(r => r.json()).then(d => { if (d.entries) setEntries(d.entries) }).catch(() => {})
    fetch(`/api/upload?session_id=${id}`).then(r => r.json()).then(d => { if (d.uploads) setUploads(d.uploads) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (entries.length === 0) return
    setSymptomNotices(detectRepeatedSymptoms(entries))
    const today = new Date()
    const weekKey = `${today.getFullYear()}-W${Math.ceil(today.getDate() / 7)}`
    if (today.getDay() === 0 || localStorage.getItem('hbl_weekly_key') !== weekKey) {
      const summary = computeWeeklySummary(entries)
      if (summary) {
        setWeekSummary(summary)
        setShowWeeklySummary(true)
        localStorage.setItem('hbl_weekly_key', weekKey)
      }
    }
  }, [entries])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function dismissOnboarding() {
    localStorage.setItem('hbl_onboarded', '1')
    const em = localStorage.getItem('hbl_email')
    if (!em) {
      localStorage.setItem('hbl_account_setup_seen', '1')
      setAppStep('account_setup')
    } else {
      setAppStep('main')
    }
  }

  function handleAccountSetupDone(email: string) {
    setSavedEmail(email)
    setShowDeviceBanner(false)
    setAppStep('main')
  }

  function handleAccountSetupSkip() {
    setAppStep('main')
    if (typeof sessionStorage !== 'undefined') {
      // Don't dismiss banner — show it this session since they just skipped
    }
    setShowDeviceBanner(true)
  }

  function dismissBanner() {
    setShowDeviceBanner(false)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('hbl_banner_dismissed', '1')
    }
  }

  function setReminder(label: string, hours: number) {
    const at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    localStorage.setItem('hbl_reminder_at', at)
    localStorage.setItem('hbl_reminder_label', label)
    setShowReminderPrompt(null)
  }

  async function createShareLink() {
    if (!sessionId || sharing) return
    setSharing(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      if (res.ok) {
        const data = await res.json()
        const url = `${window.location.origin}/share/${data.token}`
        setShareLink(url)
        await navigator.clipboard.writeText(url).catch(() => {})
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 3000)
      }
    } catch {}
    setSharing(false)
  }

  async function handleEntrySubmit(text: string, tags: string[], intensity: number | null, timeOfDay: string | null, supplementImage: string | null) {
    if (!sessionId) return
    setIsSubmitting(true); setLastResponse(null); setSubmitError(null)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, raw_text: text, tags, intensity, time_of_day: timeOfDay, supplement_image: supplementImage }),
      })
      if (res.ok) {
        const data = await res.json()
        setLastResponse(data.ai_response)
        setEntries(prev => [data.entry, ...prev])
        if (tags.includes('Medication')) {
          setShowReminderPrompt(text.slice(0, 60))
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.')
    }
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
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const MODE_CONFIG = {
    type: {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      label: t.modeType,
      desc: t.modeTypeDesc,
    },
    upload: {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: t.modeUpload,
      desc: t.modeUploadDesc,
    },
    photo: {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: t.modePhoto,
      desc: t.modePhotoDesc,
    },
  }

  return (
    <div className="min-h-screen bg-[#0c0a09]" dir={t.dir}>

      <AutoDemo />

      {/* First-visit onboarding */}
      {appStep === 'onboarding' && (
        <div className="fixed inset-0 z-50 bg-[#0c0a09]/95 flex items-center justify-center px-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-4">🫀</div>
            <h2 className="text-stone-100 text-xl font-semibold mb-3">HiveBodyLog</h2>
            <p className="text-stone-400 text-sm leading-relaxed mb-3">
              Your personal health story. Log anything — symptoms, medications, how you feel, what you ate.
              No diagnosis. No judgment. Just your story, over time.
            </p>
            <button onClick={dismissOnboarding} className="w-full py-3 bg-teal-700 text-teal-100 font-semibold rounded-xl hover:bg-teal-600 transition-colors">
              Start my story
            </button>
          </div>
        </div>
      )}

      {/* Account setup — shown after onboarding if no email */}
      {appStep === 'account_setup' && sessionId && (
        <AccountSetupOverlay
          sessionId={sessionId}
          onDone={handleAccountSetupDone}
          onSkip={handleAccountSetupSkip}
        />
      )}

      {/* Header */}
      <header className="bg-[#0c0a09] border-b border-stone-900 px-4 py-3 flex items-center justify-between sticky top-0 z-20 no-print">
        <div className="flex items-center gap-3">
          <a href="https://hive.baby" className="text-xs text-stone-700 hover:text-stone-500 transition-colors">{t.backToPlanet}</a>
          <span className="text-stone-800">·</span>
          <span className="font-semibold text-stone-200 tracking-tight text-sm">{t.appName}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={e => { const l = e.target.value as LangCode; setLang(l); localStorage.setItem('hbl_lang', l); document.documentElement.dir = getStrings(l).dir; document.documentElement.lang = l }}
            className="bg-transparent text-stone-700 text-xs border-none outline-none cursor-pointer hover:text-stone-400"
            aria-label="Language"
          >
            {SUPPORTED_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>

          {/* Account indicator */}
          {savedEmail ? (
            <a href="/account" className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-400 transition-colors border border-stone-800 rounded-lg px-2.5 py-1.5">
              <div className="w-4 h-4 rounded-full bg-teal-900 flex items-center justify-center">
                <span className="text-teal-400 text-[9px] font-semibold uppercase">{savedEmail[0]}</span>
              </div>
              <span className="max-w-[80px] truncate hidden sm:block">{savedEmail}</span>
            </a>
          ) : (
            <a href="/login" className="text-xs text-stone-600 hover:text-teal-500 transition-colors">
              Protect your story →
            </a>
          )}

          {entries.length > 0 && (
            <button onClick={createShareLink} disabled={sharing}
              className="text-xs text-stone-600 border border-stone-800 rounded-lg px-3 py-1.5 hover:text-stone-400 hover:border-stone-700 transition-colors">
              {sharing ? '…' : shareCopied ? '✓ Copied' : 'Share'}
            </button>
          )}

          <div className="relative" ref={exportMenuRef} id="export-btn">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="text-xs text-stone-600 border border-stone-800 rounded-lg px-3 py-1.5 hover:text-stone-400 hover:border-stone-700 transition-colors flex items-center gap-1"
            >
              {t.exportLabel}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-stone-900 border border-stone-800 rounded-xl shadow-xl z-30 min-w-[220px] py-1 overflow-hidden">
                {CLINICIAN_TYPES.map(type => (
                  <a key={type} href={`/export?s=${sessionId}&clinician=${encodeURIComponent(type)}`}
                    target="_blank" rel="noopener" onClick={() => setShowExportMenu(false)}
                    className="block px-4 py-2.5 text-sm text-stone-300 hover:bg-stone-800 hover:text-stone-100 transition-colors">
                    {type}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <Suspense><AuthBanner /></Suspense>

      {/* Device-only banner */}
      {showDeviceBanner && !savedEmail && (
        <div className="bg-stone-900 border-b border-amber-900/50 px-4 py-3 flex items-center gap-3 no-print">
          <span className="text-amber-600 text-xs shrink-0">⚠</span>
          <p className="text-xs text-stone-400 flex-1">
            Your story is device-only.{' '}
            <a href="/login" className="text-teal-500 hover:text-teal-400 transition-colors">Add email to protect it →</a>
          </p>
          <button onClick={dismissBanner} className="text-stone-700 text-base leading-none shrink-0">×</button>
        </div>
      )}

      {/* Reminder banner */}
      {reminderDue && (
        <div className="bg-amber-950 border-b border-amber-900 px-4 py-3 flex items-center gap-3 no-print">
          <span className="text-xs text-amber-400 flex-1">⏰ Time to log how you feel after {reminderDue}</span>
          <button onClick={() => { setActiveTab('log'); setEntryMode('type'); setReminderDue(null) }}
            className="text-xs text-amber-300 underline shrink-0">Log now</button>
          <button onClick={() => setReminderDue(null)} className="text-amber-800 text-base leading-none ml-1">×</button>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">

        {/* Weekly summary */}
        {showWeeklySummary && weekSummary && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 relative no-print">
            <button onClick={() => setShowWeeklySummary(false)} className="absolute top-3 right-3 text-stone-700 text-base leading-none">×</button>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1.5">Your health week</p>
            <p className="text-stone-300 text-sm">
              {weekSummary.entryCount} {weekSummary.entryCount === 1 ? 'entry' : 'entries'} across {weekSummary.uniqueDays} {weekSummary.uniqueDays === 1 ? 'day' : 'days'}.
              {weekSummary.topTags.length > 0 && <> Most logged: <span className="text-teal-400">{weekSummary.topTags.join(', ')}</span>.</>}
            </p>
          </div>
        )}

        {/* Symptom duration notices */}
        {symptomNotices.map(notice => (
          <div key={notice.tag} className="bg-stone-900 border border-amber-900/40 rounded-xl px-4 py-3 flex items-start gap-3 no-print">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
            <p className="text-xs text-stone-400 leading-relaxed">
              You&apos;ve mentioned <span className="text-amber-500">{notice.tag}</span> on {notice.days} different days in the past two weeks.
              {notice.days >= 5 && ' This pattern might be worth discussing with a clinician.'}
            </p>
          </div>
        ))}

        {/* Mode selector */}
        <div id="mode-selector" className="grid grid-cols-3 gap-2">
          {(['type', 'upload', 'photo'] as EntryMode[]).map(mode => {
            const cfg = MODE_CONFIG[mode]
            const isActive = entryMode === mode
            return (
              <button key={mode} onClick={() => setEntryMode(mode)}
                className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border transition-all text-center ${
                  isActive
                    ? 'bg-teal-950 border-teal-700 text-teal-300'
                    : 'bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-400'
                }`}>
                <div className={isActive ? 'text-teal-400' : 'text-stone-600'}>{cfg.icon}</div>
                <div>
                  <div className="text-sm font-semibold">{cfg.label}</div>
                  <div className="text-xs mt-0.5 opacity-70 leading-tight hidden sm:block">{cfg.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Entry card */}
        <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden">
          {entryMode === 'type' && (
            <div className="p-5">
              <EntryInput onSubmit={handleEntrySubmit} isSubmitting={isSubmitting} lang={lang} />
            </div>
          )}

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
                  <p className="text-teal-400 text-sm font-medium">{t.savedConfirm}</p>
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

          {entryMode === 'photo' && (
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {PHOTO_TYPES.map(pt => (
                  <button key={pt} onClick={() => setPhotoType(pt)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      photoType === pt ? 'bg-teal-900 text-teal-300 border border-teal-700' : 'bg-stone-800 text-stone-500 hover:text-stone-300'
                    }`}>{pt}</button>
                ))}
              </div>
              {!photoPreview ? (
                <button onClick={() => photoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-stone-700 rounded-xl p-10 text-center hover:border-stone-600 transition-colors">
                  <p className="text-stone-400 text-sm">{t.photoCapture}</p>
                  <p className="text-stone-700 text-xs mt-1">JPEG, PNG, HEIC</p>
                </button>
              ) : (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

        {submitError && (
          <div className="bg-red-950 border border-red-900 rounded-xl p-4">
            <p className="text-red-400 text-sm">{submitError}</p>
          </div>
        )}

        {lastResponse && <AIResponseCard response={lastResponse} onDismiss={() => setLastResponse(null)} />}

        {/* Medication reminder prompt */}
        {showReminderPrompt && (
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 no-print">
            <p className="text-sm text-stone-300 mb-3">Remind me to log how I feel in…</p>
            <div className="flex gap-2 flex-wrap">
              {([['2h', 2], ['4h', 4], ['6h', 6], ['12h', 12]] as [string, number][]).map(([label, hours]) => (
                <button key={label} onClick={() => setReminder(showReminderPrompt, hours)}
                  className="px-3 py-1.5 bg-stone-800 text-stone-300 text-xs rounded-lg hover:bg-stone-700 transition-colors">
                  {label}
                </button>
              ))}
              <button onClick={() => setShowReminderPrompt(null)} className="px-3 py-1.5 text-stone-600 text-xs hover:text-stone-400 transition-colors">Skip</button>
            </div>
          </div>
        )}

        {/* Share link display */}
        {shareLink && (
          <div className="bg-stone-900 border border-teal-900/40 rounded-xl px-4 py-3 flex items-center gap-3 no-print">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-teal-400 font-medium mb-0.5">Read-only link · Expires in 7 days</p>
              <p className="text-xs text-stone-600 truncate">{shareLink}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(shareLink); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000) }}
              className="text-xs text-stone-500 border border-stone-800 rounded-lg px-2.5 py-1.5 hover:text-stone-300 transition-colors shrink-0">
              {shareCopied ? '✓' : 'Copy'}
            </button>
            <button onClick={() => setShareLink(null)} className="text-stone-700 text-base leading-none">×</button>
          </div>
        )}

        {/* Tab bar */}
        <div id="tab-bar" className="flex gap-1 bg-stone-950 rounded-xl p-1 border border-stone-900 no-print">
          {(['log', 'timeline', 'patterns'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === tab ? 'bg-stone-800 text-stone-200' : 'text-stone-700 hover:text-stone-500'
              }`}>
              {tab === 'log' ? t.tabLog : tab === 'timeline' ? t.tabTimeline : t.tabPatterns}
            </button>
          ))}
        </div>

        {activeTab === 'log' && (
          <>
            <LogView entries={entries} uploads={uploads} />
            <div className="mt-4 pt-6 border-t border-stone-900 no-print">
              <p className="text-xs text-stone-700 font-medium uppercase tracking-wider mb-3">Coming soon</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🍎', label: 'Apple Health import' },
                  { icon: '💚', label: 'Google Fit import' },
                  { icon: '⌚', label: 'Wearable data' },
                  { icon: '👨‍👩‍👧', label: 'Family profiles' },
                  { icon: '🌍', label: 'Community patterns' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 px-3 py-2.5 bg-stone-900 rounded-xl border border-stone-800 opacity-40">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs text-stone-500">{item.label}</span>
                    <span className="ml-auto text-[10px] text-stone-700 uppercase tracking-wider font-medium">Soon</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {activeTab === 'timeline' && <TimelineView entries={entries} uploads={uploads} />}
        {activeTab === 'patterns' && <PatternsView sessionId={sessionId} />}

      </main>

      <HiveFooter />
      <TourGuide steps={TOUR_STEPS} tourKey="hbl_tour_done" />
    </div>
  )
}

export default function Home() {
  return <Suspense><App /></Suspense>
}

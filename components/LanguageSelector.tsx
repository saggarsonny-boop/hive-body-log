'use client'
import { useEffect, useState } from 'react'

export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ar', label: 'AR', name: 'Arabic' },
  { code: 'fr', label: 'FR', name: 'French' },
  { code: 'es', label: 'ES', name: 'Spanish' },
  { code: 'de', label: 'DE', name: 'German' },
  { code: 'zh', label: 'ZH', name: 'Chinese' },
  { code: 'ja', label: 'JA', name: 'Japanese' },
  { code: 'pt', label: 'PT', name: 'Portuguese' },
  { code: 'hi', label: 'HI', name: 'Hindi' },
]

export const LANG_KEY = 'hive_lang'

export function getLang(): string {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem(LANG_KEY) || 'en'
}

export function withLang(input: string, lang: string): string {
  if (lang === 'en') return input
  const langName = LANGUAGES.find(l => l.code === lang)?.name || lang
  return `[Respond in ${langName}] ${input}`
}

export default function LanguageSelector() {
  const [lang, setLang] = useState('en')
  const [open, setOpen] = useState(false)

  useEffect(() => { setLang(getLang()) }, [])

  function select(code: string) {
    setLang(code)
    localStorage.setItem(LANG_KEY, code)
    setOpen(false)
  }

  const current = LANGUAGES.find(l => l.code === lang)

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
      {open && (
        <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, background: 'rgba(17,24,39,0.97)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: 10, overflow: 'hidden', minWidth: 130 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => select(l.code)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', background: l.code === lang ? 'rgba(251,191,36,0.1)' : 'none', border: 'none', color: l.code === lang ? '#fbbf24' : '#9ca3af', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {l.label} · {l.name}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        title="Language"
        style={{ background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: 20, padding: '6px 12px', color: lang === 'en' ? '#6b7280' : '#fbbf24', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(4px)' }}
      >
        {current?.label ?? 'EN'}
      </button>
    </div>
  )
}

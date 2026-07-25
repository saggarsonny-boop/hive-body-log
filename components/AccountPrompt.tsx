'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  emailSaved?: string | null
  autoOpen?: boolean
  firstEntryMessage?: string
  onDismiss?: () => void
}

type State = 'idle' | 'sending' | 'sent' | 'error'

export default function AccountPrompt({ sessionId, emailSaved, autoOpen, firstEntryMessage, onDismiss }: Props) {
  const [email, setEmail] = useState(emailSaved || '')
  const [state, setState] = useState<State>(emailSaved ? 'sent' : 'idle')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(autoOpen || false)

  function handleClose() {
    setOpen(false)
    onDismiss?.()
  }

  if (state === 'sent' && !open) {
    return (
      <div className="flex items-center gap-2 px-1 py-2">
        <svg className="w-3 h-3 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs text-stone-600">Story saved across devices · {email}</span>
        <button onClick={() => { setState('idle'); setEmail(''); setOpen(true) }} className="ml-auto text-xs text-stone-700 hover:text-stone-500 underline">Change</button>
      </div>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-1 py-2 w-full text-left group">
        <svg className="w-3 h-3 text-stone-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-xs text-stone-700 group-hover:text-stone-500 transition-colors">Save your health story across devices</span>
      </button>
    )
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      {state === 'sent' ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-stone-300 text-sm font-medium">Check your email</p>
            <p className="text-stone-600 text-xs mt-0.5">Sent a recovery link to {email}</p>
          </div>
          <button onClick={handleClose} className="text-stone-700 text-lg leading-none">×</button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-stone-400 text-sm font-medium">
              {firstEntryMessage || 'Save your story across devices'}
            </p>
            <button onClick={handleClose} className="text-stone-700 text-lg leading-none">×</button>
          </div>
          {!firstEntryMessage && (
            <p className="text-stone-600 text-xs mb-3">Enter your email to recover your health story on any device. No password needed.</p>
          )}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
              className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-teal-700"
            />
            <button onClick={handleSend} disabled={!email.trim() || state === 'sending'}
              className="px-3 py-2 bg-teal-800 text-teal-200 text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-teal-700 transition-colors">
              {state === 'sending' ? '…' : 'Send link'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-500 text-xs">{error}</p>}
          <button onClick={handleClose} className="mt-2 text-stone-700 text-xs hover:text-stone-500 transition-colors">No thanks</button>
        </>
      )}
    </div>
  )

  async function handleSend() {
    if (!email.trim()) return
    setState('sending')
    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), session_id: sessionId }),
      })
      if (!res.ok) throw new Error()
      setState('sent')
      localStorage.setItem('hbl_email', email.trim())
      localStorage.setItem('hbl_email_prompted', '1')
    } catch {
      setError('We\'re still setting up email delivery — try again in a few hours.')
      setState('error')
    }
  }
}

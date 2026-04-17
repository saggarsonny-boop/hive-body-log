'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  onDismiss: () => void
}

type State = 'idle' | 'sending' | 'sent' | 'error'

export default function AccountPrompt({ sessionId, onDismiss }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

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
    } catch {
      setError('Could not send link. Try again.')
      setState('error')
    }
  }

  return (
    <div className="bg-stone-800 text-white rounded-2xl p-5">
      {state === 'sent' ? (
        <div className="text-center py-2">
          <p className="font-semibold mb-1">Link sent to {email}</p>
          <p className="text-stone-400 text-sm">Click it to recover your health story on any device.</p>
          <button onClick={onDismiss} className="mt-3 text-stone-400 text-sm underline">Done</button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-semibold text-sm">Save your health story</p>
              <p className="text-stone-400 text-xs mt-0.5">Add your email to recover your data on a new device. No password needed.</p>
            </div>
            <button onClick={onDismiss} className="text-stone-500 hover:text-stone-300 text-xl leading-none shrink-0">×</button>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
              className="flex-1 bg-stone-700 border border-stone-600 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-500 outline-none focus:border-teal-500"
            />
            <button
              onClick={handleSend}
              disabled={!email.trim() || state === 'sending'}
              className="px-3 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-teal-500 transition-colors"
            >
              {state === 'sending' ? '…' : 'Send link'}
            </button>
          </div>
          {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
          <button onClick={onDismiss} className="mt-2 text-stone-500 text-xs underline">No thanks</button>
        </>
      )}
    </div>
  )
}

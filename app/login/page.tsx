'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSend() {
    if (!email.trim() || state === 'sending') return
    setState('sending')
    try {
      let sessionId = localStorage.getItem('hbl_session_id')
      if (!sessionId) { sessionId = crypto.randomUUID(); localStorage.setItem('hbl_session_id', sessionId) }

      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), session_id: sessionId }),
      })
      if (!res.ok) throw new Error()
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <a href="/" className="text-xs text-stone-700 hover:text-stone-500 transition-colors">← HiveBodyLog</a>
          <h1 className="text-xl font-semibold text-stone-200 mt-3">Access your health story</h1>
          <p className="text-stone-500 text-sm mt-1">Enter your email. We&apos;ll send a magic link — no password needed.</p>
        </div>

        {state === 'sent' ? (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-center">
            <div className="w-10 h-10 bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-stone-200 font-medium mb-1">Check your email</p>
            <p className="text-stone-500 text-sm">Sent a link to {email}. It expires in 1 hour.</p>
            <p className="text-stone-700 text-xs mt-3">Check your spam folder if you don&apos;t see it.</p>
          </div>
        ) : (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
            <div className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                autoFocus
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 placeholder-stone-600 outline-none focus:border-teal-700 text-sm transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!email.trim() || state === 'sending'}
                className="w-full py-3 bg-teal-700 text-teal-100 font-semibold rounded-xl disabled:opacity-40 hover:bg-teal-600 transition-colors text-sm"
              >
                {state === 'sending' ? 'Sending…' : 'Send access link'}
              </button>
              {state === 'error' && (
                <p className="text-red-500 text-xs text-center">Could not send link. Try again.</p>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-stone-700 text-center mt-4">No account needed. No password. Just your email.</p>
      </div>
    </div>
  )
}

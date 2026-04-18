'use client'

import { useState, useEffect } from 'react'

const SCOPE_EXAMPLES = [
  'just today\'s story',
  'my entire headache history',
  'heart-related entries Aug 2020–Feb 2023',
  'everything about my sleep',
  'all entries from last month',
]

interface Props {
  sessionId: string
  onClose: () => void
}

export default function ShareModal({ sessionId, onClose }: Props) {
  const [scopeText, setScopeText] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [salutation, setSalutation] = useState('Dear Dr ')
  const [sendCopy, setSendCopy] = useState(false)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ share_url: string; entry_count: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [placeholder, setPlaceholder] = useState(SCOPE_EXAMPLES[0])

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % SCOPE_EXAMPLES.length
      setPlaceholder(SCOPE_EXAMPLES[i])
    }, 3000)
    return () => clearInterval(id)
  }, [])

  async function handleSubmit() {
    if (state === 'loading') return
    setState('loading')
    try {
      const res = await fetch('/api/share/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          scope_text: scopeText.trim() || null,
          recipient_email: recipientEmail.trim() || null,
          salutation: salutation.trim() || null,
          send_copy: sendCopy,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
      setState('done')
    } catch {
      setState('error')
    }
  }

  function copyLink() {
    if (!result) return
    navigator.clipboard.writeText(result.share_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputCls = 'w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2.5 text-stone-200 text-sm placeholder-stone-600 focus:outline-none focus:border-teal-800 transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 sm:pb-0">
      <div className="w-full max-w-md bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-2xl">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-stone-200 font-semibold text-sm">Share your health story</p>
            <p className="text-stone-600 text-xs mt-0.5">Scoped · Read-only · Expires in 30 days</p>
          </div>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-400 text-xl leading-none">×</button>
        </div>

        {state !== 'done' ? (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-stone-500 text-xs mb-1.5 block">What are you sharing?</label>
                <textarea
                  value={scopeText}
                  onChange={e => setScopeText(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  className={inputCls + ' resize-none'}
                />
                <p className="text-stone-700 text-xs mt-1">Leave blank to include all entries.</p>
              </div>

              <div>
                <label className="text-stone-500 text-xs mb-1.5 block">Recipient email <span className="text-stone-700">(optional)</span></label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-stone-500 text-xs mb-1.5 block">Salutation <span className="text-stone-700">(optional)</span></label>
                <input
                  type="text"
                  value={salutation}
                  onChange={e => setSalutation(e.target.value)}
                  placeholder="Dear Dr Smith"
                  className={inputCls}
                />
              </div>

              {recipientEmail.trim() && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendCopy}
                    onChange={e => setSendCopy(e.target.checked)}
                    className="w-4 h-4 rounded bg-stone-900 border-stone-700 accent-teal-600"
                  />
                  <span className="text-stone-500 text-xs">Send a copy to my email too</span>
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 text-xs text-stone-600 border border-stone-800 rounded-lg py-2.5 hover:border-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={state === 'loading'}
                className="flex-1 text-xs bg-teal-900 text-teal-200 border border-teal-800 rounded-lg py-2.5 hover:bg-teal-800 transition-colors disabled:opacity-50"
              >
                {state === 'loading' ? 'Creating…' : 'Create share link'}
              </button>
            </div>

            {state === 'error' && (
              <p className="text-red-500 text-xs text-center">Something went wrong. Try again.</p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <p className="text-teal-400 text-xs font-medium mb-1">
                ✓ Share link created · {result?.entry_count} {result?.entry_count === 1 ? 'entry' : 'entries'} included
              </p>
              {recipientEmail && (
                <p className="text-stone-600 text-xs">Email sent to {recipientEmail}</p>
              )}
            </div>

            <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2.5">
              <p className="text-stone-500 text-xs truncate flex-1">{result?.share_url}</p>
              <button
                onClick={copyLink}
                className="text-xs text-teal-500 hover:text-teal-300 shrink-0 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full text-xs text-stone-600 border border-stone-800 rounded-lg py-2.5 hover:border-stone-700 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

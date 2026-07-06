'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function VerifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const sessionId = params.get('session')
  const email = params.get('email')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (sessionId && email) {
      localStorage.setItem('hbl_session_id', sessionId)
      localStorage.setItem('hbl_email', email)
      localStorage.setItem('hbl_email_prompted', '1')
      localStorage.setItem('hbl_onboarded', '1')
      setDone(true)
      setTimeout(() => router.replace('/'), 1800)
    }
  }, [sessionId, email, router])

  return (
    <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center p-6">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
        {done ? (
          <>
            <div className="w-12 h-12 bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-stone-200 text-lg mb-1">Your story is protected</p>
            <p className="text-stone-500 text-sm mb-1">Signed in as {email}</p>
            <p className="text-stone-700 text-xs mt-4">Redirecting to your health story…</p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-stone-700 border-t-teal-500 rounded-full animate-spin mx-auto" />
            <p className="text-stone-500 text-sm">Verifying your link…</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>

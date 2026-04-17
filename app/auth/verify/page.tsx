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
      localStorage.setItem('hbl_email_prompted', '1')
      setDone(true)
      setTimeout(() => router.replace('/'), 1800)
    }
  }, [sessionId, email, router])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-sm w-full text-center shadow-sm">
        {done ? (
          <>
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-stone-800 mb-1">Health story recovered</p>
            <p className="text-stone-500 text-sm">Signed in as {email}</p>
            <p className="text-stone-300 text-xs mt-4">Redirecting to your health story…</p>
          </>
        ) : (
          <p className="text-stone-400 text-sm">Verifying your link…</p>
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

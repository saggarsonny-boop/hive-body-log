'use client'

import { useState } from 'react'

export default function HiveFooter() {
  const [showSupport, setShowSupport] = useState(false)

  return (
    <footer className="border-t border-stone-900 mt-8 py-5 px-4 relative">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 text-xs text-stone-700">
        <button
          onClick={() => setShowSupport(v => !v)}
          className="hover:text-stone-400 transition-colors"
        >
          Support
        </button>
        <span>·</span>
        <a href="https://hive.baby/contribute" className="hover:text-stone-400 transition-colors">Contribute</a>
        <span>·</span>
        <a href="https://hive.baby" className="hover:text-stone-400 transition-colors">hive.baby</a>
      </div>

      {showSupport && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSupport(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-stone-900 border border-stone-800 rounded-xl shadow-xl p-4 w-64">
            <p className="text-xs text-stone-500 mb-3 text-center">Support Hive — free forever, no agenda</p>
            <div className="space-y-2">
              <a href="https://buy.stripe.com/14A6oJ6Mv3sReEa0YV0RG00" target="_blank" rel="noopener"
                className="block w-full text-center px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm rounded-lg transition-colors">
                $1.99 / month
              </a>
              <a href="https://buy.stripe.com/7sYcN79YHe7v53AcHD0RG01" target="_blank" rel="noopener"
                className="block w-full text-center px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm rounded-lg transition-colors">
                $19 / year
              </a>
              <a href="https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02" target="_blank" rel="noopener"
                className="block w-full text-center px-4 py-2.5 bg-teal-900 hover:bg-teal-800 text-teal-200 text-sm rounded-lg transition-colors">
                $5 one-time
              </a>
            </div>
          </div>
        </>
      )}
    </footer>
  )
}

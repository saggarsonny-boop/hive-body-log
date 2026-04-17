export default function AboutPage() {
  const features = [
    'Free text entry — describe anything in plain language',
    'Quick tags — body areas (Head, Chest, Gut, Back…) and categories (Pain, Sleep, Mood, Energy…)',
    'Intensity tracking 0–10',
    'Time of day tracking, auto-selected',
    'Document upload — PDFs, lab results, imaging reports',
    'Supplement and medication photo analysis',
    'Pattern recognition across your entries over time',
    'Clinician report export — GP, Emergency, Specialist, Psychologist, Pharmacist, Dentist',
    '7 languages — English, Spanish, French, Arabic, Hindi, Chinese, Portuguese',
    'Anonymous by default — no account needed',
    'Email recovery — access your story on any device',
    'Share with clinician — read-only link, expires in 7 days',
    'Medication reminders — log how you feel after taking medication',
    'Weekly summary — your health week at a glance',
  ]

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-200">
      <header className="border-b border-stone-900 px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <a href="/" className="text-xs text-stone-700 hover:text-stone-500 transition-colors">← HiveBodyLog</a>
          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-stone-100 tracking-tight">HiveBodyLog</h1>
            <p className="text-stone-500 text-sm mt-1">Your personal health story engine.</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">

        <section>
          <h2 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">What it is</h2>
          <p className="text-stone-300 text-sm leading-relaxed">
            A single screen to build your personal health story. Log physical and mental experiences in plain language —
            symptoms, medications, mood, sleep, food, appointments, how you feel. Over time, patterns emerge.
            Your story is yours. No diagnosis. No judgment.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-4">How it works</h2>
          <div className="space-y-4">
            {[
              'Type what happened in plain language, upload a medical document, or take a photo of a supplement or medication.',
              'Claude structures each entry — extracting what happened, where in the body, and when. It notices connections across entries over time.',
              'Your Log, Timeline, and Patterns views grow with you. Export a clinician-tailored summary any time — adapted for your GP, specialist, or any healthcare professional.',
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs text-stone-500 shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-stone-400 text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">Who it&apos;s for</h2>
          <p className="text-stone-400 text-sm leading-relaxed">
            Anyone who wants to understand their own health better. Anyone who needs a clear record to share with a clinician.
            Anyone managing a long-term condition, taking multiple medications, or just trying to notice what&apos;s going on in their body.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">Features</h2>
          <ul className="space-y-2">
            {features.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-stone-400">
                <span className="text-teal-700 mt-0.5 shrink-0">·</span>
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">Tiers</h2>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-200 text-sm font-semibold">Free — forever</p>
            <p className="text-stone-500 text-xs mt-1 leading-relaxed">
              All features. No paywall. No premium tier. No ads. No investors.
              Optional support only — if HiveBodyLog helps you, you can choose to contribute.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">Philosophy</h2>
          <p className="text-stone-400 text-sm leading-relaxed">
            No diagnosis. No judgment. No agenda. Just your story, over time.
            Health literacy is a human right. HiveBodyLog gives you the tools to understand your own patterns
            without telling you what they mean. The story is yours.
          </p>
        </section>

        <div className="pt-2 flex items-center gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 text-teal-100 text-sm font-semibold rounded-xl hover:bg-teal-600 transition-colors"
          >
            Start my story →
          </a>
          <a href="https://hive.baby" className="text-xs text-stone-700 hover:text-stone-500 transition-colors">
            ← Back to Hive
          </a>
        </div>
      </main>

      <footer className="border-t border-stone-900 mt-12 py-5 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 text-xs text-stone-700">
          <a href="https://hive.baby/about" className="hover:text-stone-400 transition-colors">A social experiment</a>
          <span>·</span>
          <a href="https://hive.baby/contribute" className="hover:text-stone-400 transition-colors">Contribute</a>
          <span>·</span>
          <a href="https://hive.baby" className="hover:text-stone-400 transition-colors">hive.baby</a>
        </div>
      </footer>
    </div>
  )
}

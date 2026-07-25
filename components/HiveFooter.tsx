'use client'

export default function HiveFooter() {
  return (
    <footer className="border-t border-stone-900 mt-8 py-5 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 text-xs text-stone-700">
        <a href="https://hive.baby/about" className="hover:text-stone-400 transition-colors">A social experiment</a>
        <span>·</span>
        <a href="https://hive.baby/contribute" className="hover:text-stone-400 transition-colors">Contribute</a>
        <span>·</span>
        <a href="https://hive.baby" className="hover:text-stone-400 transition-colors">hive.baby</a>
      </div>
    </footer>
  )
}

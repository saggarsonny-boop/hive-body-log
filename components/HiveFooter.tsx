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



<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HiveBodyLog',
  description: 'Your health story. Log anything, find patterns, share with your doctor. Free forever.',
  openGraph: {
    title: 'HiveBodyLog',
    description: 'Log physical and mental experiences in plain language. Find patterns over time. Export a clean summary your doctor can read in under a minute.',
    type: 'website',
  },
}

const NAV_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(120,113,108,0.7)',
  textDecoration: 'none',
}

const DOT: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(120,113,108,0.3)',
}

function HiveNav() {
  return (
    <nav style={{ borderBottom: '1px solid rgba(28,25,23,0.8)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <a href="https://hive.baby" className="hive-planet" style={{ textDecoration: 'none', fontSize: '22px', lineHeight: '1' }}>🌍</a>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(245,245,244,0.6)', letterSpacing: '0.02em' }}>HiveBodyLog</span>
      <a href="/login" style={{ fontSize: '11px', color: 'rgba(120,113,108,0.5)', textDecoration: 'none' }}>Sign in</a>
    </nav>
  )
}

function HiveFooter() {
  return (
    <footer style={{ borderTop: '1px solid rgba(28,25,23,0.8)', padding: '20px 24px 28px', textAlign: 'center' }}>
      <p style={{ fontSize: '11px', color: 'rgba(120,113,108,0.4)', marginBottom: '14px', letterSpacing: '0.05em' }}>
        Free forever. No ads. No investors. You are the investor.
      </p>
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="https://hive.baby" style={NAV_STYLE}>hive.baby</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/patrons" style={NAV_STYLE}>Patronage</a>
        <span style={DOT}>·</span>
        <a href="mailto:hive@hive.baby" style={NAV_STYLE}>Feedback</a>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased"><HiveNav />{children}<HiveFooter />
<!-- Stripe Checkout Block -->
<div id="stripe-checkout-cta" style="margin: 2rem auto; padding: 2rem; border-radius: 12px; background: rgba(59,130,246,0.05); border: 1px solid rgba(59,130,246,0.2); text-align: center; font-family: sans-serif; max-width: 600px;">
    <h3 style="margin-top: 0; color: #fff;">Activate Premium License</h3>
    <p style="color: #9ca3af; font-size: 0.95rem; margin-bottom: 1.5rem;">Get instant access to all advanced capabilities and integration features.</p>
    <a href="https://buy.stripe.com/6oU00lb2L6F37bIazv0RG0J" target="_blank" style="display: inline-block; padding: 0.8rem 2rem; background: #3b82f6; color: #fff; font-weight: bold; border-radius: 8px; text-decoration: none; transition: background 0.2s;">Unlock Now</a>
</div>

</body>
    </html>
  )
}

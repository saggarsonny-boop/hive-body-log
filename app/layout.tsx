import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HiveBodyLog',
  description: 'Your health story. Log anything, find patterns, share with your doctor. Free forever.',
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
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
      <body className="antialiased"><HiveNav />{children}<HiveFooter /></body>
    </html>
  )
}

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

function HiveFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(13,31,53,0.8)", padding: "20px 24px 28px", textAlign: "center" }}>
      <p style={{ fontSize: "11px", color: "rgba(26,58,92,0.5)", marginBottom: "14px", letterSpacing: "0.05em" }}>
        No ads. No investors. No agenda.
      </p>
      <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="https://hive.baby/about" style={NAV_STYLE}>About</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/contribute" style={NAV_STYLE}>Contribute</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/patrons" style={NAV_STYLE}>Patrons</a>
        <span style={DOT}>·</span>
        <a href="https://hive.baby/privacy" style={NAV_STYLE}>Privacy</a>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased"><HiveNav />{children}<HiveFooter /></body>
    </html>
  )
}

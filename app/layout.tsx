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
    <footer style={{ borderTop: "1px solid rgba(13,31,53,0.8)", padding: "20px 24px 32px", textAlign: "center" as const }}>
      <p style={{ fontSize: "11px", color: "rgba(26,58,92,0.7)", marginBottom: "8px" }}>
        Support Hive · Free forever at the base tier
      </p>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" as const }}>
        <a href="https://buy.stripe.com/14A6oJ6Mv3sReEa0YV0RG00" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "11px", color: "rgba(212,175,55,0.5)", textDecoration: "none" }}>$1.99 / month</a>
        <span style={{ color: "rgba(26,58,92,0.4)", fontSize: "11px" }}>·</span>
        <a href="https://buy.stripe.com/7sYcN79YHe7v53AcHD0RG01" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "11px", color: "rgba(212,175,55,0.5)", textDecoration: "none" }}>$19 / year</a>
        <span style={{ color: "rgba(26,58,92,0.4)", fontSize: "11px" }}>·</span>
        <a href="https://buy.stripe.com/9B6aEZ7Qzd3rcw2bDz0RG02" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: "11px", color: "rgba(212,175,55,0.5)", textDecoration: "none" }}>$5 one-time</a>
      </div>
      <form action="https://hive.baby" method="get" style={{ marginTop: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
        <input name="q" type="text" placeholder="Find another engine…" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", color: "rgba(255,255,255,0.45)", outline: "none", width: "180px" }} />
        <button type="submit" style={{ background: "none", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: "rgba(212,175,55,0.45)", cursor: "pointer" }}>→</button>
      </form>
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

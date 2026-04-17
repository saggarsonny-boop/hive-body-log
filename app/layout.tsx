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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

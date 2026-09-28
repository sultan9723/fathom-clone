import type { Metadata } from 'next'
import './globals.css'
import { fontVariables } from '@/lib/fonts'

/**
 * Document shell only: fonts, metadata, the page ground.
 *
 * No navigation lives here any more. The marketing and app sections have
 * genuinely different chrome — a landing page and a 240px sidebar — so each
 * route group owns its own layout instead of sharing a global tab bar that
 * suited neither.
 */
export const metadata: Metadata = {
  title: {
    default: 'NoteAI',
    template: '%s · NoteAI',
  },
  description: 'AI meeting notetaker — transcripts, summaries and action items.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} max-w-full overflow-x-hidden`}>
      <body className="min-h-screen max-w-full overflow-x-hidden bg-bg font-sans text-body text-text antialiased">
        {children}
      </body>
    </html>
  )
}

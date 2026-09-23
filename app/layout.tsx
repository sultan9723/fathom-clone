import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import { AudioLines } from 'lucide-react'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Fathom Clone',
    template: '%s',
  },
  description: 'AI meeting notetaker — transcripts, summaries and action items.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
            <Link
              href="/meetings"
              className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-white">
                <AudioLines className="h-4 w-4" aria-hidden="true" />
              </span>
              Fathom Clone
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}

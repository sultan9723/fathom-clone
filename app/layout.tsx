import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import { Settings, HelpCircle } from 'lucide-react'
import './globals.css'
import { HeaderSearch } from '@/components/layout/header-search'
import { TabBar } from '@/components/layout/tab-bar'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'NoteAI',
    template: '%s · NoteAI',
  },
  description: 'AI meeting notetaker — transcripts, summaries and action items.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} max-w-full overflow-x-hidden`}>
      <body className="min-h-screen max-w-full overflow-x-hidden bg-page font-sans text-base text-fg-1 antialiased">
        <header className="sticky top-0 z-30 min-w-0 overflow-hidden bg-topbar">
          <div className="mx-auto flex h-topbar w-full max-w-6xl min-w-0 items-center gap-2 overflow-hidden px-4 sm:gap-4 sm:px-6">
            <Link
              href="/meetings"
              className="flex h-5 w-[140px] shrink-0 items-center rounded-md text-lg font-semibold text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              NoteAI
            </Link>

            <div className="flex min-w-0 flex-1 justify-center overflow-hidden">
              <Suspense fallback={<div className="h-pill-h w-pill-w max-w-full rounded-md bg-search-pill" />}>
                <HeaderSearch />
              </Suspense>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {/* No settings/help pages exist yet — inert, styled per SPEC's
                  nav-link states, not routed anywhere. Text collapses to
                  icon-only below sm so the header never forces horizontal
                  scroll on narrow phones. */}
              <span
                aria-disabled="true"
                className="flex cursor-default select-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-fg-2"
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Settings</span>
              </span>
              <span
                aria-disabled="true"
                className="flex cursor-default select-none items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-fg-2"
              >
                <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Help</span>
              </span>
              <span
                aria-hidden="true"
                className="ml-2 h-avatar w-avatar shrink-0 rounded-full bg-line"
              />
            </div>
          </div>
        </header>
        <TabBar />
        {children}
      </body>
    </html>
  )
}

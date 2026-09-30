'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * A single Meetings tab — the app has one section, so the bar names it
 * rather than implying a set of features that don't exist yet.
 */
const TABS = [
  { label: 'Meetings', href: '/meetings' },
] as const

export function TabBar() {
  const pathname = usePathname()

  return (
    // border-page used to hide the old top rule against the dark page; on
    // white the tab bar needs a real divider below it instead.
    <nav
      aria-label="Primary"
      className="h-tab-bar overflow-hidden border-b border-line bg-topbar"
    >
      {/* No max-w cap — matches the header and page content below, which
          also run edge-to-edge. */}
      <div className="flex h-full w-full items-center gap-6 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab) => {
          const active = pathname === tab.href

          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'shrink-0 border-b-2 py-[15px] text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                active
                  ? 'border-brand font-semibold text-brand'
                  : 'border-transparent font-normal text-fg-1 hover:text-brand'
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

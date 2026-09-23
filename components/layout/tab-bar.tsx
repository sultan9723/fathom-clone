'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * Only "My Calls" routes anywhere in this app. The rest — Team Calls,
 * Playlists, Alerts, Deals — have no corresponding page, so they render as
 * inert, non-navigating tabs rather than dead links to nonexistent routes.
 * Same "deliberately stubbed" treatment this project already documents for
 * out-of-scope features.
 */
const TABS: { label: string; href?: string }[] = [
  { label: 'My Calls', href: '/meetings' },
  { label: 'Team Calls' },
  { label: 'Playlists' },
  { label: 'Alerts' },
  { label: 'Deals' },
]

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="h-tab-bar overflow-hidden border-t-[0.67px] border-page bg-topbar"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-6 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab) => {
          if (!tab.href) {
            return (
              <span
                key={tab.label}
                aria-disabled="true"
                className="cursor-default select-none text-sm font-normal text-fg-1/60"
              >
                {tab.label}
              </span>
            )
          }

          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                'border-b-2 py-[15px] text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand',
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

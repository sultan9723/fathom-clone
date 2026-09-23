'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * Every tab is a real, clickable link now. Team Calls/Playlists/Alerts/
 * Deals have no feature behind them yet, so they land on an honest
 * "coming soon" empty state instead of a dead-end href="#" or an inert
 * span that looks broken.
 */
const TABS = [
  { label: 'My Calls', href: '/meetings' },
  { label: 'Team Calls', href: '/meetings?tab=team' },
  { label: 'Playlists', href: '/playlists' },
  { label: 'Alerts', href: '/alerts' },
  { label: 'Deals', href: '/deals' },
] as const

export function TabBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isTeamCalls = pathname === '/meetings' && searchParams.get('tab') === 'team'

  return (
    <nav
      aria-label="Primary"
      className="h-tab-bar overflow-hidden border-t-[0.67px] border-page bg-topbar"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-6 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab) => {
          const active =
            tab.label === 'My Calls'
              ? pathname === '/meetings' && !isTeamCalls
              : tab.label === 'Team Calls'
                ? isTeamCalls
                : pathname === tab.href

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

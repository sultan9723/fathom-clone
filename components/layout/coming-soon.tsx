import type { LucideIcon } from 'lucide-react'

/**
 * Shared empty state for nav destinations that exist as real, linkable
 * routes but have no feature behind them yet — Team Calls, Playlists,
 * Alerts, Deals. A genuine page beats an inert nav item or a href="#"
 * that goes nowhere: the tab is honestly clickable, it just says so.
 */
export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-4 text-fg-3">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-fg-1">{title}</h1>
      <p className="mt-1 max-w-sm text-sm text-fg-3">{description}</p>
    </main>
  )
}

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { StatusDot } from './button'

/**
 * DESIGN.md: height 24-30, radius 6-8.
 * - default: quiet metadata chip on a surface.
 * - live:    accent-bg fill, accent text, pulsing dot.
 *
 * The accent is reserved for live, primary actions and the current
 * selection, so a plain metadata chip must not use the `live` variant.
 */
export type BadgeVariant = 'default' | 'live'

export function Badge({
  variant = 'default',
  children,
  className,
}: {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex h-badge items-center gap-1.5 rounded-chip px-2.5 text-small-xs',
        variant === 'live'
          ? 'bg-accent-bg text-accent'
          : 'bg-surface-2 text-muted',
        className
      )}
    >
      {variant === 'live' && <StatusDot />}
      {children}
    </span>
  )
}

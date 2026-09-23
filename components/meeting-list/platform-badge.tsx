import { Video, Monitor, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meeting } from '@/lib/types'

const PLATFORMS = {
  zoom: { label: 'Zoom', Icon: Video },
  meet: { label: 'Google Meet', Icon: Monitor },
  teams: { label: 'Microsoft Teams', Icon: Users },
} as const satisfies Record<Meeting['platform'], unknown>

/**
 * SPEC's card anatomy has no colored badge — just a monochrome signal in the
 * meta row alongside date/duration. Kept as its own component since it's
 * still used standalone (e.g. tooltips), but the visual is now a bare icon.
 */
export function PlatformBadge({
  platform,
  className,
}: {
  platform: Meeting['platform']
  className?: string
}) {
  const { label, Icon } = PLATFORMS[platform]
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-fg-meta', className)}
      title={label}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

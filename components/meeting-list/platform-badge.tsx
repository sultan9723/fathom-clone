import { Video, Monitor, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Meeting } from '@/lib/types'

const PLATFORMS = {
  zoom: { label: 'Zoom', Icon: Video, className: 'bg-blue-50 text-blue-700 ring-blue-600/15' },
  meet: { label: 'Google Meet', Icon: Monitor, className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15' },
  teams: { label: 'Microsoft Teams', Icon: Users, className: 'bg-violet-50 text-violet-700 ring-violet-600/15' },
} as const satisfies Record<Meeting['platform'], unknown>

export function PlatformBadge({
  platform,
  className,
}: {
  platform: Meeting['platform']
  className?: string
}) {
  const { label, Icon, className: tone } = PLATFORMS[platform]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        tone,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}

import { Video, Monitor, Users } from 'lucide-react'
import type { Meeting } from '@/lib/types'

/**
 * SPEC wants a colored 16px platform icon here — distinct from the
 * monochrome icon components/meeting-list/platform-badge.tsx uses in the
 * card meta row, so it's its own small component rather than a shared one
 * with a color/no-color prop.
 */
const PLATFORMS = {
  zoom: { label: 'Zoom', Icon: Video, className: 'text-[#2D8CFF]' },
  meet: { label: 'Google Meet', Icon: Monitor, className: 'text-[#00AC47]' },
  teams: { label: 'Microsoft Teams', Icon: Users, className: 'text-[#6264A7]' },
} as const satisfies Record<Meeting['platform'], unknown>

export function PlatformIcon({ platform }: { platform: Meeting['platform'] }) {
  const { label, Icon, className } = PLATFORMS[platform]
  return <Icon className={`h-4 w-4 shrink-0 ${className}`} aria-label={label} />
}

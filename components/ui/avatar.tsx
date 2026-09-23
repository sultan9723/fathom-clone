import { cn, initials } from '@/lib/utils'
import type { Participant } from '@/lib/types'

const SIZES = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
} as const

export function Avatar({
  participant,
  size = 'md',
  className,
}: {
  participant: Participant
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white',
        SIZES[size],
        className
      )}
      style={{ backgroundColor: participant.color }}
      title={participant.name}
      aria-hidden="true"
    >
      {initials(participant.name)}
    </span>
  )
}

export function AvatarStack({
  participants,
  max = 4,
  size = 'md',
}: {
  participants: Participant[]
  max?: number
  size?: keyof typeof SIZES
}) {
  const shown = participants.slice(0, max)
  const overflow = participants.length - shown.length

  return (
    <div
      className="flex items-center"
      role="img"
      aria-label={`${participants.length} participants: ${participants.map((p) => p.name).join(', ')}`}
    >
      {shown.map((p) => (
        <Avatar key={p.id} participant={p} size={size} className="-mr-2 last:mr-0" />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 ring-2 ring-white',
            SIZES[size]
          )}
          aria-hidden="true"
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}

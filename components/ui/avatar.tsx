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
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
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

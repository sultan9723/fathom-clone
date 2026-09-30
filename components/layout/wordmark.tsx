import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * The accent dot plus wordmark, used by the navbar, both footers and the
 * drawer. One component so the dot size and gap can't drift apart.
 */
export function Wordmark({
  href = '/',
  size = 'default',
  className,
}: {
  href?: string
  /** 18px in the navbar, 15px in the marketing footer. */
  size?: 'default' | 'sm'
  className?: string
}) {
  return (
    <Link
      href={href}
      aria-label="NoteAI home"
      className={cn(
        'inline-flex shrink-0 items-center gap-2.5 font-semibold text-text',
        size === 'sm' ? 'text-[15px]' : 'text-h4',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'shrink-0 rounded-full bg-accent',
          size === 'sm' ? 'h-2 w-2' : 'h-[9px] w-[9px]'
        )}
      />
      NoteAI
    </Link>
  )
}

import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * DESIGN.md: surface fill, 1px border, radius 16. Explicitly no left-border
 * accent stripes and no drop shadows — the border alone separates a panel
 * from the page.
 */
export function Panel({
  as: Tag = 'div',
  children,
  className,
}: {
  as?: ElementType
  children: ReactNode
  className?: string
}) {
  return (
    <Tag className={cn('rounded-card border border-border bg-surface', className)}>
      {children}
    </Tag>
  )
}

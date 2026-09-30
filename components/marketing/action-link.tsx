import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui'

/**
 * Kept as a thin alias so the landing markup reads the same, but the styling
 * now comes from the shared button. `.landing-action` was a second button
 * implementation with its own height and hover, which is exactly what the
 * system is meant to prevent.
 */
export function ActionLink({ href, children, secondary = false }: {
  href: string
  children: ReactNode
  secondary?: boolean
}) {
  return (
    <ButtonLink href={href} variant={secondary ? 'secondary' : 'primary'} size="lg">
      {children}
    </ButtonLink>
  )
}

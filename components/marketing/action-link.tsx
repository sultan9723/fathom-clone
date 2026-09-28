import Link from 'next/link'
import type { ReactNode } from 'react'

// The shared Button is button-only. Keep navigation a native link without
// changing that primitive or nesting interactive elements.
export function ActionLink({ href, children, secondary = false }: {
  href: string; children: ReactNode; secondary?: boolean
}) {
  return <Link href={href} className={`landing-action ${secondary ? 'landing-action-secondary' : 'landing-action-primary'}`}>{children}</Link>
}

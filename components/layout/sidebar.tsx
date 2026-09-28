'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

/**
 * The app shell's 240px sidebar (DESIGN.md).
 *
 * Nav holds exactly one item. DESIGN.md is explicit that the app ships no
 * empty nav items and no "coming soon" pages, so a section appears here only
 * once it does something.
 */
const NAV = [{ label: 'Meetings', href: '/meetings' }] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-sidebar shrink-0 flex-col gap-6 border-r border-border-subtle bg-bg px-4 py-7">
      <Link
        href="/"
        className="rounded-chip px-2 text-title font-semibold text-text"
      >
        NoteAI
      </Link>

      <Button variant="primary" className="w-full">
        Join a meeting
      </Button>

      <nav aria-label="Sections" className="flex flex-col gap-1">
        {NAV.map((item) => {
          // A meeting detail page is still the Meetings section.
          const current = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'rounded-chip px-3 py-2 text-body-sm',
                'transition-[background-color,color] duration-fast ease-out-design',
                current
                  ? 'bg-surface-hover font-medium text-text'
                  : 'text-muted hover:bg-surface-hover hover:text-text'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

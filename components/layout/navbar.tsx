'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui'
import { Wordmark } from './wordmark'
import { NavigationDrawer } from './navigation-drawer'
import { APP_VERSION } from '@/lib/version'

/**
 * The marketing navbar (DESIGN.md): 72px, logo left, links centre, sign-in
 * plus the primary action right.
 *
 * Navbar buttons use size="nav" — the one sanctioned departure from the 44px
 * system button, because a 44px control in a 72px bar leaves too little room
 * above and below.
 *
 * Below md the links and actions collapse into the shared drawer rather than
 * wrapping: three links plus two buttons cannot fit a 375px bar legibly.
 */

const LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Languages', href: '#languages' },
  { label: 'Integrations', href: '#integrations' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-navbar w-full max-w-landing items-center justify-between gap-6 px-6 lg:px-8">
        <Wordmark />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-touch items-center text-[14px] text-muted transition-colors duration-fast ease-out-design hover:text-text"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ButtonLink href="/sign-in" variant="secondary" size="nav">
            Sign in
          </ButtonLink>
          <ButtonLink href="/meetings/new" variant="primary" size="nav">
            Add a meeting
          </ButtonLink>
        </div>

        {/* Default 44px, not size="nav": the 40px exception is for the desktop
            bar, and on mobile this is a touch target. */}
        <Button
          variant="secondary"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="marketing-drawer"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          Menu
        </Button>
      </div>

      <NavigationDrawer
        id="marketing-drawer"
        open={open}
        onClose={() => setOpen(false)}
        desktopAt={768}
        version={APP_VERSION}
      >
        <nav aria-label="Mobile">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <Link href="/sign-in">Sign in</Link>
        </nav>
        <ButtonLink href="/meetings/new" variant="primary" className="mt-3 w-full">
          Add a meeting
        </ButtonLink>
      </NavigationDrawer>
    </header>
  )
}

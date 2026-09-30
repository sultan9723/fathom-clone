import Link from 'next/link'
import { Wordmark } from './wordmark'
import { APP_VERSION } from '@/lib/version'

/**
 * DESIGN.md gives two footers and only two. A screen has exactly one.
 *
 * MarketingFooter: 84px, logo / links / credit, on the landing page.
 * AppFooter:       48px, one centred line, inside the app shell.
 */

const LINKS = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'GitHub', href: 'https://github.com/sultan9723/fathom-clone' },
  { label: 'Privacy', href: '/#privacy' },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex w-full max-w-landing flex-col items-center gap-4 px-6 py-6 text-center md:h-footer md:flex-row md:justify-between md:gap-6 md:py-0 md:text-left lg:px-8">
        <Wordmark size="sm" />

        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((link) => {
            const external = link.href.startsWith('http')
            return (
              <Link
                key={link.label}
                href={link.href}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="inline-flex min-h-touch items-center text-small text-muted transition-colors duration-fast ease-out-design hover:text-text"
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <span className="text-small text-faint">Built by Sultan Qaiser</span>
      </div>
    </footer>
  )
}

export function AppFooter() {
  return (
    <footer className="flex h-footer-app items-center justify-center border-t border-border-subtle">
      <span className="font-mono text-caption normal-case text-[#5E6570]">
        NoteAI · {APP_VERSION}
      </span>
    </footer>
  )
}

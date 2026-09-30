import type { Metadata } from 'next'
import Link from 'next/link'
import { Panel, ButtonLink } from '@/components/ui'

export const metadata: Metadata = { title: 'Sign in' }

/**
 * A dead end, so it should read as a deliberate one rather than a page that
 * failed to load.
 *
 * The card is centred in what is left of the viewport once the navbar and
 * footer have taken their height, instead of sitting at the top of a tall
 * empty canvas. The page carries no wordmark of its own — the navbar above
 * already has one, and the two stacked read as a rendering fault.
 *
 * The ambient background comes from the marketing layout, so this page gets
 * the same atmosphere as every other one without asking for it.
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-var(--navbar-h)-var(--footer-h))] items-center justify-center py-12">
      <Panel as="section" className="w-full max-w-[520px] p-8 text-center sm:p-10">
        <h1 className="text-h3 text-text">Sign-in isn&rsquo;t configured</h1>
        <p className="mx-auto mt-3 max-w-[40ch] text-body text-muted">
          This version uses a shared workspace. Individual accounts and private sharing are
          not available yet.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/meetings" variant="primary" className="w-full sm:w-auto">
            Open shared workspace
          </ButtonLink>
          <Link
            href="/"
            className="inline-flex min-h-touch items-center justify-center px-2 text-small text-muted underline underline-offset-4 transition-colors duration-fast ease-out-design hover:text-text"
          >
            Back to NoteAI
          </Link>
        </div>
      </Panel>
    </div>
  )
}

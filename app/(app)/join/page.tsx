import type { Metadata } from 'next'
import Link from 'next/link'
import { Panel } from '@/components/ui'

export const metadata: Metadata = { title: 'Add a meeting' }

/**
 * What to do when you want NoteAI to cover a meeting.
 *
 * This page previously offered Join and Upload buttons that, on submit, said
 * they could not join or upload. DESIGN.md's "only show what works" rules
 * that out: the page now states plainly what is not built and links to the
 * one route that is.
 */
export default function AddMeetingPage() {
  return (
    <div className="mx-auto w-full max-w-[760px]">
      <header className="border-b border-border-subtle pb-6">
        <h1 className="text-h2 text-text">Add a meeting</h1>
        <p className="mt-2 text-body text-muted">
          Bring a conversation into NoteAI so it can be searched, translated and summarized.
        </p>
      </header>

      <Panel as="section" className="mt-6 p-6">
        <h2 className="text-h4 font-semibold text-text">Import a transcript</h2>
        <p className="mt-2 text-body text-muted">
          If you already have a transcript, paste it in and NoteAI will take it from there.
          This is the way to add a meeting today.
        </p>
        <Link
          href="/meetings/new"
          className="mt-5 inline-flex h-control items-center justify-center rounded-control bg-accent px-5 font-semibold text-accent-ink transition-[background-color,opacity] duration-fast ease-out-design hover:brightness-95"
        >
          Import a transcript
        </Link>
      </Panel>

      <Panel as="section" className="mt-5 p-6">
        <h2 className="text-h4 font-semibold text-text">Joining live meetings is coming next</h2>
        <p className="mt-2 text-body text-muted">
          NoteAI cannot yet join a Zoom, Google Meet or Teams call, and cannot accept audio or
          video uploads. Nothing on this page records a meeting.
        </p>
        <p className="mt-3 text-body text-muted">
          When joining does arrive it will appear as a participant and show a recording notice
          to everyone in the call — no silent notetaker.
        </p>
      </Panel>
    </div>
  )
}

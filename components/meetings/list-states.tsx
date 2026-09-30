import { Button, Panel } from '@/components/ui'

/**
 * The three states the meeting list can be in besides having rows.
 *
 * Skeletons mirror the table's real shape — the same five columns at the
 * same widths — so the page doesn't reflow when the data lands. Shimmer is
 * DESIGN.md's one sanctioned gradient.
 */

export function MeetingsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite" className="pt-3">
      <span className="sr-only">Loading meetings…</span>
      <div className="border-b border-border-subtle pb-3" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-6 border-b border-border-subtle py-4"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Shimmer className="h-5 w-1/3" />
            <Shimmer className="h-4 w-2/3" />
          </div>
          <Shimmer className="hidden h-4 w-16 md:block" />
          <Shimmer className="hidden h-4 w-8 md:block" />
          <Shimmer className="hidden h-4 w-14 md:block" />
          <Shimmer className="hidden h-4 w-24 md:block" />
        </div>
      ))}
    </div>
  )
}

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-chip bg-surface-2 motion-safe:animate-pulse-dot ${className}`}
    />
  )
}

/**
 * Why the list is empty decides what to say. "No meetings yet" under an
 * active search would be wrong — there may be plenty, just none matching.
 */
export type EmptyReason = 'search' | 'week' | 'none'

export function MeetingsEmpty({ reason, query }: { reason: EmptyReason; query?: string }) {
  const { heading, body } = {
    search: {
      heading: 'No meetings match that search',
      body: `Nothing came back for “${query?.trim() ?? ''}”. Try a speaker's name, or a word you remember from the conversation.`,
    },
    week: {
      heading: 'No meetings this week',
      body: 'Switch to All to see everything NoteAI has transcribed.',
    },
    none: {
      heading: 'No meetings yet',
      body: 'Once NoteAI joins a meeting, its transcript, summary and action items appear here.',
    },
  }[reason]

  return (
    <Panel className="mt-6 px-6 py-12 text-center">
      <h2 className="text-h4 font-semibold text-text">{heading}</h2>
      <p className="mx-auto mt-2 max-w-sm text-body text-muted">{body}</p>
    </Panel>
  )
}

export function MeetingsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel className="mt-6 border-warn-border px-6 py-12 text-center">
      <h2 className="text-h4 font-semibold text-warn">We couldn&rsquo;t load your meetings</h2>
      <p className="mx-auto mt-2 max-w-sm text-body text-muted">
        The connection to the server failed. Your meetings are safe.
      </p>
      <Button variant="secondary" onClick={onRetry} className="mt-6">
        Try again
      </Button>
    </Panel>
  )
}

'use client'

import { Component, Fragment, type ReactNode } from 'react'
import { CalendarDays, CheckCheck, FileText, RefreshCw, Search, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('rounded bg-surface-4 motion-safe:animate-pulse', className)} />
}

export function MeetingListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading meetings" aria-busy="true">
      <span className="sr-only">Loading meetings…</span>
      <div aria-hidden="true" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="rounded-lg border border-line bg-surface-1 p-6">
            <SkeletonBlock className="h-5 w-3/4" />
            <SkeletonBlock className="mt-3 h-3.5 w-full" />
            <SkeletonBlock className="mt-2 h-3.5 w-2/3" />
            <div className="mt-4 flex gap-4">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-3 w-12" />
              <SkeletonBlock className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TranscriptSkeletonRows() {
  return (
    <div className="space-y-6">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="flex gap-3">
          <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between gap-4">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-3 w-8" />
            </div>
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="mt-2 h-3.5 w-5/6" />
            <SkeletonBlock className={cn('mt-2 h-3.5', index % 2 ? 'w-2/3' : 'w-1/2')} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TranscriptSkeleton({ label = 'Loading transcript' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}…</span>
      <div aria-hidden="true"><TranscriptSkeletonRows /></div>
    </div>
  )
}

export function MeetingDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading meeting"
      aria-busy="true"
      className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6"
    >
      <span className="sr-only">Loading meeting…</span>
      <div aria-hidden="true">
        <SkeletonBlock className="h-4 w-24" />
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full shrink-0 space-y-4 rounded-lg border border-line bg-white p-6 lg:w-[40%]">
            <SkeletonBlock className="h-7 w-5/6" />
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3 w-2/3" />
            <SkeletonBlock className="aspect-video w-full rounded-md" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex gap-6 border-b-2 border-line pb-3">
              <SkeletonBlock className="h-4 w-16" />
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-20" />
            </div>
            <div className="mt-4 rounded-lg border border-line bg-white p-6">
              <TranscriptSkeletonRows />
            </div>
          </div>
          <div className="w-full shrink-0 space-y-4 rounded-lg border border-line bg-white p-6 lg:w-[320px]">
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3.5 w-3/4" />
            <SkeletonBlock className="h-24 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

const EMPTY_STATES = {
  transcript: {
    icon: FileText,
    title: 'No transcript yet',
    description: 'Once a transcript is added to this meeting, you can read it here and explore translations.',
  },
  'action-items': {
    icon: CheckCheck,
    title: 'No action items assigned',
    description: 'There are no follow-ups to track yet. Assigned tasks will appear here so you can mark them complete.',
  },
  meetings: {
    icon: CalendarDays,
    title: 'No meetings yet',
    description: 'Your meetings will appear here once they are added, with transcripts and follow-ups in one place.',
  },
  search: {
    icon: Search,
    title: 'No meetings found',
    description: 'Try a different keyword or clear your search to see all meetings.',
  },
}

export function MeetingEmptyState({ kind }: { kind: keyof typeof EMPTY_STATES }) {
  const { icon: Icon, title, description } = EMPTY_STATES[kind]
  return (
    <div role="status" className="flex flex-col items-center px-4 py-10 text-center motion-safe:animate-fadein">
      <div className="mb-4 rounded-full bg-surface-2 p-3 text-brand">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-fg-1">{title}</h3>
      <p className="mt-2 max-w-sm text-md leading-6 text-fg-2">{description}</p>
    </div>
  )
}

export function MeetingLoadError({
  title = 'We couldn’t load this content',
  description = 'The connection may have been interrupted. Please try again in a moment.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry: () => void
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 px-4 py-8 text-center motion-safe:animate-fadein">
      <div role="alert">
        <WifiOff className="mx-auto mb-3 h-6 w-6 text-fg-2" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-fg-1">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-md leading-6 text-fg-2">{description}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-md font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  )
}

/** Isolates a render failure to one panel; retry mounts a fresh panel instance. */
export class MeetingPanelBoundary extends Component<
  { children: ReactNode; title?: string },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <MeetingLoadError
          title={this.props.title ?? 'This section is temporarily unavailable'}
          description="Something went wrong while displaying this section. Try opening it again."
          onRetry={() => this.setState(({ attempt }) => ({ failed: false, attempt: attempt + 1 }))}
        />
      )
    }

    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
  }
}

import Link from 'next/link'
import { Clock, CheckSquare, Sparkles } from 'lucide-react'
import type { MeetingListItem } from '@/lib/repository'
import { AvatarStack } from '@/components/ui/avatar'
import { PlatformBadge } from './platform-badge'
import { formatDuration, formatMeetingDate, formatMeetingTime } from '@/lib/utils'

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group flex w-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-lg hover:shadow-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <PlatformBadge platform={meeting.platform} />
        <time
          dateTime={meeting.date}
          className="shrink-0 text-xs text-slate-500"
          suppressHydrationWarning
        >
          {formatMeetingDate(meeting.date)}
        </time>
      </div>

      <h2 className="mt-3 text-base font-semibold leading-snug text-slate-900 group-hover:text-indigo-700">
        {meeting.title}
      </h2>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDuration(meeting.durationSec)}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatMeetingTime(meeting.date)}</span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <AvatarStack participants={meeting.participants} size="md" />
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {meeting.openActionItemCount > 0 && (
            <span
              className="inline-flex items-center gap-1"
              title={`${meeting.openActionItemCount} open of ${meeting.actionItemCount} action items`}
            >
              <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {meeting.openActionItemCount}
            </span>
          )}
          {meeting.highlightCount > 0 && (
            <span
              className="inline-flex items-center gap-1"
              title={`${meeting.highlightCount} highlights`}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {meeting.highlightCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

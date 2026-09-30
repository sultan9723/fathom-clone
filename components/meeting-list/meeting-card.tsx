import Link from 'next/link'
import { Play } from 'lucide-react'
import type { MeetingListItem } from '@/lib/repository'
import { PlatformBadge } from './platform-badge'
import { formatDuration, formatMeetingDate } from '@/lib/utils'

/**
 * Seed data has no thumbnailUrl (the field is genuinely absent, not just
 * empty) — a diagonal gradient from the first two participants' colors gives
 * each card a distinct, deterministic fill without a broken <img>. Swaps to
 * a real image with one conditional if thumbnailUrl is ever populated.
 */
function thumbnailStyle(meeting: MeetingListItem): React.CSSProperties {
  const [a, b] = meeting.participants
  const colorA = a?.color ?? '#343435'
  const colorB = b?.color ?? colorA
  return { background: `linear-gradient(135deg, ${colorA}, ${colorB})` }
}

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group relative flex w-full flex-col rounded-md transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:z-10 hover:scale-110 hover:shadow-lg focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-brand"
    >
      {/* Thumbnail — 16:9 via padding-top, per SPEC. */}
      <div
        className="relative w-full overflow-hidden rounded-t-md border border-[#26252a]"
        style={{ paddingTop: '56.25%' }}
      >
        <div
          className="absolute inset-0 opacity-50 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-115"
          style={thumbnailStyle(meeting)}
        />
        {/* Bottom vignette */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_-40px_40px_-20px_rgba(0,0,0,0.8)]" />
        {/* Play overlay, hidden until hover */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Play className="h-20 w-20 text-white/90" fill="currentColor" aria-hidden="true" />
        </div>
        {/* Duration badge */}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/50 px-1 py-px text-xs font-semibold text-fg-1">
          {formatDuration(meeting.durationSec)}
        </span>
      </div>

      {/* Caption */}
      <div className="rounded-b-md px-2 py-3 transition-colors duration-200 group-hover:bg-surface-3">
        <h2 className="truncate text-lg font-semibold text-fg-1">{meeting.title}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-fg-meta">
          <time dateTime={meeting.date} suppressHydrationWarning>
            {formatMeetingDate(meeting.date)}
          </time>
          <span aria-hidden="true">·</span>
          <PlatformBadge platform={meeting.platform} />
          <span aria-hidden="true">·</span>
          <span>
            {meeting.participants.length} participant{meeting.participants.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Link>
  )
}

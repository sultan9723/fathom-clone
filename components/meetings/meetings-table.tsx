'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ApiMeeting } from '@/lib/types'
import { formatDuration, formatMeetingDate } from '@/lib/utils'
import { i18nText, normalizeLanguage } from '@/lib/i18n-text'
import { stagger } from '@/lib/motion'

/**
 * The meeting list as a real table: each row is one meeting, and the columns
 * carry the facts you scan by — title and description, languages, speakers,
 * length, date.
 *
 * Below 640px a list of cards shows the title, date and duration.
 * Larger screens use a semantic table.
 */

/** Wraps every case-insensitive occurrence of `query` in a <mark>. */
function highlight(text: string, query: string): ReactNode {
  const needle = query.trim().toLowerCase()
  if (!needle) return text

  const parts: ReactNode[] = []
  const haystack = text.toLowerCase()
  let from = 0
  let found = haystack.indexOf(needle, from)

  while (found !== -1) {
    if (found > from) parts.push(text.slice(from, found))
    parts.push(
      <mark key={found} className="rounded-[3px] bg-accent-bg px-0.5 text-accent">
        {text.slice(found, found + needle.length)}
      </mark>
    )
    from = found + needle.length
    found = haystack.indexOf(needle, from)
  }
  if (from < text.length) parts.push(text.slice(from))
  return parts
}

/** "en,ur" -> the language names in their own scripts. */
function LanguageList({ languages }: { languages: string | null }) {
  const codes = (languages ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean)

  if (codes.length === 0) return <span className="text-faint">—</span>

  return (
    <span className="flex flex-wrap gap-x-2 gap-y-1">
      {codes.map((code) => {
        const { label, dir, lang, className } = i18nText(normalizeLanguage(code))
        return (
          <span key={code} dir={dir} lang={lang} className={`${className} text-small text-text-2`}>
            {label}
          </span>
        )
      })}
    </span>
  )
}

export function MeetingsTable({
  meetings,
  query = '',
  busy = false,
}: {
  meetings: ApiMeeting[]
  /** Highlighted inside titles and descriptions. */
  query?: string
  /** Dims the list while a refetch is in flight, rather than emptying it. */
  busy?: boolean
}) {
  return (
    <div
      aria-busy={busy}
      className={`overflow-x-auto transition-opacity duration-base ease-out-design ${
        busy ? 'opacity-60' : 'opacity-100'
      }`}
    >
      <ul className="space-y-3 sm:hidden" aria-label="Meetings">
        {meetings.map(meeting => (
          <li key={meeting.id} className="rounded-card border border-border bg-surface p-4">
            <Link href={`/meetings/${meeting.id}`} className="block break-words text-body-sm font-semibold text-text hover:text-accent">
              {highlight(meeting.title, query)}
            </Link>
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-small text-muted">
              <div><dt className="sr-only">Date</dt><dd>{formatMeetingDate(meeting.created_at)}</dd></div>
              <div><dt className="sr-only">Duration</dt><dd>{formatDuration(meeting.duration_seconds)}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
      <table className="hidden w-full border-collapse text-left sm:table">
        <thead>
          <tr className="border-b border-border-subtle">
            {['Meeting', 'Languages', 'Speakers', 'Length', 'Date'].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="hidden py-3 pr-6 text-label-sm uppercase text-faint sm:table-cell"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting, index) => (
            <tr
              key={meeting.id}
              style={{
                // DESIGN.md staggers related items; capped so a long list
                // doesn't leave the last row waiting seconds to appear.
                animationDelay: `${Math.min(index, 8) * stagger.tight}ms`,
              }}
              className="group block border-b border-border-subtle motion-safe:animate-enter hover:bg-surface-hover sm:table-row"
            >
              <td className="block py-4 pr-6 align-top sm:table-cell">
                <Link
                  href={`/meetings/${meeting.id}`}
                  className="block rounded-chip text-title font-semibold text-text transition-colors duration-fast ease-out-design group-hover:text-accent"
                >
                  {highlight(meeting.title, query)}
                </Link>
                {meeting.description && (
                  <p className="mt-1 max-w-prose text-small text-muted">
                    {highlight(meeting.description, query)}
                  </p>
                )}
              </td>

              <td className="hidden py-4 pr-6 align-top sm:table-cell">
                <LanguageList languages={meeting.languages} />
              </td>
              <td className="hidden py-4 pr-6 align-top text-small tabular-nums text-text-2 sm:table-cell">
                {meeting.speaker_count}
              </td>
              <td className="hidden py-4 pr-6 align-top text-small tabular-nums text-text-2 sm:table-cell">
                {formatDuration(meeting.duration_seconds)}
              </td>
              <td className="hidden whitespace-nowrap py-4 align-top text-small text-muted sm:table-cell">
                {formatMeetingDate(meeting.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

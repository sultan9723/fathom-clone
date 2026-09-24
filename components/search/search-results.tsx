import { Fragment } from 'react'
import type { SearchResult } from '@/lib/search'
import { formatMeetingDate } from '@/lib/utils'
import { PlatformIcon } from './platform-icon'
import { SearchResultRow } from './search-result-row'

interface MeetingGroup {
  meetingId: string
  meetingTitle: string
  meetingDate: string
  meetingPlatform: SearchResult['meetingPlatform']
  results: SearchResult[]
}

/**
 * Results already arrive grouped by meeting (searchAcrossMeetings iterates
 * meetings in order, then lines within each) — this just segments the flat
 * array into groups without re-sorting anything.
 */
function groupByMeeting(results: SearchResult[]): MeetingGroup[] {
  const groups: MeetingGroup[] = []
  for (const r of results) {
    const last = groups[groups.length - 1]
    if (last && last.meetingId === r.meetingId) {
      last.results.push(r)
    } else {
      groups.push({
        meetingId: r.meetingId,
        meetingTitle: r.meetingTitle,
        meetingDate: r.meetingDate,
        meetingPlatform: r.meetingPlatform,
        results: [r],
      })
    }
  }
  return groups
}

export function SearchResults({ results }: { results: SearchResult[] }) {
  const groups = groupByMeeting(results)

  return (
    <div>
      {groups.map((group, i) => (
        <Fragment key={group.meetingId}>
          {i > 0 && <div className="border-t border-topbar" />}
          <section className="py-4">
            <header className="mb-2 flex items-center gap-2 px-3">
              <PlatformIcon platform={group.meetingPlatform} />
              <h2 className="text-lg font-semibold text-fg-1">{group.meetingTitle}</h2>
              <span className="text-sm text-fg-meta" suppressHydrationWarning>
                {formatMeetingDate(group.meetingDate)}
              </span>
            </header>
            <ul>
              {group.results.map((r) => (
                <li key={r.line.id}>
                  <SearchResultRow result={r} />
                </li>
              ))}
            </ul>
          </section>
        </Fragment>
      ))}
    </div>
  )
}

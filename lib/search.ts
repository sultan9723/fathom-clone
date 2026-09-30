import type { Meeting } from './types'

export interface SearchResult {
  meetingId: string
  meetingTitle: string
  meetingDate: string
  meetingPlatform: Meeting['platform']
  speakerId: string
  speakerName: string
  line: {
    id: string
    text: string
    start: number
    end: number
  }
  /**
   * 120 chars around the match, with <mark> tags already inlined. Rendered
   * via dangerouslySetInnerHTML in app/search — safe only because every
   * character here comes from this repo's own static seed JSON, never from
   * a request at runtime. If this function's input ever includes anything
   * user-supplied, escape line.text before building this string.
   */
  snippet: string
}

export function searchAcrossMeetings(
  query: string,
  meetings: Meeting[]
): SearchResult[] {
  if (!query.trim()) return []

  const q = query.toLowerCase().trim()
  const results: SearchResult[] = []

  for (const meeting of meetings) {
    const speakerMap = new Map(
      meeting.participants.map((p) => [p.id, p])
    )

    for (const line of meeting.transcript) {
      if (line.text.toLowerCase().includes(q)) {
        const speaker = speakerMap.get(line.speakerId)
        const idx = line.text.toLowerCase().indexOf(q)
        const start = Math.max(0, idx - 40)
        const end = Math.min(line.text.length, idx + q.length + 80)
        const snippet = [
          start > 0 ? '…' : '',
          line.text.slice(start, idx),
          '<mark>',
          line.text.slice(idx, idx + q.length),
          '</mark>',
          line.text.slice(idx + q.length, end),
          end < line.text.length ? '…' : '',
        ].join('')

        results.push({
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingDate: meeting.date,
          meetingPlatform: meeting.platform,
          speakerId: line.speakerId,
          speakerName: speaker?.name ?? 'Unknown',
          line: {
            id: line.id,
            text: line.text,
            start: line.start,
            end: line.end,
          },
          snippet,
        })
      }
    }
  }

  return results
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

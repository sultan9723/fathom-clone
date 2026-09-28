import type { ApiTranscript } from './types'

export function parseMeetingLink(input: string): { url: string; platform: string } | null {
  try {
    const url = new URL(input.includes('://') ? input.trim() : `https://${input.trim()}`)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null
    const host = url.hostname.toLowerCase()
    const platform = (host === 'zoom.us' || host.endsWith('.zoom.us')) && /^\/(?:j|my)\/[^/]+/.test(url.pathname) ? 'Zoom'
      : host === 'meet.google.com' && /^\/[a-z]+-[a-z]+-[a-z]+\/?$/i.test(url.pathname) ? 'Google Meet'
        : (host === 'teams.microsoft.com' || host === 'teams.live.com') && url.pathname.length > 1 ? 'Microsoft Teams' : null
    return platform ? { url: url.toString(), platform } : null
  } catch { return null }
}

/** Link only exact timestamps actually present in this meeting's transcript. */
export function evidenceTimes(text: string, lines: ApiTranscript[]): number[] {
  const actual = new Set(lines.map(line => line.timestamp_seconds))
  const found = new Set<number>()
  for (const match of text.matchAll(/(?:^|[^\d:])(?:(\d{1,2}):)?(\d{1,3}):([0-5]\d)(?!\d|:)/g)) {
    const seconds = Number(match[1] || 0) * 3600 + Number(match[2]) * 60 + Number(match[3])
    if (actual.has(seconds)) found.add(seconds)
  }
  return [...found].sort((a, b) => a - b)
}

export function utcDate(iso: string): Date {
  return new Date(/[Zz]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)
}

export function inThisWeek(iso: string, now = new Date()): boolean {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  const date = utcDate(iso)
  return date >= start && date <= now
}

export function parseTranscriptImport(text: string) {
  const rows = text.split(/\r?\n/).filter(line => line.trim())
  if (!rows.length) throw new Error('Add at least one transcript line.')
  if (rows.length > 500) throw new Error('Import up to 500 lines at a time.')
  return rows.map((row, index) => {
    const match = /^\s*(\d{1,3}):([0-5]\d)\s*\|\s*([^|]+)\|\s*(.+)\s*$/.exec(row)
    if (!match) throw new Error(`Line ${index + 1}: use MM:SS | Speaker | What was said.`)
    const speaker_name = match[3].trim()
    if (speaker_name.length > 255) throw new Error(`Line ${index + 1}: the speaker name is too long.`)
    return { timestamp_seconds: Number(match[1]) * 60 + Number(match[2]), speaker_name, text: match[4].trim() }
  }).sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
}

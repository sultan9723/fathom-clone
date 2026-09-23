import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Meeting } from './types'

/**
 * Projection used by the meetings list. Deliberately excludes the transcript —
 * a list of 5 meetings should not ship ~40KB of dialogue to render cards.
 */
export type MeetingListItem = Pick<
  Meeting,
  'id' | 'title' | 'date' | 'durationSec' | 'platform' | 'participants' | 'thumbnailUrl'
> & {
  actionItemCount: number
  openActionItemCount: number
  highlightCount: number
}

export interface MeetingQuery {
  /** Case-insensitive substring match against the title. */
  search?: string
}

/**
 * The seam between the UI and storage. Everything above this interface is
 * storage-agnostic, so swapping JSON for Postgres means writing one new class
 * and changing one line in `getMeetingRepository`.
 */
export interface MeetingRepository {
  list(query?: MeetingQuery): Promise<MeetingListItem[]>
  getById(id: string): Promise<Meeting | null>
  /** Ids only — used by `generateStaticParams`. */
  listIds(): Promise<string[]>
}

const DATA_DIR = path.join(process.cwd(), 'data', 'meetings')

function toListItem(meeting: Meeting): MeetingListItem {
  return {
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    durationSec: meeting.durationSec,
    platform: meeting.platform,
    participants: meeting.participants,
    thumbnailUrl: meeting.thumbnailUrl,
    actionItemCount: meeting.actionItems.length,
    openActionItemCount: meeting.actionItems.filter((a) => !a.done).length,
    highlightCount: meeting.highlights.length,
  }
}

const PLATFORMS: ReadonlySet<string> = new Set(['zoom', 'meet', 'teams'])

/**
 * Fails loudly at load time rather than letting a malformed seed file surface
 * as an undefined somewhere deep in the UI.
 */
function assertMeeting(value: unknown, file: string): asserts value is Meeting {
  const m = value as Partial<Meeting> | null
  const problems: string[] = []

  if (!m || typeof m !== 'object') problems.push('not an object')
  else {
    if (typeof m.id !== 'string' || !m.id) problems.push('missing id')
    if (typeof m.title !== 'string' || !m.title) problems.push('missing title')
    if (typeof m.date !== 'string' || Number.isNaN(Date.parse(m.date))) problems.push('invalid date')
    if (typeof m.durationSec !== 'number' || m.durationSec <= 0) problems.push('invalid durationSec')
    if (typeof m.videoUrl !== 'string' || !m.videoUrl) problems.push('missing videoUrl')
    if (typeof m.platform !== 'string' || !PLATFORMS.has(m.platform)) problems.push('invalid platform')
    if (!Array.isArray(m.participants) || m.participants.length === 0) problems.push('no participants')
    if (!Array.isArray(m.transcript)) problems.push('missing transcript')
    if (!Array.isArray(m.actionItems)) problems.push('missing actionItems')
    if (!Array.isArray(m.highlights)) problems.push('missing highlights')
    if (!m.summary || typeof m.summary.overview !== 'string' || !Array.isArray(m.summary.keyPoints)) {
      problems.push('invalid summary')
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid meeting in ${file}: ${problems.join(', ')}`)
  }
}

/**
 * Reads every `*.json` under `/data/meetings`. Results are cached for the
 * lifetime of the process — the seed files are immutable at runtime, and this
 * keeps repeated `getById` calls from re-reading the directory.
 *
 * Server-only: importing this from a Client Component will fail to bundle.
 */
export class JsonMeetingRepository implements MeetingRepository {
  private cache: Promise<Meeting[]> | null = null

  constructor(private readonly dir: string = DATA_DIR) {}

  private loadAll(): Promise<Meeting[]> {
    // Cache the promise, not the value, so concurrent callers share one read.
    this.cache ??= this.readDir()
    return this.cache
  }

  private async readDir(): Promise<Meeting[]> {
    let files: string[]
    try {
      files = (await readdir(this.dir)).filter((f) => f.endsWith('.json'))
    } catch (err) {
      throw new Error(`Could not read meetings directory at ${this.dir}`, { cause: err })
    }

    const meetings = await Promise.all(
      files.map(async (file) => {
        const raw = await readFile(path.join(this.dir, file), 'utf8')
        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch (err) {
          throw new Error(`Malformed JSON in ${file}`, { cause: err })
        }
        assertMeeting(parsed, file)
        // Transcript order is load-bearing: the detail view binary-searches it.
        parsed.transcript = [...parsed.transcript].sort((a, b) => a.start - b.start)
        return parsed
      })
    )

    // Newest first.
    return meetings.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  }

  async list(query: MeetingQuery = {}): Promise<MeetingListItem[]> {
    const all = await this.loadAll()
    const search = query.search?.trim().toLowerCase()
    const filtered = search
      ? all.filter((m) => m.title.toLowerCase().includes(search))
      : all
    return filtered.map(toListItem)
  }

  async getById(id: string): Promise<Meeting | null> {
    const all = await this.loadAll()
    return all.find((m) => m.id === id) ?? null
  }

  async listIds(): Promise<string[]> {
    return (await this.loadAll()).map((m) => m.id)
  }
}

let repository: MeetingRepository | null = null

/** Single access point, so swapping the implementation touches one place. */
export function getMeetingRepository(): MeetingRepository {
  repository ??= new JsonMeetingRepository()
  return repository
}

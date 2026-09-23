import type { Meeting, Participant, TranscriptLine } from './types'

/**
 * Index of the line active at `time`, or -1 if the time falls in a gap
 * before the first line. Assumes `lines` is sorted by `start` (the
 * repository guarantees this) and runs in O(log n) so it is safe to call on
 * every `timeupdate`.
 *
 * Returns the last line that has started, which means during a pause between
 * utterances the previous speaker stays highlighted rather than the panel
 * flickering to nothing.
 */
export function findActiveLineIndex(lines: TranscriptLine[], time: number): number {
  let lo = 0
  let hi = lines.length - 1
  let result = -1

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (lines[mid]!.start <= time) {
      result = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }

  return result
}

/** Words that carry no signal for retrieval and would otherwise dominate scoring. */
const STOP_WORDS = new Set([
  'a', 'about', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'can',
  'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me', 'my', 'no',
  'not', 'of', 'on', 'or', 'our', 'out', 'she', 'so', 'than', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'to', 'up', 'us',
  'was', 'we', 'were', 'what', 'when', 'which', 'who', 'why', 'will', 'with',
  'would', 'you', 'your',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

export interface ScoredLine {
  line: TranscriptLine
  speaker: Participant | undefined
  score: number
}

/**
 * Small in-memory retrieval index over one meeting's transcript.
 *
 * Q&A needs to send the model the handful of lines that actually bear on the
 * question rather than the whole transcript — cheaper, faster, and it keeps
 * the answer anchored to real quotes. TF-IDF over ~40 lines is plenty here and
 * costs nothing; a real corpus would want embeddings.
 */
/** BM25 term-saturation and length-normalisation constants. */
const K1 = 1.2
const B = 0.75

export class TranscriptIndex {
  private readonly lines: TranscriptLine[]
  private readonly speakers: Map<string, Participant>
  /** token -> number of lines containing it */
  private readonly docFreq: Map<string, number>
  /** per-line token counts */
  private readonly termFreqs: Map<string, number>[]
  private readonly lineLengths: number[]
  private readonly avgLength: number

  constructor(meeting: Pick<Meeting, 'transcript' | 'participants'>) {
    this.lines = meeting.transcript
    this.speakers = new Map(meeting.participants.map((p) => [p.id, p]))
    this.docFreq = new Map()
    this.termFreqs = []
    this.lineLengths = []

    for (const line of this.lines) {
      const counts = new Map<string, number>()
      // Speaker name is indexed with the line so "what did Marcus say about X"
      // can match on the name as well as the content.
      const speakerName = this.speakers.get(line.speakerId)?.name ?? ''
      const tokens = tokenize(`${speakerName} ${line.text}`)
      for (const token of tokens) {
        counts.set(token, (counts.get(token) ?? 0) + 1)
      }
      this.termFreqs.push(counts)
      this.lineLengths.push(tokens.length)
      for (const token of counts.keys()) {
        this.docFreq.set(token, (this.docFreq.get(token) ?? 0) + 1)
      }
    }

    const total = this.lineLengths.reduce((a, b) => a + b, 0)
    this.avgLength = this.lines.length > 0 ? total / this.lines.length : 0
  }

  private idf(token: string): number {
    const df = this.docFreq.get(token) ?? 0
    if (df === 0) return 0
    return Math.log(1 + (this.lines.length - df + 0.5) / (df + 0.5))
  }

  /**
   * Highest-scoring lines for `query`, best first. Empty if nothing matches.
   *
   * Scored with BM25 rather than plain TF-IDF specifically for the length
   * normalisation: transcripts are full of three-word interjections ("The
   * export feature.") that match every query term and would otherwise
   * outrank the substantive line that actually answers the question.
   */
  search(query: string, limit = 8): ScoredLine[] {
    const terms = tokenize(query)
    if (terms.length === 0) return []

    const scored: ScoredLine[] = []
    for (let i = 0; i < this.lines.length; i++) {
      const counts = this.termFreqs[i]!
      const norm =
        this.avgLength > 0 ? 1 - B + (B * this.lineLengths[i]!) / this.avgLength : 1
      let score = 0
      for (const term of terms) {
        const tf = counts.get(term)
        if (tf) score += this.idf(term) * ((tf * (K1 + 1)) / (tf + K1 * norm))
      }
      if (score > 0) {
        const line = this.lines[i]!
        scored.push({ line, speaker: this.speakers.get(line.speakerId), score })
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Formats the best-matching lines as labelled, timestamped context for the
   * model. Neighbours of each hit are pulled in because a question's answer
   * often sits in the reply rather than the line that matched, then the whole
   * set is re-sorted chronologically so the model reads it as a conversation.
   */
  buildContext(query: string, { limit = 8, neighbours = 1 } = {}): string {
    const hits = this.search(query, limit)
    if (hits.length === 0) return ''

    const wanted = new Set<number>()
    for (const hit of hits) {
      const idx = this.lines.indexOf(hit.line)
      for (let i = idx - neighbours; i <= idx + neighbours; i++) {
        if (i >= 0 && i < this.lines.length) wanted.add(i)
      }
    }

    return [...wanted]
      .sort((a, b) => a - b)
      .map((i) => {
        const line = this.lines[i]!
        const name = this.speakers.get(line.speakerId)?.name ?? 'Unknown'
        return `[${formatSeconds(line.start)}] ${name}: ${line.text}`
      })
      .join('\n')
  }

  /**
   * The line following `line`, if any.
   *
   * A short hit is usually a question or an interjection ("The export
   * feature.") whose answer is in the next turn, and that next turn often
   * shares no vocabulary with the query — so retrieval alone cannot reach it.
   */
  lineAfter(line: TranscriptLine): TranscriptLine | undefined {
    const idx = this.lines.indexOf(line)
    return idx === -1 ? undefined : this.lines[idx + 1]
  }

  /** Resolves a line's speaker. */
  speakerOf(line: TranscriptLine): Participant | undefined {
    return this.speakers.get(line.speakerId)
  }

  /** Whole transcript, labelled — fallback when a query matches nothing. */
  fullText(): string {
    return this.lines
      .map((line) => {
        const name = this.speakers.get(line.speakerId)?.name ?? 'Unknown'
        return `[${formatSeconds(line.start)}] ${name}: ${line.text}`
      })
      .join('\n')
  }
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

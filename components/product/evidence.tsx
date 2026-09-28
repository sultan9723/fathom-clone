'use client'

import type { ApiTranscript } from '@/lib/types'
import { evidenceTimes } from '@/lib/product'
import { formatTimecode } from '@/lib/utils'

export function EvidenceLinks({ text, lines, onJump }: { text: string; lines: ApiTranscript[]; onJump: (seconds: number) => void }) {
  const times = evidenceTimes(text, lines)
  return times.length ? <div className="source-buttons" aria-label="Transcript sources">{times.map(seconds => <button key={seconds} type="button" onClick={() => onJump(seconds)}>Jump to {formatTimecode(seconds)}</button>)}</div> : <p className="product-caption">No matching source timestamp was returned. Check the transcript for context.</p>
}

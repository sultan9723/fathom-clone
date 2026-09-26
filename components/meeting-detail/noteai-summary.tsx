'use client'

/**
 * Summary tab.
 *
 * The backend stores no summary — Meeting is title/description/languages/
 * speaker_count/duration_seconds and nothing else. Rather than invent text,
 * this asks the real /api/v1/ai/ask endpoint for one on demand and renders
 * exactly what comes back. Until then the tab shows the meeting's own
 * description and an honest empty state.
 */

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import type { ApiMeeting } from '@/lib/types'
import { askAI } from '@/lib/api'
import { isUnavailableAnswer } from './noteai-ask'

const SUMMARY_PROMPT =
  'Summarise this meeting in one short paragraph, then list the key points as ' +
  'a bulleted list with one point per line starting with "- ". Use only the transcript.'

/** Splits the model's reply into its prose paragraph and its "- " bullets. */
function splitSummary(text: string): { overview: string; keyPoints: string[] } {
  const lines = text.split('\n')
  const overview: string[] = []
  const keyPoints: string[] = []
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (/^[-*•]\s+/.test(line)) keyPoints.push(line.replace(/^[-*•]\s+/, ''))
    else if (keyPoints.length === 0) overview.push(line)
  }
  return { overview: overview.join(' '), keyPoints }
}

export function NoteAiSummary({ meeting }: { meeting: ApiMeeting }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      setSummary(await askAI(meeting.id, SUMMARY_PROMPT))
    } catch {
      setError('Could not reach the assistant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const unavailable = summary !== null && isUnavailableAnswer(summary)
  const parsed = summary !== null && !unavailable ? splitSummary(summary) : null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-3">Description</h3>
        <p className="mt-2 text-md leading-5 text-fg-1">
          {meeting.description?.trim() || 'No description for this meeting.'}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-3">AI summary</h3>

        {summary === null && !loading && (
          <div className="mt-2">
            <p className="text-md text-fg-3">No summary generated yet.</p>
            <button
              type="button"
              onClick={generate}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-md font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-brand-hover"
            >
              <Sparkles className="h-4 w-4 text-cyan" aria-hidden="true" />
              Generate summary
            </button>
          </div>
        )}

        {loading && (
          <p className="mt-2 flex items-center gap-2 text-md text-fg-3">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Summarising the transcript…
          </p>
        )}

        {error && <p className="mt-2 text-md text-red-600">{error}</p>}

        {unavailable && (
          <div className="mt-2 animate-fadein rounded-md border border-line bg-surface-1 p-3">
            <p className="text-md font-medium text-fg-1">AI Q&amp;A not configured</p>
            <p className="mt-1 text-base text-fg-2">
              Set GROQ_API_KEY, ANTHROPIC_API_KEY or OPENAI_API_KEY on the backend to generate
              summaries.
            </p>
            <p className="mt-2 break-words font-mono text-xs text-fg-3">{summary}</p>
          </div>
        )}

        {parsed && (
          <div className="mt-2 animate-fadein" aria-live="polite">
            {parsed.overview && (
              <p className="whitespace-pre-wrap text-md leading-5 text-fg-1">{parsed.overview}</p>
            )}
            {parsed.keyPoints.length > 0 && (
              <>
                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-fg-3">
                  Key points
                </h4>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {parsed.keyPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-md leading-5 text-fg-1">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                      {point}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

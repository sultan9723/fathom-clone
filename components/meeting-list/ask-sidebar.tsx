'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, ArrowUp, Loader2, AlertTriangle } from 'lucide-react'
import { askMeeting, type AskAnswer } from '@/lib/ask-client'
import { formatTimecode } from '@/lib/utils'

const SUGGESTIONS = [
  'What was decided?',
  'What are the open action items?',
  'Summarize this call',
]

/**
 * Functional, not decorative: the scope dropdown picks one of the seed
 * meetings and this hits the exact same /api/ask flow as the per-call Ask
 * tab — there's no cross-meeting index, so "scope" here means "which
 * meeting," not "search everything at once."
 */
export function AskSidebar({ meetings }: { meetings: { id: string; title: string }[] }) {
  const [meetingId, setMeetingId] = useState(meetings[0]?.id ?? '')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<AskAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading || !meetingId) return

    setLoading(true)
    setError(null)
    setAnswer(null)
    try {
      setAnswer(await askMeeting(meetingId, trimmed))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (meetings.length === 0) return null

  return (
    <aside className="hidden w-ask-sidebar shrink-0 flex-col border-l-2 border-topbar lg:flex">
      <div className="flex items-center gap-2 px-4 pb-3 pt-5">
        <Sparkles className="h-4 w-4 text-fg-3" aria-hidden="true" />
        <span className="text-sm font-medium text-fg-3">ASK</span>
        <span className="text-sm font-bold text-fg-1">NoteAI</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {!answer && !loading && !error && (
          <div className="flex flex-wrap justify-end gap-2 py-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuestion(s)
                  submit(s)
                }}
                className="h-8 rounded-md border-2 border-topbar px-3 text-sm font-medium text-fg-1 transition-colors hover:border-surface-5"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-fg-3">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Thinking…
          </div>
        )}

        {error && (
          <p className="flex items-start gap-2 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {answer && (
          <div className="py-2" aria-live="polite">
            {answer.notice && (
              <p className="mb-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                {answer.notice}
              </p>
            )}
            <p className="whitespace-pre-wrap text-[15px] font-light leading-6 text-fg-1">
              {answer.answer}
            </p>
            {answer.citations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/meetings/${meetingId}?t=${answer.citations[0]}`}
                  className="rounded bg-brand/10 px-2 py-1 text-xs font-medium text-brand hover:bg-brand hover:text-surface-2"
                >
                  Open at {formatTimecode(answer.citations[0]!)}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(question)
        }}
        className="m-4 flex h-ask-composer flex-col justify-between rounded-md bg-topbar p-3"
      >
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything…"
          aria-label="Ask a question about a call"
          rows={2}
          className="w-full resize-none bg-transparent text-[15px] font-normal text-fg-1 placeholder:text-line focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          <select
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            aria-label="Which call to ask about"
            className="h-btn-sm rounded-md bg-surface-5 px-2 text-xs text-[#a9a9a9] focus:outline-none"
          >
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Send"
            className="grid h-send-circle w-send-circle shrink-0 place-items-center rounded-full bg-surface-5 text-fg-1 transition-opacity disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </aside>
  )
}

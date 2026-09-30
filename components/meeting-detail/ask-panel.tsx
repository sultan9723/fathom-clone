'use client'

import { useState } from 'react'
import { ArrowUp, Loader2, Play, AlertTriangle } from 'lucide-react'
import { askMeeting, AskError, type AskAnswer } from '@/lib/ask-client'
import { renderAskMarkdown } from '@/lib/ask-markdown'
import { formatTimecode } from '@/lib/utils'
import { usePlayer } from './player-provider'

const SUGGESTIONS = [
  'What was decided?',
  'What are the open action items?',
  'What were the main risks raised?',
]

export function AskPanel({ meetingId }: { meetingId: string }) {
  const { seek } = usePlayer()
  const [question, setQuestion] = useState('')
  const [askedQuestion, setAskedQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState<AskAnswer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return

    // Clear on submit, not on response — the input is free to type the next
    // question immediately, matching ordinary chat UX.
    setQuestion('')
    setAskedQuestion(trimmed)
    setLoading(true)
    setError(null)
    setAnswer(null)
    try {
      setAnswer(await askMeeting(meetingId, trimmed))
    } catch (err) {
      setError(err instanceof AskError || err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-labelledby="ask-heading" className="bg-page">
      <h2 id="ask-heading" className="sr-only">
        Ask about this meeting
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(question)
        }}
        className="mx-[15px] my-5"
      >
        <div className="relative">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask NoteAI…"
            aria-label="Ask a question about this meeting"
            maxLength={500}
            disabled={loading}
            // text-lg = 16px here (text-base is 13px in this project's
            // remapped scale) — the floor iOS needs to not zoom on focus.
            className="h-[41px] w-full rounded-md border-[0.67px] border-line-faint bg-transparent pl-3 pr-14 text-lg text-fg-1 placeholder:text-fg-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Ask"
            className="absolute right-1.5 top-1/2 grid h-[30px] w-ask-send -translate-y-1/2 place-items-center rounded-[5px] bg-brand text-white transition hover:bg-brand-hover disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>

      {!askedQuestion && !loading && !error && (
        <div className="mx-[15px] flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="rounded-md border-2 border-line px-3 py-1 text-xs text-fg-1 transition-colors hover:border-fg-3"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {askedQuestion && (
        <div className="mx-[15px] flex justify-end">
          <p className="max-w-[85%] rounded-md rounded-tr-none bg-surface-4 px-3 py-2 text-sm text-fg-1">
            {askedQuestion}
          </p>
        </div>
      )}

      {error && (
        <p className="mx-[15px] mt-3 flex items-start gap-2 rounded-md bg-error/10 px-3 py-2 text-sm text-error">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {loading && (
        <div className="mx-[15px] mt-3 flex items-center gap-2 text-sm text-fg-3">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Thinking…
        </div>
      )}

      {answer && (
        <div className="mx-[15px] mt-3" aria-live="polite">
          {answer.notice && (
            <p className="mb-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              {answer.notice}
            </p>
          )}
          <div className="text-[15px] font-light leading-6 text-fg-1">
            {renderAskMarkdown(answer.answer, seek)}
          </div>

          {answer.citations.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-fg-3">Jump to:</span>
              {answer.citations.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => seek(c)}
                  className="inline-flex items-center gap-1 rounded bg-brand/10 px-2 py-1 font-mono text-[11px] tabular-nums text-brand transition hover:bg-brand hover:text-surface-2"
                >
                  <Play className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true" />
                  {formatTimecode(c)}
                </button>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] text-fg-3">
            {answer.provider === 'mock'
              ? 'Transcript search — no AI provider configured.'
              : `Answered by ${answer.provider}. Grounded in the transcript; verify before relying on it.`}
          </p>
        </div>
      )}
    </section>
  )
}

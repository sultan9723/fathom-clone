'use client'

/**
 * Ask panel for a NoteAI meeting — POST /api/v1/ai/ask via lib/api.ts.
 *
 * The backend never fails a request because the AI is unavailable: with no key
 * configured it answers 200 with "API key not configured", and a provider
 * error comes back as "AI unavailable: …". Both are answers, not exceptions,
 * so they're detected here and shown as a notice instead of an answer.
 */

import { useState } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'
import { askAI } from '@/lib/api'
import { cn } from '@/lib/utils'

const NOT_CONFIGURED = 'API key not configured'

/** True when the backend answered with a "no AI available" notice. */
export function isUnavailableAnswer(answer: string): boolean {
  return answer === NOT_CONFIGURED || answer.startsWith('AI unavailable:')
}

export function NoteAiAsk({ meetingId }: { meetingId: string }) {
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState<string | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || loading) return

    setQuestion('')
    setAsked(trimmed)
    setAnswer(null)
    setError(null)
    setLoading(true)
    try {
      setAnswer(await askAI(meetingId, trimmed))
    } catch {
      setError('Could not reach the assistant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const unavailable = answer !== null && isUnavailableAnswer(answer)

  return (
    <section
      aria-labelledby="ask-heading"
      className="rounded-lg border border-line bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
    >
      <h2 id="ask-heading" className="text-xl font-bold text-fg-1">
        Ask NoteAI
      </h2>
      <p className="mt-1 text-base text-fg-2">
        Questions are answered from this meeting&apos;s transcript.
      </p>

      <form onSubmit={submit} className="relative mt-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this meeting..."
          aria-label="Ask about this meeting"
          maxLength={500}
          disabled={loading}
          // text-lg is 16px in this project's remapped scale — the floor iOS
          // needs to avoid zooming the page on focus.
          className="h-11 w-full rounded-md border border-line bg-surface-1 pl-3 pr-12 text-lg text-fg-1 placeholder-fg-3 transition-all duration-200 focus:border-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.15)] focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          aria-label="Send question"
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md bg-brand text-white transition-all duration-200 hover:scale-105 hover:bg-brand-hover disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </form>

      {asked && (
        <p className="mt-4 text-base font-medium text-fg-2">
          <span className="text-fg-3">You asked:</span> {asked}
        </p>
      )}

      {loading && (
        <p className="mt-3 flex items-center gap-2 text-md text-fg-3">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Thinking…
        </p>
      )}

      {error && <p className="mt-3 text-md text-red-600">{error}</p>}

      {answer !== null && !loading && (
        <div
          className={cn(
            'mt-3 animate-fadein',
            !unavailable && 'rounded-md border-l-2 border-cyan bg-surface-1 p-3'
          )}
          aria-live="polite"
        >
          {unavailable ? (
            <div className="rounded-md border border-line bg-surface-1 p-3">
              <p className="text-md font-medium text-fg-1">AI Q&amp;A not configured</p>
              <p className="mt-1 text-base text-fg-2">
                Set GROQ_API_KEY, ANTHROPIC_API_KEY or OPENAI_API_KEY on the backend to enable
                answers.
              </p>
              <p className="mt-2 break-words font-mono text-xs text-fg-3">{answer}</p>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-md leading-5 text-fg-1">{answer}</p>
          )}
        </div>
      )}
    </section>
  )
}

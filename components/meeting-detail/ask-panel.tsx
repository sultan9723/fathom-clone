'use client'

import { useState } from 'react'
import { Sparkles, CornerDownLeft, Loader2, Play, AlertTriangle } from 'lucide-react'
import { formatTimecode } from '@/lib/utils'
import { usePlayer } from './player-provider'

interface Answer {
  answer: string
  citations: number[]
  provider: 'claude' | 'openai' | 'mock'
  notice?: string
}

const SUGGESTIONS = [
  'What was decided?',
  'What are the open action items?',
  'What were the main risks raised?',
]

export function AskPanel({ meetingId }: { meetingId: string }) {
  const { seek } = usePlayer()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(q: string) {
    const trimmed = q.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setAnswer(null)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, question: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed.')
      setAnswer(data as Answer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      aria-labelledby="ask-heading"
      className="rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2
        id="ask-heading"
        className="flex items-center gap-2 text-sm font-semibold text-slate-900"
      >
        <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden="true" />
        Ask about this meeting
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(question)
        }}
        className="mt-3"
      >
        <div className="relative">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Why was the mobile rewrite cut?"
            aria-label="Ask a question about this meeting"
            maxLength={500}
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Ask"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-indigo-600 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>

      {!answer && !loading && !error && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuestion(s)
                submit(s)
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {answer && (
        <div className="mt-4" aria-live="polite">
          {answer.notice && (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {answer.notice}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {answer.answer}
          </p>

          {answer.citations.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Jump to:</span>
              {answer.citations.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => seek(c)}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] tabular-nums text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-700"
                >
                  <Play className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true" />
                  {formatTimecode(c)}
                </button>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] text-slate-400">
            {answer.provider === 'mock'
              ? 'Transcript search — no AI provider configured.'
              : `Answered by ${answer.provider}. Grounded in the transcript; verify before relying on it.`}
          </p>
        </div>
      )}
    </section>
  )
}

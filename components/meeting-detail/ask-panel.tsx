'use client'

import { useRef, useState } from 'react'
import { askAI } from '@/lib/api'
import { i18nText, type LanguageCode } from '@/lib/i18n-text'
import { Button, Input, Panel } from '@/components/ui'
import { Markdown } from '@/components/ui/markdown'

/**
 * Ask a question about this meeting, answered from its transcript.
 *
 * The answer comes back in whichever language the transcript is being read
 * in: switching "Read in" to اردو and then asking a question in English
 * should still answer in Urdu, because that is the language the reader chose.
 */

interface Exchange {
  id: number
  question: string
  answer: string | null
  error: string | null
  lang: LanguageCode
}

export function AskPanel({ meetingId, lang }: { meetingId: string; lang: LanguageCode }) {
  const [question, setQuestion] = useState('')
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [busy, setBusy] = useState(false)
  const nextId = useRef(0)

  const target = i18nText(lang)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const asked = question.trim()
    if (!asked || busy) return

    const id = nextId.current++
    setExchanges((current) => [...current, { id, question: asked, answer: null, error: null, lang }])
    setQuestion('')
    setBusy(true)

    try {
      const answer = await askAI(
        meetingId,
        `${asked}\n\nAnswer only in ${target.label}.`
      )
      setExchanges((current) =>
        current.map((item) => (item.id === id ? { ...item, answer } : item))
      )
    } catch (error) {
      setExchanges((current) =>
        current.map((item) =>
          item.id === id ? { ...item, error: (error as Error).message } : item
        )
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel as="section" aria-labelledby="ask-heading" className="p-5">
      <h2 id="ask-heading" className="text-label-sm uppercase text-faint">
        Ask
      </h2>
      <p className="mt-2 text-small text-muted">
        Answered from this meeting&rsquo;s transcript, in {target.label}.
      </p>

      {exchanges.length > 0 && (
        <ol className="mt-4 space-y-4">
          {exchanges.map((exchange) => {
            const answerLang = i18nText(exchange.lang)
            return (
              <li key={exchange.id} className="motion-safe:animate-enter">
                <p className="text-small font-medium text-text-2">{exchange.question}</p>
                <div aria-live="polite" aria-busy={exchange.answer === null && !exchange.error}>
                {exchange.answer !== null && (
                  <Markdown
                    text={exchange.answer}
                    dir={answerLang.dir}
                    lang={answerLang.lang}
                    className={`${answerLang.className} mt-1 text-body-sm text-text`}
                  />
                )}
                {exchange.error && (
                  <p role="alert" className="mt-1 text-small text-warn">
                    {exchange.error}
                  </p>
                )}
                {exchange.answer === null && !exchange.error && (
                  <p role="status" className="mt-1 text-small text-muted">
                    Reading the transcript…
                  </p>
                )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <label htmlFor="ask-input" className="sr-only">
          Ask about this meeting
        </label>
        <Input
          id="ask-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What did they decide about the launch date?"
          disabled={busy}
        />
        <Button type="submit" variant="primary" disabled={busy || !question.trim()}>
          {busy ? 'Asking…' : 'Ask'}
        </Button>
      </form>
    </Panel>
  )
}

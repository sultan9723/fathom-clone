'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Input, Panel } from '@/components/ui'
import { askMeeting } from '@/lib/product-api'
import { i18nText } from '@/lib/i18n-text'
import type { ApiTranscript } from '@/lib/types'
import { ScriptText, useReadingLanguage } from './preferences'
import { EvidenceLinks } from './evidence'
import { TranslatedText } from './translated-text'
import { LoadingState, Notice } from './states'

function useAssistant() {
  const [answer, setAnswer] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const request = useRef<AbortController | null>(null)
  useEffect(() => () => request.current?.abort(), [])
  async function run(id: string, question: string) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setBusy(true); setError(null); setAnswer(null)
    try { const text = await askMeeting(id, question, controller.signal); if (!controller.signal.aborted) setAnswer(text) }
    catch (failure) { if (!controller.signal.aborted) setError((failure as Error).message) }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  return { answer, busy, error, run, cancel: () => { request.current?.abort(); setBusy(false); setError('Request canceled. You can try again when ready.') } }
}

export function MeetingSummary({ meetingId, lines, onJump, onSummary }: { meetingId: string; lines: ApiTranscript[]; onJump: (seconds: number) => void; onSummary: (text: string) => void }) {
  const assistant = useAssistant()
  useEffect(() => { onSummary(assistant.answer ?? '') }, [assistant.answer, onSummary])
  const generate = () => assistant.run(meetingId, 'Summarize this meeting in English. Use headings Summary and Decisions. Only use the transcript. For each decision cite an exact transcript timestamp in [MM:SS] form. If there are no decisions, say so. Do not invent details.')
  return <Panel className="meeting-side-panel"><h2 className="panel-eyebrow">Summary</h2>{assistant.busy ? <LoadingState label="Summarizing the transcript" onCancel={assistant.cancel} /> : assistant.answer ? <><TranslatedText text={assistant.answer} source="en" className="summary-content" /><EvidenceLinks text={assistant.answer} lines={lines} onJump={onJump} /><p className="product-caption">Generated from this meeting for this session. Review against the transcript.</p></> : <p className="product-caption">No summary generated yet.</p>}
    {assistant.error && <Notice title="Summary unavailable" warning onRetry={generate}>{assistant.error}</Notice>}
    {!assistant.busy && <div className="product-actions"><Button onClick={generate} disabled={!lines.length}>{assistant.answer ? 'Regenerate summary' : 'Generate summary'}</Button></div>}{!lines.length && <p className="product-caption">A transcript is needed to generate a summary.</p>}
  </Panel>
}

export function MeetingAsk({ meetingId, lines, onJump }: { meetingId: string; lines: ApiTranscript[]; onJump: (seconds: number) => void }) {
  const { language } = useReadingLanguage()
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState('')
  const [answerLanguage, setAnswerLanguage] = useState(language)
  const assistant = useAssistant()
  function ask(value: string) {
    setAsked(value); setAnswerLanguage(language)
    void assistant.run(meetingId, `${value}\nAnswer in ${i18nText(language).label}. Use only this meeting and cite exact transcript timestamps in [MM:SS] form. If the transcript does not answer, say so.`)
  }
  function submit(event: FormEvent) { event.preventDefault(); if (question.trim() && !assistant.busy) ask(question.trim()) }
  return <Panel className="meeting-side-panel"><h2 className="panel-eyebrow">Ask this meeting</h2><p className="product-caption">Answers use this meeting’s transcript. Source links match recorded timestamps.</p>{asked && <p className="asked-question" dir="auto">{asked}</p>}
    {assistant.busy && <LoadingState label="Finding an answer" onCancel={assistant.cancel} />}
    {assistant.error && <Notice title="Could not get an answer" warning onRetry={() => ask(asked)}>{assistant.error}</Notice>}
    {assistant.answer && <div aria-live="polite"><div className="answer-content"><ScriptText language={answerLanguage}>{assistant.answer}</ScriptText></div><EvidenceLinks text={assistant.answer} lines={lines} onJump={onJump} /></div>}
    <form onSubmit={submit} className="ask-form"><Input aria-label="Ask this meeting" placeholder="Ask in any language" maxLength={500} value={question} onChange={event => setQuestion(event.target.value)} disabled={assistant.busy || !lines.length} /><Button type="submit" disabled={!question.trim() || assistant.busy || !lines.length}>Ask</Button></form>{!lines.length && <p className="product-caption">Add a transcript before asking a question.</p>}
  </Panel>
}

'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button, Panel, ButtonLink } from '@/components/ui'
import { addTranscript, createMeeting } from '@/lib/product-api'
import { parseTranscriptImport } from '@/lib/product'
import type { LanguageCode } from '@/lib/i18n-text'
import { LanguageSelect } from './preferences'
import { Notice } from './states'

export function ImportMeeting() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [minutes, setMinutes] = useState('')
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [stopped, setStopped] = useState(false)
  const stop = useRef(false)
  const submitting = useRef(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting.current || savedId) return
    let lines: ReturnType<typeof parseTranscriptImport>
    try {
      lines = parseTranscriptImport(text)
      if (!title.trim()) throw new Error('Enter a meeting title.')
      if (!Number.isFinite(Number(minutes)) || Number(minutes) <= 0) throw new Error('Enter the meeting length in minutes.')
      if (lines[lines.length - 1].timestamp_seconds > Number(minutes) * 60) throw new Error('The meeting length must include the last transcript timestamp.')
    } catch (failure) { setError((failure as Error).message); return }
    submitting.current = true; stop.current = false; setBusy(true); setStopped(false); setError(null); setCount(0); setTotal(lines.length)
    try {
      const meeting = await createMeeting({ title: title.trim(), description: description.trim(), languages: language, speaker_count: new Set(lines.map(line => line.speaker_name)).size, duration_seconds: Math.round(Number(minutes) * 60) })
      setSavedId(meeting.id)
      for (const line of lines) {
        if (stop.current) { setStopped(true); break }
        // Writes finish in flight before cancel takes effect. The saved meeting
        // is retained so a partial import cannot silently vanish or be duplicated.
        await addTranscript(meeting.id, { ...line, original_language: language })
        setCount(value => value + 1)
      }
    } catch (failure) { setError((failure as Error).message) }
    finally { submitting.current = false; setBusy(false) }
  }
  return <div className="product-page"><Link href="/meetings" className="product-text-link">← Meetings</Link><header className="product-page-header"><div><h1>Import a transcript</h1><p>Save your existing notes with speakers and timestamps. This imports text; it does not transcribe audio.</p></div></header>
    <Panel className="product-section"><form onSubmit={submit} className="product-form"><fieldset disabled={busy || !!savedId} className="product-form"><label className="product-field">Meeting title<input required maxLength={255} value={title} onChange={event => setTitle(event.target.value)} /></label><label className="product-field">Description<textarea value={description} onChange={event => setDescription(event.target.value)} /></label><div className="form-grid"><LanguageSelect id="import-language" value={language} onChange={setLanguage} label="Spoken language" /><label className="product-field">Meeting length (minutes)<input type="number" required min="1" max="1440" value={minutes} onChange={event => setMinutes(event.target.value)} /></label></div><label className="product-field">Transcript<textarea required rows={10} aria-describedby="transcript-format" value={text} onChange={event => setText(event.target.value)} /></label><p id="transcript-format" className="product-caption">One line per moment: MM:SS | Speaker | What was said. Up to 500 lines. Include only content you are allowed to store.</p></fieldset><div className="product-actions">{!savedId && <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Creating meeting…' : 'Save meeting'}</Button>}{busy && <Button onClick={() => { stop.current = true; setStopped(true) }}>Cancel remaining import</Button>}{!busy && !savedId && <ButtonLink href="/meetings">Cancel</ButtonLink>}</div></form>
      {busy && <div role="status" className="product-caption">Saving transcript: {count} of {total} lines. {stopped && 'Stopping after the current line.'}<div role="progressbar" aria-label="Transcript import" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count} className="product-progress"><span style={{ transform: `scaleX(${total ? count / total : 0})` }} /></div></div>}
      {error && <Notice title="The import needs attention" warning><p>{error}</p>{!savedId && <p>Your text has been kept. Correct it or try saving again.</p>}</Notice>}
      {savedId && !busy && <Notice title={count === total && !error ? 'Meeting saved' : 'Your partial import is saved'}><p>{count} of {total} transcript lines confirmed saved. {count < total && 'Open the meeting to review what was saved before making another import.'}</p><ButtonLink href={`/meetings/${encodeURIComponent(savedId)}`} variant="primary">Open meeting</ButtonLink></Notice>}
    </Panel></div>
}

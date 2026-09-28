'use client'

import { useState, useId, type FormEvent } from 'react'
import Link from 'next/link'
import { Badge, Button, Input } from '@/components/ui'
import { parseMeetingLink } from '@/lib/product'
import { Notice } from './states'

export function JoinForm({ compact = false, initialLink = '' }: { compact?: boolean; initialLink?: string }) {
  const id = useId()
  const [link, setLink] = useState(initialLink)
  const [selected, setSelected] = useState('Zoom')
  const [state, setState] = useState<'idle' | 'invalid' | 'unavailable' | 'upload'>('idle')
  const detected = parseMeetingLink(link)
  function submit(event: FormEvent) { event.preventDefault(); setState(detected ? 'unavailable' : 'invalid') }
  return <div className={`join-entry ${compact ? 'join-entry-compact' : ''}`}>
    <form onSubmit={submit} className="join-entry-form"><div className="join-input"><label htmlFor={id} className="sr-only">Meeting link</label><Input id={id} mono value={link} placeholder={`Paste a ${selected} meeting link`} onChange={event => { setLink(event.target.value); setState('idle') }} aria-invalid={state === 'invalid'} aria-describedby={state === 'invalid' ? `${id}-error` : `${id}-availability`} />{detected && <Badge>{detected.platform}</Badge>}</div><Button onClick={() => setState('upload')}>Upload recording</Button><Button variant="primary" type="submit">Join</Button></form>
    {!compact && <div className="platform-choices" role="group" aria-label="Meeting platform">{['Zoom', 'Google Meet', 'Microsoft Teams'].map(platform => <button key={platform} type="button" aria-pressed={(detected?.platform ?? selected) === platform} onClick={() => setSelected(platform)}>{platform}</button>)}</div>}
    <p id={`${id}-availability`} className="product-caption">Live joining and recording uploads are not available in this workspace yet.</p>
    {state === 'invalid' && <p id={`${id}-error`} role="alert" className="product-error">Enter a valid Zoom, Google Meet or Microsoft Teams meeting link.</p>}
    {state === 'unavailable' && <Notice title="NoteAI couldn’t join this meeting" warning onRetry={() => { setState('idle'); document.getElementById(id)?.focus() }} onCancel={() => setState('idle')}><p>{detected?.platform} joining is not connected. NoteAI has not entered or recorded this call.</p><p>You can work with a transcript you already have.</p><Link className="product-text-link" href="/meetings/new">Import a transcript</Link><button className="product-text-link" type="button" onClick={() => setState('upload')}>Upload instead</button></Notice>}
    {state === 'upload' && <Notice title="Recording uploads are not available yet" onCancel={() => setState('idle')}><p>This workspace cannot store or transcribe audio and video recordings yet. No file has been uploaded.</p><Link href="/meetings/new" className="product-text-link">Import an existing transcript instead</Link></Notice>}
  </div>
}

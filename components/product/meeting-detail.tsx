'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Button, Panel } from '@/components/ui'
import type { ApiActionItem, ApiMeeting, ApiTranscript } from '@/lib/types'
import { readActions, readMeeting, readTranscript } from '@/lib/product-api'
import { utcDate } from '@/lib/product'
import { formatDuration, formatTimecode } from '@/lib/utils'
import { PlayerProvider, usePlayer } from '@/components/meeting-detail/player-provider'
import { useResource } from './use-resource'
import { LoadingState, Notice } from './states'
import { MeetingTranscript } from './meeting-transcript'
import { MeetingSummary, MeetingAsk } from './meeting-intelligence'
import { ActionList } from './action-list'
import { MeetingTools } from './meeting-tools'

export function MeetingDetail({ meetingId, initialQuery = '', initialTime = 0 }: { meetingId: string; initialQuery?: string; initialTime?: number }) {
  const metadata = useResource(signal => readMeeting(meetingId, signal), meetingId)
  if (metadata.loading) return <LoadingState label="Loading meeting" onCancel={metadata.cancel} />
  if (metadata.error || metadata.canceled || !metadata.data) return <><Link className="product-text-link" href="/meetings">← Meetings</Link><Notice title={metadata.canceled ? 'Loading canceled' : 'Could not load this meeting'} warning={!!metadata.error} onRetry={metadata.retry}>{metadata.error}</Notice></>
  return <MeetingContent key={metadata.data.id} originalMeeting={metadata.data} initialQuery={initialQuery} initialTime={initialTime} />
}

function MeetingContent({ originalMeeting, initialQuery, initialTime }: { originalMeeting: ApiMeeting; initialQuery: string; initialTime: number }) {
  const [meeting, setMeeting] = useState(originalMeeting)
  const transcript = useResource(signal => readTranscript(meeting.id, signal), meeting.id)
  const actions = useResource(signal => readActions(meeting.id, signal), meeting.id)
  const [saved, setSaved] = useState<Record<string, ApiActionItem>>({})
  const [summary, setSummary] = useState('')
  const onSaved = useCallback((item: ApiActionItem) => setSaved(current => ({ ...current, [item.id]: item })), [])
  const lines = transcript.data ?? []
  const items = [...new Map([...(actions.data ?? []), ...Object.values(saved)].map(item => [item.id, item])).values()]
  const duration = Math.max(meeting.duration_seconds, ...lines.map(line => line.timestamp_seconds), 0)
  return <PlayerProvider durationSec={duration} initialTime={initialTime}><MeetingBody meeting={meeting} lines={lines} items={items} query={initialQuery} summary={summary} setSummary={setSummary} setMeeting={setMeeting} onSaved={onSaved} transcript={transcript} actions={actions} /></PlayerProvider>
}

function MeetingBody({ meeting, lines, items, query, summary, setSummary, setMeeting, onSaved, transcript, actions }: {
  meeting: ApiMeeting; lines: ApiTranscript[]; items: ApiActionItem[]; query: string; summary: string;
  setSummary: (summary: string) => void; setMeeting: (meeting: ApiMeeting) => void; onSaved: (item: ApiActionItem) => void;
  transcript: ReturnType<typeof useResource<ApiTranscript[]>>; actions: ReturnType<typeof useResource<ApiActionItem[]>>
}) {
  const { currentTime, duration, seek } = usePlayer()
  const [jumpVersion, setJumpVersion] = useState(0)
  const source = meeting.languages?.split(',')[0]?.trim().toLowerCase() || 'en'
  const jump = useCallback((seconds: number) => {
    seek(seconds)
    setJumpVersion(value => value + 1)
    const url = new URL(window.location.href); url.searchParams.set('t', String(seconds)); window.history.replaceState(window.history.state, '', url)
    requestAnimationFrame(() => document.getElementById(`transcript-${seconds}`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' }))
  }, [seek])
  const ready = !transcript.loading && !actions.loading && !transcript.error && !actions.error && !transcript.canceled && !actions.canceled
  return <div className="product-page"><Link className="product-text-link" href="/meetings">← Meetings</Link><header className="product-page-header"><div><h1>{meeting.title}</h1><p>{utcDate(meeting.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · {formatDuration(meeting.duration_seconds)} · {meeting.speaker_count} people · {meeting.languages?.toUpperCase() || 'Language not supplied'}</p>{meeting.description && <p>{meeting.description}</p>}</div><MeetingTools meeting={meeting} lines={lines} actions={items} summary={summary} onUpdated={setMeeting} complete={ready} /></header>
    <Panel className="transcript-timeline"><div className="timeline-header"><h2>Transcript timeline</h2><p>No recording is attached. Navigate the saved transcript by timestamp.</p></div><div className="timeline-range"><input aria-label="Transcript position" aria-valuetext={formatTimecode(currentTime)} type="range" min={0} max={duration} step={1} disabled={!lines.length} value={Math.min(currentTime, duration)} onChange={event => jump(Number(event.target.value))} /><output>{formatTimecode(currentTime)} / {formatTimecode(duration)}</output></div></Panel>
    <div className="meeting-columns"><div>{transcript.loading ? <Panel><LoadingState label="Loading transcript" onCancel={transcript.cancel} /></Panel> : transcript.error || transcript.canceled ? <Notice title={transcript.canceled ? 'Transcript loading canceled' : 'Could not load the transcript'} warning={!!transcript.error} onRetry={transcript.retry}>{transcript.error}</Notice> : <MeetingTranscript meetingId={meeting.id} lines={lines} source={source} query={query} jumpVersion={jumpVersion} onJump={jump} />}</div>
      <div className="meeting-side-stack"><MeetingSummary meetingId={meeting.id} lines={lines} onJump={jump} onSummary={setSummary} /><Panel className="meeting-side-panel"><h2 className="panel-eyebrow">Action items</h2>{actions.loading ? <LoadingState label="Loading action items" onCancel={actions.cancel} /> : actions.error || actions.canceled ? <Notice title={actions.canceled ? 'Loading canceled' : 'Could not load action items'} warning={!!actions.error} onRetry={actions.retry}>{actions.error}</Notice> : <ActionList meetingId={meeting.id} items={items} source={source} lines={lines} onJump={jump} onSaved={onSaved} />}</Panel><MeetingAsk meetingId={meeting.id} lines={lines} onJump={jump} /></div>
    </div><Panel className="product-section participants-panel"><h2>Speakers in this transcript</h2><p>{[...new Set(lines.map(line => line.speaker_name || 'Unknown speaker'))].join(' · ') || 'No speakers recorded yet.'}</p><p>Individual reading preferences, meeting platform and live status are not supplied by this workspace. NoteAI is not listening to a live call.</p></Panel>
    <div className="product-actions"><Button onClick={() => { transcript.retry(); actions.retry() }}>Refresh meeting content</Button></div>
  </div>
}

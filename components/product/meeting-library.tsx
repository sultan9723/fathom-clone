'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { findMeetings, listMeetings } from '@/lib/product-api'
import { inThisWeek, utcDate } from '@/lib/product'
import { formatTimecode } from '@/lib/utils'
import { i18nText } from '@/lib/i18n-text'
import { JoinForm } from './join-form'
import { ScriptText } from './preferences'
import { EmptyState, LoadingState, Notice } from './states'
import { useResource } from './use-resource'

export function MeetingLibrary() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [language, setLanguage] = useState('all')
  const [speakers, setSpeakers] = useState('all')
  const [duration, setDuration] = useState('all')
  const result = useResource(signal => query ? findMeetings(query, signal) : listMeetings(signal), query)
  const meetings = (result.data ?? []).filter(meeting => {
    if (filter === 'week' && !inThisWeek(meeting.created_at)) return false
    if (filter === 'live') return false // No live status is supplied by this API.
    if (language !== 'all' && !(meeting.languages ?? '').split(',').map(code => code.trim().toLowerCase()).includes(language)) return false
    if (speakers === 'small' && meeting.speaker_count > 2) return false
    if (speakers === 'medium' && (meeting.speaker_count < 3 || meeting.speaker_count > 5)) return false
    if (speakers === 'large' && meeting.speaker_count < 6) return false
    if (duration === 'short' && meeting.duration_seconds >= 1800) return false
    if (duration === 'medium' && (meeting.duration_seconds < 1800 || meeting.duration_seconds > 3600)) return false
    if (duration === 'long' && meeting.duration_seconds <= 3600) return false
    return true
  })
  const codes = [...new Set((result.data ?? []).flatMap(meeting => (meeting.languages ?? '').split(',').map(code => code.trim().toLowerCase()).filter(Boolean)))]
  function reset() { setFilter('all'); setLanguage('all'); setSpeakers('all'); setDuration('all'); setInput(''); setQuery('') }
  return <div className="product-page"><header className="product-page-header"><h1>Meetings</h1><form className="product-search" onSubmit={event => { event.preventDefault(); setQuery(input.trim()) }}><Input type="search" aria-label="Search transcripts" placeholder="Search transcripts" value={input} onChange={event => setInput(event.target.value)} /><Button type="submit">Search</Button></form></header>
    <JoinForm compact />
    <div className="library-toolbar"><div className="library-filters" role="group" aria-label="Filter meetings">{[{ id: 'all', label: 'All' }, { id: 'live', label: 'Live now' }, { id: 'week', label: 'This week' }].map(option => <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}</div><span className="library-count" role="status">{result.loading ? 'Loading meetings…' : `${meetings.length} meeting${meetings.length === 1 ? '' : 's'}${query ? ` matching “${query}”` : ''}`}</span><Link href="/meetings/new" className="product-text-link">Import transcript</Link></div>
    <details className="library-extra-filters"><summary>More filters</summary><div className="form-grid"><label className="product-field">Language<select value={language} onChange={event => setLanguage(event.target.value)}><option value="all">All languages</option>{codes.map(code => <option key={code} value={code}>{i18nText(code).label}</option>)}</select></label><label className="product-field">Speakers<select value={speakers} onChange={event => setSpeakers(event.target.value)}><option value="all">Any</option><option value="small">1–2</option><option value="medium">3–5</option><option value="large">6+</option></select></label><label className="product-field">Length<select value={duration} onChange={event => setDuration(event.target.value)}><option value="all">Any</option><option value="short">Under 30 minutes</option><option value="medium">30–60 minutes</option><option value="long">Over 60 minutes</option></select></label></div></details>
    {filter === 'live' ? <Notice title="Live meeting status is not available"><p>This workspace cannot join or monitor live calls yet. Saved meetings remain available under All.</p><Button onClick={() => setFilter('all')}>Show all meetings</Button></Notice>
      : result.loading ? <LoadingState label="Loading meetings" onCancel={result.cancel} />
        : result.error || result.canceled ? <Notice title={result.canceled ? 'Loading canceled' : 'We couldn’t load your meetings'} warning={!!result.error} onRetry={result.retry}>{result.error}</Notice>
          : meetings.length === 0 ? <EmptyState title={result.data?.length || query ? 'No meetings match' : 'No meetings yet'} action={result.data?.length || query ? <Button onClick={reset}>Clear filters</Button> : <><Link className="product-link-button primary" href="/meetings/new">Import transcript</Link><Link className="product-link-button" href="/join">Join / upload options</Link></>}>{result.data?.length || query ? 'Try a different search or clear the filters.' : 'Import a transcript to create your first meeting. Live joining and recording uploads are not connected yet.'}</EmptyState>
            : <table className="meeting-table"><caption className="sr-only">Saved meetings</caption><thead><tr><th scope="col">Meeting</th><th scope="col" className="platform-column">Platform</th><th scope="col">Languages</th><th scope="col">Speakers</th><th scope="col">Length</th><th scope="col">Date</th></tr></thead><tbody>{meetings.map(meeting => <tr key={meeting.id}><td><Link href={`/meetings/${encodeURIComponent(meeting.id)}${query ? `?q=${encodeURIComponent(query)}` : ''}`}>{meeting.title}</Link>{meeting.description && <p>{meeting.description}</p>}</td><td className="platform-column" data-label="Platform">Not supplied</td><td><div className="language-chips">{(meeting.languages ?? '').split(',').filter(Boolean).map(code => <ScriptText key={code} language={code.trim()}>{i18nText(code.trim()).label}</ScriptText>)}{!meeting.languages && 'Not supplied'}</div></td><td data-label="Speakers">{meeting.speaker_count}</td><td data-label="Length" className="mono">{formatTimecode(meeting.duration_seconds)}</td><td data-label="Date">{utcDate(meeting.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</td></tr>)}</tbody></table>}
    {query && <p className="product-caption">Search covers original transcript text, titles and descriptions. Up to 200 results are returned. Searching translated text is not supported by this service.</p>}
  </div>
}

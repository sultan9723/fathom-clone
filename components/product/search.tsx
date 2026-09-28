'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { findMeetings } from '@/lib/product-api'
import { formatDuration } from '@/lib/utils'
import { useResource } from './use-resource'
import { EmptyState, LoadingState, Notice } from './states'

export function ProductSearch({ query }: { query: string }) {
  const [input, setInput] = useState(query)
  const router = useRouter()
  const result = useResource(signal => query.trim() ? findMeetings(query, signal) : Promise.resolve([]), query)
  return <div className="product-page"><Link href="/meetings" className="product-text-link">← Meetings</Link><header className="product-page-header"><div><h1>Search transcripts</h1><p>Find a moment across the original transcripts in your workspace.</p></div></header><form className="product-search" onSubmit={event => { event.preventDefault(); router.push(`/search?q=${encodeURIComponent(input.trim())}`) }}><Input type="search" aria-label="Search all meetings" value={input} onChange={event => setInput(event.target.value)} placeholder="Search all meetings" /><Button type="submit">Search</Button></form>
    {result.loading ? <LoadingState label="Searching meetings" onCancel={result.cancel} /> : result.error || result.canceled ? <Notice title={result.canceled ? 'Search canceled' : 'Search could not be completed'} warning={!!result.error} onRetry={result.retry}>{result.error}</Notice> : !query.trim() ? <p className="product-caption">Enter a word or phrase to search.</p> : !result.data?.length ? <EmptyState title="No matching meetings">Try a different word or phrase.</EmptyState> : <><p className="product-caption" role="status">{result.data.length} matching meetings · up to 200 results</p><div className="search-results">{result.data.map(meeting => <Link key={meeting.id} className="search-result" href={`/meetings/${encodeURIComponent(meeting.id)}?q=${encodeURIComponent(query)}`}><h2>{meeting.title}</h2>{meeting.description && <p>{meeting.description}</p>}<p>{meeting.speaker_count} speakers · {formatDuration(meeting.duration_seconds)}</p></Link>)}</div></>}
  </div>
}

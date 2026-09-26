/**
 * Client for the NoteAI FastAPI backend. Every page and component that talks
 * to the API goes through here, so the route shapes are defined in exactly
 * one place. Each function maps 1:1 to a backend route in backend/routes/.
 *
 * Base URL comes from NEXT_PUBLIC_API_URL; paths are appended as `/v1/...`,
 * so the value must include the `/api` segment (e.g. http://localhost:8000/api).
 *
 * Errors: these throw plain Errors with generic messages — no backend URL or
 * response body is leaked to the UI. Callers decide how to surface them.
 * The one exception is searchMeetings, which degrades to an empty list.
 */

import type {
  ApiActionItem,
  ApiMeeting,
  ApiTranscript,
  AskResponse,
  TranslateRequest,
  TranslateResponse,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

/** GET /api/v1/meetings — every meeting, newest first. */
export async function getMeetings(): Promise<ApiMeeting[]> {
  const res = await fetch(`${API_URL}/v1/meetings`)
  if (!res.ok) throw new Error('Failed to fetch meetings')
  return res.json()
}

/** GET /api/v1/meetings/{id} — one meeting. Throws if it doesn't exist. */
export async function getMeeting(id: string): Promise<ApiMeeting> {
  const res = await fetch(`${API_URL}/v1/meetings/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('Failed to fetch meeting')
  return res.json()
}

/** GET /api/v1/meetings/{id}/transcripts — ordered by timestamp_seconds. */
export async function getTranscripts(meetingId: string): Promise<ApiTranscript[]> {
  const res = await fetch(`${API_URL}/v1/meetings/${encodeURIComponent(meetingId)}/transcripts`)
  if (!res.ok) throw new Error('Failed to fetch transcripts')
  return res.json()
}

/**
 * GET /api/v1/search?q= — meetings matching the query across titles,
 * descriptions, languages and transcript text. An empty query short-circuits
 * without a request; a failed search returns no results rather than throwing,
 * so a typo in the search box never blanks the page.
 */
export async function searchMeetings(query: string): Promise<ApiMeeting[]> {
  if (!query.trim()) return []
  const res = await fetch(`${API_URL}/v1/search?q=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  return res.json()
}

/**
 * POST /api/v1/ai/ask — ask a question about one meeting. Returns the answer
 * text; the backend answers with HTTP 200 and an explanatory string (e.g.
 * "API key not configured") when no provider is available, so that surfaces
 * as a normal answer rather than an error.
 */
export async function askAI(meetingId: string, question: string): Promise<string> {
  const res = await fetch(`${API_URL}/v1/ai/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meeting_id: meetingId, question }),
  })
  if (!res.ok) throw new Error('Failed to ask AI')
  const data: AskResponse = await res.json()
  return data.response
}

/** GET /api/v1/meetings/{id}/action-items — oldest first. */
export async function getActionItems(meetingId: string): Promise<ApiActionItem[]> {
  const res = await fetch(`${API_URL}/v1/meetings/${encodeURIComponent(meetingId)}/action-items`)
  if (!res.ok) throw new Error('Failed to fetch action items')
  return res.json()
}

/** PATCH /api/v1/meetings/{id}/action-items/{itemId} — toggle completion. */
export async function updateActionItem(
  meetingId: string,
  itemId: string,
  completed: boolean,
): Promise<ApiActionItem> {
  const res = await fetch(
    `${API_URL}/v1/meetings/${encodeURIComponent(meetingId)}/action-items/${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    },
  )
  if (!res.ok) throw new Error('Failed to update action item')
  return res.json()
}

/**
 * POST /api/v1/ai/translate — translate a block of text between languages.
 * Like askAI, an unconfigured or failing provider comes back as HTTP 200 with
 * the notice in `translated`, so only transport failures throw here.
 */
export async function translateText(request: TranslateRequest): Promise<TranslateResponse> {
  const res = await fetch(`${API_URL}/v1/ai/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error('Failed to translate text')
  return res.json()
}

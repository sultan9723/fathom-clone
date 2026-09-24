/**
 * Shared client for POST /api/ask. Both the per-call Ask tab
 * (components/meeting-detail/ask-panel.tsx) and the list-page Ask sidebar
 * (components/meeting-list/ask-sidebar.tsx) hit the same meeting-scoped
 * endpoint with the same request/response shape — this is the one place
 * that shape is defined, so the two surfaces can't drift apart.
 */

export interface AskAnswer {
  answer: string
  citations: number[]
  provider: 'claude' | 'openai' | 'gemini' | 'mock'
  notice?: string
}

export class AskError extends Error {}

export async function askMeeting(meetingId: string, question: string): Promise<AskAnswer> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meetingId, question }),
  })
  const data = await res.json()
  if (!res.ok) throw new AskError(data.error ?? 'Request failed.')
  return data as AskAnswer
}

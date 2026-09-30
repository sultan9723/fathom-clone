import type { ApiActionItem, ApiMeeting, ApiTranscript } from './types'
import { apiPath } from './api-base'

export class ProductApiError extends Error {
  constructor(message: string, readonly status = 0) { super(message); this.name = 'ProductApiError' }
}

/** Existing FastAPI endpoints only. No fallback to the legacy seed-data API. */
export async function productRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  if (options.signal?.aborted) controller.abort()
  options.signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => { timedOut = true; controller.abort() }, path.includes('/ai/') || path.includes('/translations') ? 90000 : 20000)
  try {
    const response = await fetch(apiPath(`/v1${path}`), {
      ...options, signal: controller.signal, cache: 'no-store',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    })
    if (!response.ok) {
      const message = response.status === 404 ? 'This item is not available. It may have been removed.'
        : response.status === 503 ? 'This service is not available right now.'
          : response.status === 422 ? 'Check the information and try again.'
            : 'The request could not be completed. Please try again.'
      throw new ProductApiError(message, response.status)
    }
    if (response.status === 204) return undefined as T
    return await response.json() as T
  } catch (error) {
    if (timedOut) throw new ProductApiError('The request took too long. Please try again.')
    if (controller.signal.aborted) throw new DOMException('Request canceled', 'AbortError')
    if (error instanceof ProductApiError) throw error
    throw new ProductApiError('We could not connect. Check your connection and try again.')
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abort)
  }
}

const meetingPath = (id: string) => `/meetings/${encodeURIComponent(id)}`

export async function listMeetings(signal?: AbortSignal): Promise<ApiMeeting[]> {
  const all: ApiMeeting[] = []
  for (let offset = 0; offset < 10000; offset += 500) {
    const page = await productRequest<ApiMeeting[]>(`/meetings?limit=500&offset=${offset}`, { signal })
    all.push(...page)
    if (page.length < 500) return all
  }
  throw new ProductApiError('This library is too large to load at once. Please use search.')
}

export const findMeetings = (query: string, signal?: AbortSignal) => productRequest<ApiMeeting[]>(`/search?q=${encodeURIComponent(query.trim())}&limit=200`, { signal })
export const readMeeting = (id: string, signal?: AbortSignal) => productRequest<ApiMeeting>(meetingPath(id), { signal })
export const readTranscript = (id: string, signal?: AbortSignal) => productRequest<ApiTranscript[]>(`${meetingPath(id)}/transcripts`, { signal })
export const readActions = (id: string, signal?: AbortSignal) => productRequest<ApiActionItem[]>(`${meetingPath(id)}/action-items`, { signal })
export const saveAction = (meetingId: string, id: string, completed: boolean) => productRequest<ApiActionItem>(`${meetingPath(meetingId)}/action-items/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ completed }) })
export const addAction = (meetingId: string, action: { title: string; assigned_to: string | null; due_date: string | null }) => productRequest<ApiActionItem>(`${meetingPath(meetingId)}/action-items`, { method: 'POST', body: JSON.stringify(action) })
export const createMeeting = (meeting: { title: string; description: string; languages: string; speaker_count: number; duration_seconds: number }) => productRequest<ApiMeeting>('/meetings', { method: 'POST', body: JSON.stringify(meeting) })
export const editMeeting = (id: string, changes: { title: string; description: string }) => productRequest<ApiMeeting>(meetingPath(id), { method: 'PUT', body: JSON.stringify(changes) })
export const removeMeeting = (id: string) => productRequest<void>(meetingPath(id), { method: 'DELETE' })
export const addTranscript = (id: string, line: { text: string; timestamp_seconds: number; speaker_name: string; original_language: string }) => productRequest<ApiTranscript>(`${meetingPath(id)}/transcripts`, { method: 'POST', body: JSON.stringify(line) })

export async function askMeeting(id: string, question: string, signal?: AbortSignal): Promise<string> {
  const result = await productRequest<{ response: string }>('/ai/ask', { method: 'POST', body: JSON.stringify({ meeting_id: id, question }), signal })
  if (!result.response?.trim() || result.response === 'API key not configured' || result.response.startsWith('AI unavailable:')) {
    throw new ProductApiError('The meeting assistant is unavailable. Your transcript and saved action items are still available.')
  }
  return result.response
}

export async function translateContent(text: string, source: string, target: string, signal?: AbortSignal): Promise<string> {
  if (!text.trim() || source === target) return text
  // The existing endpoint truncates at 20,000 characters. Do not silently lose notes.
  if (text.length > 20000) throw new ProductApiError('This text is too long to translate in one request. Showing the original.')
  const result = await productRequest<{ translated: string }>('/ai/translate', { method: 'POST', body: JSON.stringify({ text, source_lang: source, target_lang: target }), signal })
  if (!result.translated?.trim() || /^Translation (?:not configured|unavailable)/i.test(result.translated)) throw new ProductApiError('Translation is unavailable. Showing the original for now.')
  return result.translated
}

export async function translateTranscript(id: string, lang: string, lines: ApiTranscript[], signal?: AbortSignal): Promise<Record<string, string>> {
  const result = await productRequest<{ lines: { line_id: string; text: string }[] }>(`${meetingPath(id)}/translations?lang=${encodeURIComponent(lang)}`, { method: 'POST', signal })
  const translated = Object.fromEntries(result.lines.map(line => [line.line_id, line.text]))
  if (lines.some(line => !translated[line.id]?.trim())) throw new ProductApiError('Some lines could not be translated. Showing the original for now.')
  return translated
}

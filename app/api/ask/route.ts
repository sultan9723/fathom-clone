import { NextResponse } from 'next/server'
import { getMeetingRepository } from '@/lib/repository'
import { getAIProvider, MockProvider } from '@/lib/ai/provider'

export const runtime = 'nodejs'

const MAX_QUESTION_LENGTH = 500

/**
 * Q&A over a single meeting's transcript.
 *
 * The API key never leaves the server: the client posts a meeting id and a
 * question, and this route loads the transcript itself rather than trusting
 * anything the browser sends about the meeting's contents.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 })
  }

  const { meetingId, question } = (body ?? {}) as {
    meetingId?: unknown
    question?: unknown
  }

  if (typeof meetingId !== 'string' || !meetingId) {
    return NextResponse.json({ error: 'meetingId is required.' }, { status: 400 })
  }
  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'question is required.' }, { status: 400 })
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Question must be ${MAX_QUESTION_LENGTH} characters or fewer.` },
      { status: 400 }
    )
  }

  const meeting = await getMeetingRepository().getById(meetingId)
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 })
  }

  const provider = getAIProvider()

  try {
    const result = await provider.ask({ question: question.trim(), meeting })
    return NextResponse.json(result)
  } catch (error) {
    console.error(`[ask] ${provider.name} provider failed:`, error)

    // Graceful degradation: a provider outage or a bad key falls back to
    // transcript retrieval rather than showing the user an error.
    if (provider.name !== 'mock') {
      try {
        const fallback = await new MockProvider().ask({
          question: question.trim(),
          meeting,
        })
        return NextResponse.json({
          ...fallback,
          notice: 'The AI provider was unavailable, so these are raw transcript matches.',
        })
      } catch {
        // fall through
      }
    }

    return NextResponse.json(
      { error: 'Could not answer that question right now.' },
      { status: 502 }
    )
  }
}

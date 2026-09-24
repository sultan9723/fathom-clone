import Anthropic from '@anthropic-ai/sdk'
import type { Meeting, TranscriptLine } from '../types'
import { TranscriptIndex } from '../transcript'

interface TranscriptLineWithSpeaker {
  line: TranscriptLine
  speakerName: string
}

export interface AskRequest {
  question: string
  meeting: Meeting
}

export interface AskResponse {
  answer: string
  /** Transcript seconds the answer draws on, so the UI can offer jump links. */
  citations: number[]
  /** Which provider actually answered — surfaced in the UI, never guessed at. */
  provider: 'claude' | 'openai' | 'gemini' | 'mock'
}

export interface AIProvider {
  readonly name: AskResponse['provider']
  ask(request: AskRequest): Promise<AskResponse>
}

const SYSTEM_PROMPT = `You answer questions about a recorded meeting using only the transcript excerpts provided.

Rules:
- Answer only from the excerpts. If they do not contain the answer, say so plainly rather than guessing.
- Be concise: two or three sentences unless the question genuinely needs more.
- Name the speaker when it matters ("Marcus argued that...").
- Cite timestamps inline in [m:ss] form, taken verbatim from the excerpts.
- Do not invent quotes, names, numbers or timestamps.`

function buildUserPrompt(meeting: Meeting, question: string, context: string): string {
  return `Meeting: ${meeting.title}
Date: ${meeting.date}
Participants: ${meeting.participants.map((p) => p.name).join(', ')}

Transcript excerpts:
${context}

Question: ${question}`
}

/** Pulls [m:ss] timestamps out of an answer so the UI can render seek links. */
function extractCitations(answer: string, maxSeconds: number): number[] {
  const found = new Set<number>()
  for (const match of answer.matchAll(/\[(\d+):([0-5]\d)\]/g)) {
    const seconds = Number(match[1]) * 60 + Number(match[2])
    if (seconds >= 0 && seconds <= maxSeconds) found.add(seconds)
  }
  return [...found].sort((a, b) => a - b)
}

/**
 * Retrieval is shared by every provider: send the model the lines that bear on
 * the question rather than the entire transcript.
 */
function contextFor(meeting: Meeting, question: string): string {
  const index = new TranscriptIndex(meeting)
  const focused = index.buildContext(question, { limit: 10, neighbours: 1 })
  // A question whose terms match nothing ("what was this about?") still
  // deserves an answer, so fall back to the whole transcript.
  return focused || index.fullText()
}

/**
 * Answers without an API key by quoting the transcript directly.
 *
 * This is not a stub that throws — it is the reason the feature degrades
 * gracefully. With no key configured the panel still returns the relevant
 * moments with working timestamps; it just does not paraphrase them.
 */
export class MockProvider implements AIProvider {
  readonly name = 'mock' as const

  /** Below this, a line is an interjection rather than an answer. */
  private static readonly SUBSTANTIVE_CHARS = 90
  /** How far to follow a short line forward looking for the substance. */
  private static readonly MAX_HOPS = 2

  async ask({ question, meeting }: AskRequest): Promise<AskResponse> {
    const index = new TranscriptIndex(meeting)
    const hits = index.search(question, 3)

    // Questions like "what was decided?" name no term that appears in the
    // dialogue, but the seed data already carries a precomputed answer.
    if (hits.length === 0) {
      return this.answerFromSummary(meeting)
    }

    const cited = new Set<number>()
    const shown = new Set<string>()
    const quotes: string[] = []

    for (const hit of hits) {
      const chain: TranscriptLineWithSpeaker[] = []

      // Walk forward from the hit until the substance appears. A short line
      // is usually a question whose answer is in the next turn, and that
      // turn often shares no vocabulary with the query.
      let current: typeof hit.line | undefined = hit.line
      let speaker = hit.speaker
      for (let hop = 0; current && hop <= MockProvider.MAX_HOPS; hop++) {
        if (!shown.has(current.id)) {
          shown.add(current.id)
          cited.add(current.start)
          chain.push({ line: current, speakerName: speaker?.name ?? 'Unknown' })
        }
        if (current.text.length >= MockProvider.SUBSTANTIVE_CHARS) break
        const next: typeof hit.line | undefined = index.lineAfter(current)
        if (!next || shown.has(next.id)) break
        current = next
        speaker = index.speakerOf(next)
      }

      if (chain.length === 0) continue
      quotes.push(
        chain
          .map(
            (entry, i) =>
              `${i === 0 ? '- ' : '  ↳ '}${entry.speakerName} at [${formatStamp(entry.line.start)}]: “${truncate(entry.line.text, 220)}”`
          )
          .join('\n')
      )
    }

    if (quotes.length === 0) return this.answerFromSummary(meeting)

    return {
      answer: `No AI provider is configured, so here are the most relevant moments from the transcript:\n\n${quotes.join('\n')}`,
      citations: [...cited].sort((a, b) => a - b),
      provider: this.name,
    }
  }

  /** Falls back to the precomputed summary when retrieval finds nothing. */
  private answerFromSummary(meeting: Meeting): AskResponse {
    const parts = [
      'No AI provider is configured and nothing in the transcript matches those words directly, so here is the meeting summary:',
      '',
      meeting.summary.overview,
    ]

    if (meeting.summary.decisions?.length) {
      parts.push('', 'Decisions:', ...meeting.summary.decisions.map((d) => `- ${d}`))
    } else if (meeting.summary.keyPoints.length) {
      parts.push('', 'Key points:', ...meeting.summary.keyPoints.map((k) => `- ${k}`))
    }

    return { answer: parts.join('\n'), citations: [], provider: this.name }
  }
}

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude' as const
  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async ask({ question, meeting }: AskRequest): Promise<AskResponse> {
    const response = await this.client.beta.messages.create({
      model: 'claude-opus-5',
      // Answers are deliberately short; this is a cap, not a target.
      max_tokens: 1024,
      // Extractive Q&A over a handful of lines does not repay deep reasoning,
      // and this route is latency-sensitive.
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(meeting, question, contextFor(meeting, question)),
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      throw new Error('The model declined to answer this question.')
    }

    const answer = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    return {
      answer: answer || 'The model returned an empty response.',
      citations: extractCitations(answer, meeting.durationSec),
      provider: this.name,
    }
  }
}

/**
 * Uses raw fetch rather than pulling in a second vendor SDK — this is the
 * secondary path and the request shape is small enough not to warrant it.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const

  constructor(private readonly apiKey: string) {}

  async ask({ question, meeting }: AskRequest): Promise<AskResponse> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildUserPrompt(meeting, question, contextFor(meeting, question)),
          },
        ],
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI request failed with ${res.status}`)
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const answer = data.choices?.[0]?.message?.content?.trim() ?? ''

    return {
      answer: answer || 'The model returned an empty response.',
      citations: extractCitations(answer, meeting.durationSec),
      provider: this.name,
    }
  }
}

/**
 * Uses raw fetch, same as OpenAIProvider — no official Gemini SDK dependency
 * for one endpoint.
 */
export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const

  constructor(private readonly apiKey: string) {}

  async ask({ question, meeting }: AskRequest): Promise<AskResponse> {
    const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(meeting, question, contextFor(meeting, question))}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )

    if (!res.ok) {
      throw new Error(`Gemini request failed with ${res.status}`)
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

    return {
      answer: answer || 'The model returned an empty response.',
      citations: extractCitations(answer, meeting.durationSec),
      provider: this.name,
    }
  }
}

/**
 * Picks a provider from `AI_PROVIDER`, falling back to the mock whenever the
 * chosen provider has no key. Requesting a provider whose key is missing is a
 * misconfiguration worth a server log, but it must not break the page.
 */
export function getAIProvider(): AIProvider {
  const choice = (process.env.AI_PROVIDER ?? 'mock').toLowerCase()

  if (choice === 'claude' || choice === 'anthropic') {
    const key = process.env.ANTHROPIC_API_KEY
    if (key) return new ClaudeProvider(key)
    console.warn('AI_PROVIDER=claude but ANTHROPIC_API_KEY is unset; using MockProvider.')
  }

  if (choice === 'openai') {
    const key = process.env.OPENAI_API_KEY
    if (key) return new OpenAIProvider(key)
    console.warn('AI_PROVIDER=openai but OPENAI_API_KEY is unset; using MockProvider.')
  }

  if (choice === 'gemini') {
    const key = process.env.GEMINI_API_KEY
    if (key) return new GeminiProvider(key)
    console.warn('AI_PROVIDER=gemini but GEMINI_API_KEY is unset; using MockProvider.')
  }

  return new MockProvider()
}

function formatStamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

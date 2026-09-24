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
  citations: number[]
  provider: 'claude' | 'openai' | 'gemini' | 'groq' | 'mock'
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

function extractCitations(answer: string, maxSeconds: number): number[] {
  const found = new Set<number>()
  for (const match of answer.matchAll(/\[(\d+):([0-5]\d)\]/g)) {
    const seconds = Number(match[1]) * 60 + Number(match[2])
    if (seconds >= 0 && seconds <= maxSeconds) found.add(seconds)
  }
  return [...found].sort((a, b) => a - b)
}

function contextFor(meeting: Meeting, question: string): string {
  const index = new TranscriptIndex(meeting)
  const focused = index.buildContext(question, { limit: 10, neighbours: 1 })
  return focused || index.fullText()
}

export class MockProvider implements AIProvider {
  readonly name = 'mock' as const
  private static readonly SUBSTANTIVE_CHARS = 90
  private static readonly MAX_HOPS = 2

  async ask({ question, meeting }: AskRequest): Promise<AskResponse> {
    const index = new TranscriptIndex(meeting)
    const hits = index.search(question, 3)

    if (hits.length === 0) {
      return this.answerFromSummary(meeting)
    }

    const cited = new Set<number>()
    const shown = new Set<string>()
    const quotes: string[] = []

    for (const hit of hits) {
      const chain: TranscriptLineWithSpeaker[] = []

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
              `${i === 0 ? '- ' : '  ↳ '}${entry.speakerName} at [${formatStamp(entry.line.start)}]: "${truncate(entry.line.text, 220)}"`
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
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(meeting, question, contextFor(meeting, question)),
        },
      ],
    })

    const answer = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
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
      const errText = await res.text()
      console.error('[openai] error response:', errText)
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

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const

  constructor(private readonly apiKey: string) {}

  async ask({ question, meeting }: AskRequest): Promise<AskResponse> {
    const prompt = `${SYSTEM_PROMPT}\n\n${buildUserPrompt(meeting, question, contextFor(meeting, question))}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[gemini] error response:', errText)
      throw new Error(`Gemini request failed with ${res.status}: ${errText}`)
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

export class GroqProvider implements AIProvider {
  readonly name = 'groq' as const

  constructor(private readonly apiKey: string) {}

  async ask({ question, meeting }: AskRequest): Promise<AskResponse> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.7,
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
      const errText = await res.text()
      console.error('[groq] error:', errText)
      throw new Error(`Groq request failed with ${res.status}`)
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

  if (choice === 'groq') {
    const key = process.env.GROQ_API_KEY
    if (key) return new GroqProvider(key)
    console.warn('AI_PROVIDER=groq but GROQ_API_KEY is unset; using MockProvider.')
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

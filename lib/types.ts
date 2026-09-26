export interface Participant {
  id: string
  name: string
  email?: string
  color: string
  avatarUrl?: string
}

export interface TranscriptLine {
  id: string
  speakerId: string
  start: number
  end: number
  text: string
}

export interface ActionItem {
  id: string
  text: string
  assigneeId?: string
  timestamp?: number
  done: boolean
}

export interface Highlight {
  id: string
  title: string
  start: number
  end: number
}

export interface Meeting {
  id: string
  title: string
  date: string
  durationSec: number
  videoUrl: string
  thumbnailUrl?: string
  platform: 'zoom' | 'meet' | 'teams'
  participants: Participant[]
  transcript: TranscriptLine[]
  summary: {
    overview: string
    keyPoints: string[]
    decisions?: string[]
  }
  actionItems: ActionItem[]
  highlights: Highlight[]
}

// ── NoteAI backend API (FastAPI, /api/v1) ───────────────────────────────
// Wire shapes from backend/schemas.py. snake_case is intentional: these
// mirror the JSON exactly. The Fathom types above are unrelated.

export interface ApiMeeting {
  id: string
  title: string
  description: string | null
  languages: string | null // comma-separated, e.g. "en,es,fr"
  speaker_count: number
  duration_seconds: number
  created_at: string // ISO 8601
}

export interface ApiTranscript {
  id: string
  meeting_id: string
  text: string
  timestamp_seconds: number
  speaker_name: string | null
  original_language: string | null // e.g. "en"
  created_at: string
}

export interface ApiActionItem {
  id: string
  meeting_id: string
  title: string
  assigned_to: string | null
  due_date: string | null // ISO date, e.g. "2026-10-01"
  completed: boolean
  created_at: string
}

export interface SearchResult {
  meetings: ApiMeeting[]
  count: number
}

export interface AskRequest {
  meeting_id: string
  question: string
}

export interface AskResponse {
  response: string
}

export interface TranslateRequest {
  text: string
  source_lang: string
  target_lang: string
}

export interface TranslateResponse {
  original: string
  translated: string
  source_lang: string
  target_lang: string
}

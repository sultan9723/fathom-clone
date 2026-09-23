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

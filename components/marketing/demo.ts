import type { LanguageCode } from '@/lib/i18n-text'

// Marketing-only reference example. English: PDF pages 6–7; Urdu support
// sentence: page 4; Urdu answer: page 7. Other translations illustrate the
// same dialogue. This is never used as application/database content.
export const atlas = {
  title: 'Product Atlas Kickoff',
  participants: ['Ming', 'Ayesha', 'Daniel'],
  lines: [
    { time: '12:01', speaker: 'Ming', text: 'We launch Atlas in three regions on the same day.' },
    { time: '12:04', speaker: 'Ayesha', text: 'Support has to answer in every local language.' },
    { time: '12:09', speaker: 'Daniel', text: 'Let NoteAI draft the FAQ in all three.' },
    { time: '12:15', speaker: 'Ming', text: 'Agreed. Ayesha reviews it before Friday.' },
    { time: '12:21', speaker: 'Ayesha', text: 'I’ll share the draft in the channel by Thursday.' },
  ],
  translations: [
    { code: 'ur' as const, sourceIndex: 1, text: 'سپورٹ کو ہر مقامی زبان میں جواب دینا ہوگا۔' },
    { code: 'zh' as const, sourceIndex: 0, text: '我们将在同一天在三个地区推出 Atlas。' },
    { code: 'es' as const, sourceIndex: 2, text: 'Dejemos que NoteAI redacte las preguntas frecuentes en los tres idiomas.' },
  ],
  sharedLine: {
    en: 'Support has to answer in every local language.',
    ur: 'سپورٹ کو ہر مقامی زبان میں جواب دینا ہوگا۔',
    zh: '支持团队必须使用每一种当地语言作答。',
  },
  insights: [
    { kind: 'Decision', source: 0, text: 'Launch Atlas in three regions on the same day.' },
    { kind: 'Action item', source: 2, text: 'Daniel · Draft the FAQ in three languages.' },
    { kind: 'Action item', source: 3, text: 'Ayesha · Review the FAQ before Friday.' },
    { kind: 'Action item', source: 4, text: 'Ayesha · Share the draft by Thursday.' },
  ],
  question: 'Who reviews the FAQ?',
  answer: 'Ayesha reviews it before Friday.',
  answerUrdu: 'عائشہ، جمعے سے پہلے۔',
}

export const languages: { code: LanguageCode; notes: string }[] = [
  { code: 'en', notes: 'Meeting notes' },
  { code: 'ur', notes: 'میٹنگ نوٹس' },
  { code: 'zh', notes: '会议记录' },
  { code: 'es', notes: 'Notas de la reunión' },
  { code: 'ar', notes: 'ملاحظات الاجتماع' },
  { code: 'fr', notes: 'Notes de réunion' },
  { code: 'de', notes: 'Besprechungsnotizen' },
  { code: 'ja', notes: '会議メモ' },
]

export const platforms = [
  { name: 'Zoom', url: 'https://zoom.us/j/82461390571' },
  { name: 'Google Meet', url: 'https://meet.google.com/atlas-team' },
  { name: 'Microsoft Teams', url: 'https://teams.microsoft.com/l/meetup-join/atlas' },
] as const

export function detectPlatform(value: string): string | null {
  try {
    const host = new URL(value).hostname
    if (host === 'zoom.us' || host.endsWith('.zoom.us')) return 'Zoom'
    if (host === 'meet.google.com') return 'Google Meet'
    if (host === 'teams.microsoft.com') return 'Microsoft Teams'
  } catch { /* Incomplete demo links have not been detected yet. */ }
  return null
}

export const steps = [
  { title: 'Connect', description: 'One meeting link. Everyone in the conversation.' },
  { title: 'Listen', description: 'Follow every word, with a name and a timestamp.' },
  { title: 'Translate', description: 'Read in your language. Keep the original close.' },
  { title: 'Understand', description: 'Decisions and next steps, connected to what was said.' },
  { title: 'Ask', description: 'Ask in your language. Go straight to the source.' },
] as const

export function storyPosition(top: number, height: number, viewport: number) {
  const progress = Math.max(0, Math.min(1, -top / Math.max(1, height - viewport)))
  const position = progress * steps.length
  return { step: Math.min(steps.length - 1, Math.floor(position)), position }
}

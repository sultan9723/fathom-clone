import type { LanguageCode } from '@/lib/i18n-text'

// Marketing-only copy. English comes from backend/seed.py, Product Atlas Kickoff.
// Translations are provisional until the reference canvas is supplied.
// Do not reuse this fixture as application data.
export const atlas = {
  title: 'Product Atlas Kickoff',
  participants: ['Sofia', 'Ben', 'Nina'],
  lines: [
    { time: '00:35', speaker: 'Ben', text: 'Phase one is read-only maps with live location markers, no editing yet.' },
    { time: '02:40', speaker: 'Ben', text: 'If scope stays fixed, we can target a six-week build.' },
    { time: '03:10', speaker: 'Nina', text: "I'll have mockups ready for review by end of next week." },
  ],
  translations: [
    { code: 'ur' as const, text: 'پہلے مرحلے میں صرف دیکھنے کے لیے نقشے ہوں گے جن پر براہِ راست مقام کے نشانات ہوں گے، ابھی ترمیم نہیں ہوگی.' },
    { code: 'zh' as const, text: '如果范围保持不变，我们可以争取在六周内完成开发。' },
    { code: 'es' as const, text: 'Tendré las maquetas listas para revisar a finales de la próxima semana.' },
  ],
  sharedLine: {
    en: 'If scope stays fixed, we can target a six-week build.',
    ur: 'اگر دائرۂ کار میں تبدیلی نہ ہو تو ہم چھ ہفتوں میں کام مکمل کرنے کا ہدف رکھ سکتے ہیں۔',
    zh: '如果范围保持不变，我们可以争取在六周内完成开发。',
  },
  question: 'When can we launch phase one?',
  answer: 'Ben estimates a six-week build, provided the scope stays fixed.',
  answerUrdu: 'بین کے اندازے کے مطابق، اگر دائرۂ کار میں تبدیلی نہ ہو تو کام چھ ہفتوں میں مکمل ہو سکتا ہے۔',
}

export const languages: { code: LanguageCode; notes: string }[] = [
  { code: 'en', notes: 'Meeting notes' },
  { code: 'ur', notes: 'اجلاس کے نوٹس' },
  { code: 'zh', notes: '会议笔记' },
  { code: 'es', notes: 'Notas de la reunión' },
  { code: 'ar', notes: 'ملاحظات الاجتماع' },
  { code: 'fr', notes: 'Notes de réunion' },
  { code: 'de', notes: 'Besprechungsnotizen' },
  { code: 'ja', notes: '会議のメモ' },
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

'use client'

import { translateContent } from '@/lib/product-api'
import { useReadingLanguage, ScriptText } from './preferences'
import { useResource } from './use-resource'
import { Button } from '@/components/ui'

/** Original remains readable during translation, cancellation or provider failure. */
export function TranslatedText({ text, source = 'en', className = '' }: { text: string; source?: string; className?: string }) {
  const { language } = useReadingLanguage()
  const needed = !!text.trim() && source !== language
  const translation = useResource(signal => needed ? translateContent(text, source, language, signal) : Promise.resolve(text), `${source}:${language}:${text}`)
  const translated = needed && translation.data && !translation.error && !translation.canceled
  return <div className={className}>
    <ScriptText language={translated ? language : source}>{translated ? translation.data : text}</ScriptText>
    {translated && <span className="original-text"><ScriptText language={source}>{text}</ScriptText></span>}
    {needed && translation.loading && <div className="product-caption" role="status">Translating… Original remains available until ready. <Button onClick={translation.cancel}>Cancel</Button></div>}
    {needed && (translation.error || translation.canceled) && <div className="product-caption" role="status">Showing the original for now. {translation.canceled ? 'Translation canceled.' : 'Translation is unavailable.'} <Button onClick={translation.retry}>Retry translation</Button></div>}
  </div>
}

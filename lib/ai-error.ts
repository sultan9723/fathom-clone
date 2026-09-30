/** Only known status information reaches the UI, never provider diagnostics. */
export async function aiErrorMessage(response: Response): Promise<string> {
  if (response.status === 429) return 'Too many AI requests. Please wait a moment and try again.'
  if (response.status === 503) {
    const body = await response.json().catch(() => null)
    if (typeof body?.detail === 'string' && body.detail.includes('daily limit for AI requests')) {
      return 'The daily AI limit has been reached. Translations, summaries, and answers will be available again tomorrow.'
    }
    return 'The assistant is temporarily unavailable. Please try again later.'
  }
  return 'The assistant could not complete that request. Please try again.'
}

export interface RecordingEmbed {
  provider: 'YouTube' | 'Vimeo'
  src: string
  url: string
}

/** Only public recordings on known providers may become an iframe source. */
export function getRecordingEmbed(value?: string | null): RecordingEmbed | null {
  if (!value) return null

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null

  const host = url.hostname.toLowerCase()
  let youtubeId: string | null = null
  if (host === 'youtu.be') {
    youtubeId = /^\/([\w-]{11})\/?$/.exec(url.pathname)?.[1] ?? null
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
    youtubeId = url.pathname === '/watch'
      ? url.searchParams.get('v')
      : /^\/(?:embed|shorts|live)\/([\w-]{11})\/?$/.exec(url.pathname)?.[1] ?? null
  } else if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    youtubeId = /^\/embed\/([\w-]{11})\/?$/.exec(url.pathname)?.[1] ?? null
  }

  if (youtubeId && /^[\w-]{11}$/.test(youtubeId)) {
    return {
      provider: 'YouTube',
      src: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
    }
  }

  const vimeoId = ['vimeo.com', 'www.vimeo.com'].includes(host)
    ? /^\/([1-9]\d*)\/?$/.exec(url.pathname)?.[1]
    : host === 'player.vimeo.com'
      ? /^\/video\/([1-9]\d*)\/?$/.exec(url.pathname)?.[1]
      : undefined
  if (vimeoId) {
    return {
      provider: 'Vimeo',
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&dnt=1`,
      url: `https://vimeo.com/${vimeoId}`,
    }
  }
  return null
}

import { describe, expect, it } from 'vitest'
import { getRecordingEmbed } from '../app/components/meeting-detail/recording-embed'

describe('recording embeds', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?t=42',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=ignored',
    'https://youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  ])('canonicalizes a public YouTube URL: %s', (url) => {
    expect(getRecordingEmbed(url)).toEqual({
      provider: 'YouTube',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
  })

  it.each(['https://vimeo.com/123456789', 'https://player.vimeo.com/video/123456789?autoplay=0'])('canonicalizes a public Vimeo URL: %s', (url) => {
    expect(getRecordingEmbed(url)).toEqual({
      provider: 'Vimeo',
      src: 'https://player.vimeo.com/video/123456789?autoplay=1&dnt=1',
      url: 'https://vimeo.com/123456789',
    })
  })

  it.each([
    undefined, null, '', 'fake-recording-url',
    'javascript:alert(1)',
    'http://youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://youtube.com@evil.example/watch?v=dQw4w9WgXcQ',
    'https://user:password@youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com:8443/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=invalid',
    'https://youtube.com/watch?v=dQw4w9WgXcQ%22%3E',
    'https://youtu.be/dQw4w9WgXcQ/extra',
    'https://vimeo.com/recording',
    'https://vimeo.com/0',
    'https://player.vimeo.com/123456789',
    'https://example.com/recording.mp4',
  ])('keeps invalid and unsupported URLs in the offline demo: %s', (url) => {
    expect(getRecordingEmbed(url)).toBeNull()
  })
})

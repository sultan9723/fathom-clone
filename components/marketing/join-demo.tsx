'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { duration, useReducedMotion } from '@/lib/motion'
import { detectPlatform, platforms } from './demo'

export function JoinDemo() {
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const node = root.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (reduced || paused || !running) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setTick(value => value + 1)
    }, duration.fast / 2)
    return () => window.clearInterval(timer)
  }, [reduced, paused, running])

  const platform = platforms[Math.floor(tick / 100) % platforms.length]
  const phase = reduced ? 99 : tick % 100
  const url = platform.url.slice(0, Math.ceil(phase / 40 * platform.url.length))
  const detected = phase >= 40 ? detectPlatform(url) : null
  const state = phase < 48 ? 'Join' : phase < 65 ? 'Joining…' : 'Joined · Listening'
  return (
    <div ref={root} className="join-demo">
      <div className="join-demo-bar" aria-hidden="true">
        <span className="join-demo-url">{url || 'Paste a meeting link'}{phase < 40 && <span className="typing-caret">|</span>}</span>
        <Badge>{detected || 'Meeting link'}</Badge>
        {/* Once joined this is a status, not an action, so it becomes the live
            badge rather than a third button variant. */}
        {phase >= 65 ? (
          <Badge variant="live" className="join-demo-state">{state}</Badge>
        ) : (
          <Button tabIndex={-1} variant="primary" className="join-demo-state">{state}</Button>
        )}
      </div>
      <div className="demo-caption">
        <span>Demo · A link is all it takes.</span>
        <span className="sr-only">Paste a Zoom, Google Meet, or Microsoft Teams link. NoteAI joins and listens.</span>
        {!reduced && <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? 'Play demo' : 'Pause demo'}</button>}
      </div>
    </div>
  )
}

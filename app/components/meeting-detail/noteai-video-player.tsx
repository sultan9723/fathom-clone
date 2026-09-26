'use client'

import { useEffect, useState } from 'react'
import { LockKeyhole, Pause, Play, RotateCcw } from 'lucide-react'
import { usePlayer } from '@/components/meeting-detail/player-provider'
import { formatTimecode } from '@/lib/utils'
import { getRecordingEmbed } from './recording-embed'

export function NoteAiVideoPlayer({ videoUrl }: { videoUrl?: string | null }) {
  const { currentTime, duration, seek } = usePlayer()
  const [demoPlaying, setDemoPlaying] = useState(false)
  const [activeEmbed, setActiveEmbed] = useState<string | null>(null)
  const recording = getRecordingEmbed(videoUrl)
  const embedded = !!recording && activeEmbed === recording.src
  const length = Number.isFinite(duration) ? Math.max(0, duration) : 0

  // There is no recording behind the demo. Advance the shared meeting clock
  // so transcript clicks, scrolling and the seek slider always agree.
  useEffect(() => {
    if (!demoPlaying || recording || length === 0) return
    if (currentTime >= length) {
      setDemoPlaying(false)
      return
    }
    const started = performance.now()
    const timer = window.setTimeout(() => {
      seek(Math.min(length, currentTime + (performance.now() - started) / 1000))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [demoPlaying, currentTime, length, recording, seek])

  function toggleDemo() {
    if (currentTime >= length) seek(0)
    setDemoPlaying((playing) => !playing)
  }

  const playLabel = demoPlaying ? 'Pause demo playback' : 'Play demo playback'

  return (
    <section aria-label="Meeting recording" className="overflow-hidden rounded-lg border border-line bg-black text-white">
      <div className="relative aspect-video w-full">
        {embedded && recording ? (
          <iframe
            src={recording.src}
            title={`${recording.provider} meeting recording`}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <button
              type="button"
              onClick={() => recording ? setActiveEmbed(recording.src) : toggleDemo()}
              disabled={!recording && length === 0}
              aria-label={recording ? `Play recording on ${recording.provider}` : playLabel}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:cursor-not-allowed disabled:opacity-50"
            >
              {demoPlaying && !recording ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
            </button>
            <p className="text-base font-medium">Recording available for premium members</p>
            <p className="text-xs text-white/70">
              {recording ? `Play with ${recording.provider}` : 'Demo player · No recording attached'}
            </p>
          </div>
        )}
      </div>

      {recording ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 px-3 py-3 text-xs text-white/70">
          <span>Embedded playback uses its own timeline.</span>
          <a href={recording.url} target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
            Open on {recording.provider}
          </a>
        </div>
      ) : (
        <div className="space-y-2 border-t border-white/15 p-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleDemo} disabled={length === 0} aria-label={playLabel} className="grid h-9 w-9 shrink-0 place-items-center rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:opacity-50">
              {demoPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
            <input
              type="range"
              min={0}
              max={length}
              step={1}
              value={Math.min(length, Math.max(0, currentTime))}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={length === 0}
              aria-label="Seek demo playback"
              aria-valuetext={`${formatTimecode(currentTime)} of ${formatTimecode(length)}`}
              className="h-9 min-w-0 flex-1 accent-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
            />
            <button type="button" onClick={() => seek(0)} disabled={length === 0} aria-label="Restart demo playback" className="grid h-9 w-9 shrink-0 place-items-center rounded hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:opacity-50">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3 w-3" aria-hidden="true" />Demo timeline</span>
            <span className="font-mono tabular-nums">{formatTimecode(currentTime)} / {formatTimecode(length)}</span>
          </div>
        </div>
      )}
    </section>
  )
}

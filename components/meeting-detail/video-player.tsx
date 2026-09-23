'use client'

import { useCallback, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, RotateCw, Gauge } from 'lucide-react'
import { usePlayer } from './player-provider'
import { cn, formatTimecode } from '@/lib/utils'
import type { Highlight } from '@/lib/types'

const RATES = [0.75, 1, 1.25, 1.5, 2] as const

export function VideoPlayer({
  src,
  poster,
  title,
  highlights = [],
}: {
  src: string
  poster?: string
  title: string
  highlights?: Highlight[]
}) {
  const {
    videoRef,
    currentTime,
    duration,
    isPlaying,
    isReady,
    playbackRate,
    isScaled,
    seek,
    seekBy,
    togglePlay,
    setPlaybackRate,
    handleLoadedMetadata,
  } = usePlayer()

  const trackRef = useRef<HTMLDivElement | null>(null)
  const [scrubTime, setScrubTime] = useState<number | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const displayTime = scrubTime ?? currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  const timeFromEvent = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track) return 0
      const rect = track.getBoundingClientRect()
      const ratio = (clientX - rect.left) / rect.width
      return Math.min(Math.max(ratio, 0), 1) * duration
    },
    [duration]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsScrubbing(true)
      setScrubTime(timeFromEvent(e.clientX))
    },
    [timeFromEvent]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbing) return
      setScrubTime(timeFromEvent(e.clientX))
    },
    [isScrubbing, timeFromEvent]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbing) return
      const target = timeFromEvent(e.clientX)
      e.currentTarget.releasePointerCapture(e.pointerId)
      setIsScrubbing(false)
      setScrubTime(null)
      seek(target)
    },
    [isScrubbing, seek, timeFromEvent]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = e.shiftKey ? 60 : 10
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekBy(-step)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekBy(step)
      } else if (e.key === 'Home') {
        e.preventDefault()
        seek(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        seek(duration)
      }
    },
    [duration, seek, seekBy]
  )

  const cycleRate = useCallback(() => {
    const next = RATES[(RATES.indexOf(playbackRate as (typeof RATES)[number]) + 1) % RATES.length]!
    setPlaybackRate(next)
  }, [playbackRate, setPlaybackRate])

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          title={title}
          playsInline
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="h-full w-full cursor-pointer object-contain"
        />
        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play"
            className="absolute inset-0 grid place-items-center bg-black/20 transition hover:bg-black/30"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 shadow-lg transition group-hover:scale-105">
              <Play className="ml-1 h-7 w-7 text-slate-900" fill="currentColor" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>

      <div className="space-y-3 bg-slate-900 px-4 py-3">
        {/* Scrub track. Highlights are marked so the interesting moments are findable. */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(displayTime)}
          aria-valuetext={`${formatTimecode(displayTime)} of ${formatTimecode(duration)}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          className="group relative h-6 cursor-pointer touch-none select-none rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {highlights.map((h) => (
            <span
              key={h.id}
              title={h.title}
              className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-400/80"
              style={{
                left: `${(h.start / duration) * 100}%`,
                width: `${Math.max(((h.end - h.start) / duration) * 100, 0.6)}%`,
              }}
            />
          ))}

          <span
            className={cn(
              'pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform',
              isScrubbing ? 'scale-125' : 'scale-0 group-hover:scale-100'
            )}
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2 text-slate-200">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekBy(-10)}
            aria-label="Back 10 seconds"
            className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => seekBy(10)}
            aria-label="Forward 10 seconds"
            className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
          </button>

          <span className="ml-1 font-mono text-xs tabular-nums text-slate-300">
            {formatTimecode(displayTime)} / {formatTimecode(duration)}
          </span>

          <button
            type="button"
            onClick={cycleRate}
            aria-label={`Playback speed ${playbackRate}x`}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            {playbackRate}×
          </button>
        </div>

        {isScaled && isReady && (
          <p className="text-[11px] leading-relaxed text-slate-400">
            Demo clip is shorter than the meeting, so playback time is mapped onto the
            full {formatTimecode(duration)} transcript. Seeking and sync work exactly as
            they would against a real recording.
          </p>
        )}
      </div>
    </section>
  )
}

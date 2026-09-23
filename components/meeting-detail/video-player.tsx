'use client'

import { useCallback, useRef, useState } from 'react'
import { Play, Volume2, VolumeX, LayoutGrid } from 'lucide-react'
import { usePlayer } from './player-provider'
import { cn, formatMeetingDate, formatTimecode } from '@/lib/utils'
import type { Highlight } from '@/lib/types'

const RATES = [0.75, 1, 1.25, 1.5, 2] as const

export function VideoPlayer({
  src,
  poster,
  title,
  date,
  highlights = [],
}: {
  src: string
  poster?: string
  title: string
  date: string
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
  const [muted, setMuted] = useState(false)

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

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    setMuted((prev) => {
      const next = !prev
      if (video) video.muted = next
      return next
    })
  }, [videoRef])

  return (
    <section className="mt-4 overflow-hidden rounded-t-lg bg-black">
      <div className="relative aspect-video min-h-video w-full">
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

        <div className="pointer-events-none absolute left-4 top-3">
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="text-xs font-normal text-white/90" suppressHydrationWarning>
            {formatMeetingDate(date)}
          </p>
        </div>

        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play"
            className="absolute inset-0 grid place-items-center bg-black/75"
          >
            <Play className="h-20 w-20 text-white opacity-25" fill="currentColor" aria-hidden="true" />
          </button>
        )}

        {/* Control bar floats over the video, 34px up from the bottom edge. */}
        <div className="absolute inset-x-0 bottom-[34px] flex items-center gap-3 px-4">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="shrink-0 text-white transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {muted ? (
              <VolumeX className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-white">
            {formatTimecode(displayTime)}
          </span>

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
            className="group relative h-[10px] flex-1 cursor-pointer touch-none select-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="absolute inset-x-0 top-1/2 h-full -translate-y-1/2 overflow-hidden rounded-full bg-[rgba(97,97,98,0.75)]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
            </div>

            {highlights.map((h) => (
              <span
                key={h.id}
                title={h.title}
                className="pointer-events-none absolute top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-warning/70"
                style={{
                  left: `${(h.start / duration) * 100}%`,
                  width: `${Math.max(((h.end - h.start) / duration) * 100, 0.6)}%`,
                }}
              />
            ))}

            {/* Playhead: 3x22px vertical bar */}
            <span
              className={cn(
                'pointer-events-none absolute top-1/2 h-[22px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow transition-transform',
                isScrubbing ? 'scale-110' : 'group-hover:scale-105'
              )}
              style={{ left: `${progress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={cycleRate}
            aria-label={`Playback speed ${playbackRate}x`}
            className="shrink-0 text-[13px] font-semibold text-white transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {playbackRate}×
          </button>

          {/* No described function beyond presence — inert. */}
          <span
            aria-hidden="true"
            className="shrink-0 cursor-default text-white/70"
            title="Layout"
          >
            <LayoutGrid className="h-5 w-5" />
          </span>
        </div>
      </div>

      {isScaled && isReady && (
        <p className="bg-black px-4 py-2 text-[11px] leading-relaxed text-fg-3">
          Demo clip is shorter than the meeting, so playback time is mapped onto the
          full {formatTimecode(duration)} transcript. Seeking and sync work exactly as
          they would against a real recording.
        </p>
      )}
    </section>
  )
}

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

/**
 * Everything in the UI speaks *meeting seconds* — transcript lines, action
 * item timestamps, highlights and the ?t= share link all come from the seed
 * data and run to the full length of the meeting.
 *
 * The demo video is a short public sample clip, so media seconds and meeting
 * seconds are not the same thing. This provider owns the mapping between them:
 * once the real media duration is known, meeting time is scaled onto it, and
 * the whole transcript stays in sync with the clip. When the media is at least
 * as long as the meeting — a real recording — the scale is 1 and the mapping
 * disappears entirely.
 *
 * It is also the single source of truth for `currentTime`. No other component
 * keeps its own copy.
 */

export interface PlayerContextValue {
  /** Attach to the <video> element. */
  videoRef: RefObject<HTMLVideoElement | null>
  /** Current position in meeting seconds. */
  currentTime: number
  /** Full meeting length in seconds — the canonical timeline. */
  duration: number
  isPlaying: boolean
  isReady: boolean
  playbackRate: number
  /**
   * True when the media is shorter than the meeting and time is being scaled.
   * The UI surfaces this rather than silently lying about the timeline.
   */
  isScaled: boolean
  seek: (meetingSeconds: number) => void
  seekBy: (deltaSeconds: number) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  setPlaybackRate: (rate: number) => void
  /** Called by <video onLoadedMetadata>. */
  handleLoadedMetadata: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside a <PlayerProvider>')
  return ctx
}

/** `timeupdate` fires irregularly; 250ms keeps the transcript smooth without churning React. */
const UPDATE_INTERVAL_MS = 250

export function PlayerProvider({
  durationSec,
  initialTime = 0,
  children,
}: {
  durationSec: number
  initialTime?: number
  children: ReactNode
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [currentTime, setCurrentTime] = useState(() => clamp(initialTime, 0, durationSec))
  const [isPlaying, setIsPlaying] = useState(false)
  const [mediaDuration, setMediaDuration] = useState(0)
  const [playbackRate, setRate] = useState(1)
  const lastUpdate = useRef(0)
  const pendingSeek = useRef<number | null>(initialTime > 0 ? initialTime : null)

  const isReady = mediaDuration > 0

  /** meeting seconds -> media seconds */
  const scale = useMemo(() => {
    if (!mediaDuration || !durationSec) return 1
    // Tolerance so a recording a second or two short of the stated duration
    // is not treated as a scaled clip.
    if (mediaDuration >= durationSec - 2) return 1
    return mediaDuration / durationSec
  }, [mediaDuration, durationSec])

  const isScaled = scale !== 1

  const toMedia = useCallback((meetingSeconds: number) => meetingSeconds * scale, [scale])
  const toMeeting = useCallback(
    (mediaSeconds: number) => (scale === 0 ? 0 : mediaSeconds / scale),
    [scale]
  )

  const seek = useCallback(
    (meetingSeconds: number) => {
      const target = clamp(meetingSeconds, 0, durationSec)
      // Update state first so clicking a transcript line feels instant even
      // before the media element reports the new position.
      setCurrentTime(target)
      lastUpdate.current = Date.now()

      const video = videoRef.current
      if (!video || !isReady) {
        pendingSeek.current = target
        return
      }
      video.currentTime = toMedia(target)
    },
    [durationSec, isReady, toMedia]
  )

  const seekBy = useCallback(
    (delta: number) => seek(currentTime + delta),
    [currentTime, seek]
  )

  const play = useCallback(() => {
    videoRef.current?.play().catch(() => {
      // Autoplay policies can reject this; the UI stays paused, which is correct.
      setIsPlaying(false)
    })
  }, [])

  const pause = useCallback(() => videoRef.current?.pause(), [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) play()
    else video.pause()
  }, [play])

  const setPlaybackRate = useCallback((rate: number) => {
    setRate(rate)
    if (videoRef.current) videoRef.current.playbackRate = rate
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const d = Number.isFinite(video.duration) ? video.duration : 0
    setMediaDuration(d)
  }, [])

  // Apply a seek that arrived before the media was ready (e.g. a ?t= deep link).
  useEffect(() => {
    if (!isReady) return
    const target = pendingSeek.current
    if (target === null) return
    pendingSeek.current = null
    const video = videoRef.current
    if (video) video.currentTime = toMedia(target)
  }, [isReady, toMedia])

  // Media events are the source of truth for playback state.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      const now = Date.now()
      if (now - lastUpdate.current < UPDATE_INTERVAL_MS) return
      lastUpdate.current = now
      setCurrentTime(clamp(toMeeting(video.currentTime), 0, durationSec))
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(durationSec)
    }
    const onSeeked = () => {
      lastUpdate.current = Date.now()
      setCurrentTime(clamp(toMeeting(video.currentTime), 0, durationSec))
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('seeked', onSeeked)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [durationSec, toMeeting])

  const value = useMemo<PlayerContextValue>(
    () => ({
      videoRef,
      currentTime,
      duration: durationSec,
      isPlaying,
      isReady,
      playbackRate,
      isScaled,
      seek,
      seekBy,
      play,
      pause,
      togglePlay,
      setPlaybackRate,
      handleLoadedMetadata,
    }),
    [
      currentTime,
      durationSec,
      isPlaying,
      isReady,
      playbackRate,
      isScaled,
      seek,
      seekBy,
      play,
      pause,
      togglePlay,
      setPlaybackRate,
      handleLoadedMetadata,
    ]
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

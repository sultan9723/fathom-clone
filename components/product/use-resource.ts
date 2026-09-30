'use client'

import { useEffect, useRef, useState } from 'react'

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const loader = useRef(load)
  loader.current = load
  const controller = useRef<AbortController | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string; data: T | null; loading: boolean; error: string | null; canceled: boolean }>({ key, data: null, loading: true, error: null, canceled: false })
  useEffect(() => {
    const request = new AbortController()
    controller.current = request
    setState({ key, data: null, loading: true, error: null, canceled: false })
    loader.current(request.signal).then(
      data => { if (!request.signal.aborted) setState({ key, data, loading: false, error: null, canceled: false }) },
      error => { if (!request.signal.aborted) setState({ key, data: null, loading: false, error: error instanceof Error ? error.message : 'Please try again.', canceled: false }) },
    )
    return () => request.abort()
  }, [key, attempt])
  return {
    ...(state.key === key ? state : { key, data: null, loading: true, error: null, canceled: false }),
    retry: () => setAttempt(value => value + 1),
    cancel: () => { controller.current?.abort(); setState(current => ({ ...current, loading: false, canceled: true })) },
  }
}

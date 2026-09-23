'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'

/**
 * Global header search — the single search affordance in the app (SPEC has
 * no second search box on the list page body). Always targets /meetings,
 * regardless of which page it's typed from, since "Search Call Recordings"
 * only has one place to search. The URL stays the source of truth for the
 * query so a filtered view is shareable and survives a refresh.
 */
export function HeaderSearch() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const onMeetingsPage = pathname === '/meetings'
  const initialQuery = onMeetingsPage ? (searchParams.get('q') ?? '') : ''

  const [value, setValue] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const latest = useRef(value)

  latest.current = value

  useEffect(() => {
    if (!onMeetingsPage) return
    if (value === initialQuery) return
    const timer = setTimeout(() => {
      const q = latest.current.trim()
      startTransition(() => {
        router.replace(q ? `/meetings?q=${encodeURIComponent(q)}` : '/meetings', {
          scroll: false,
        })
      })
    }, 200)
    return () => clearTimeout(timer)
    // `initialQuery` is the value already reflected in the URL.
  }, [value, initialQuery, onMeetingsPage, router])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const q = value.trim()
    router.push(q ? `/meetings?q=${encodeURIComponent(q)}` : '/meetings')
  }

  return (
    <div className="relative w-pill-w max-w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-3"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search Call Recordings"
        aria-label="Search call recordings"
        // text-lg = 16px here (text-base is 13px in this project's remapped
        // scale) — the floor iOS needs to not zoom the page on focus.
        className="h-pill-h w-full rounded-md border-none bg-search-pill py-0 pl-8 pr-7 text-lg text-fg-1 placeholder:text-fg-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-3" aria-hidden="true" />
        ) : (
          value && (
            <button
              type="button"
              onClick={() => setValue('')}
              aria-label="Clear search"
              className="text-fg-3 transition hover:text-fg-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  )
}

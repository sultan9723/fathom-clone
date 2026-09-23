'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, X, Loader2 } from 'lucide-react'

/**
 * The URL is the source of truth for the query, so a filtered view is
 * shareable and survives a refresh. Local state drives the input so typing
 * stays instant while the debounced navigation catches up.
 */
export function SearchInput({ initialQuery = '' }: { initialQuery?: string }) {
  const [value, setValue] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const pathname = usePathname()
  const latest = useRef(value)

  latest.current = value

  useEffect(() => {
    if (value === initialQuery) return
    const timer = setTimeout(() => {
      const q = latest.current.trim()
      startTransition(() => {
        router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, {
          scroll: false,
        })
      })
    }, 200)
    return () => clearTimeout(timer)
    // `initialQuery` is the value already reflected in the URL.
  }, [value, initialQuery, pathname, router])

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search meetings…"
        aria-label="Search meetings by title"
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden="true" />
        ) : (
          value && (
            <button
              type="button"
              onClick={() => setValue('')}
              aria-label="Clear search"
              className="text-slate-400 transition hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </div>
    </div>
  )
}

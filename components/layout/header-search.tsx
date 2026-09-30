'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

/**
 * Global header search — jumps to the cross-meeting search results page
 * (/search) on Enter or clicking the search icon. Visually unchanged from
 * before; only the destination moved, from filtering the meeting-list
 * title (/meetings?q=) to full transcript search across every meeting.
 */
export function HeaderSearch() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const onSearchPage = pathname === '/search'
  const initialQuery = onSearchPage ? (searchParams.get('q') ?? '') : ''

  const [value, setValue] = useState(initialQuery)
  const router = useRouter()

  function submit() {
    const q = value.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="relative w-pill-w max-w-full">
      <button
        type="button"
        onClick={submit}
        aria-label="Search all meetings"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-1"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <input
        id="header-search-input"
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
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-3 transition hover:text-fg-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

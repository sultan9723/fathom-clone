'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchPageInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)

  function submit() {
    const q = value.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="relative w-full max-w-[480px]"
    >
      <button
        type="submit"
        aria-label="Search"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 hover:text-fg-1"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search all meetings"
        aria-label="Search all meetings"
        className="h-pill-h w-full rounded-md border-none bg-search-pill pl-8 pr-3 text-lg text-fg-1 placeholder:text-fg-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
    </form>
  )
}

'use client'

/** Focuses the global header search — a client component since the page
 * itself is a Server Component and the header lives in a different part
 * of the tree entirely (app/layout.tsx). */
export function SearchHint() {
  return (
    <button
      type="button"
      onClick={() => document.getElementById('header-search-input')?.focus()}
      className="hidden text-base text-fg-4 transition hover:text-fg-3 sm:block"
    >
      Search across all meetings →
    </button>
  )
}

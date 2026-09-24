import { Search } from 'lucide-react'

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <Search className="h-12 w-12 text-surface-5" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-fg-1">
        No results for &quot;{query}&quot;
      </h2>
      <p className="mt-1 text-md text-fg-3">Try different keywords or check your spelling</p>
    </div>
  )
}

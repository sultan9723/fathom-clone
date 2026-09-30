export default function SearchLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="h-4 w-12 animate-pulse rounded bg-surface-4" />
      <div className="mt-3 h-7 w-64 animate-pulse rounded bg-surface-4" />
      <div className="mt-4 h-pill-h w-full max-w-[480px] animate-pulse rounded-md bg-surface-4" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-surface-4" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-surface-4" />
        ))}
      </div>
    </main>
  )
}

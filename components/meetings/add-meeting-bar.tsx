import Link from 'next/link'

/**
 * The one thing you can actually do from the meeting list today.
 *
 * This replaced a join bar that took a meeting link and, on submit, admitted
 * it could not join. DESIGN.md's "only show what works" means a control
 * appears when it does something — so rather than a disabled-in-spirit form,
 * there is a link to the import flow that works, and one sentence saying
 * what is coming.
 */
export function AddMeetingBar() {
  return (
    <div className="flex flex-col gap-3 border-b border-border-subtle pb-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-small text-muted">
        Joining live meetings is coming next. For now you can add a meeting from a
        transcript you already have.
      </p>
      <Link
        href="/meetings/new"
        className="inline-flex h-control shrink-0 items-center justify-center rounded-control bg-accent px-5 font-semibold text-accent-ink transition-[background-color,opacity] duration-fast ease-out-design hover:brightness-95"
      >
        Add a meeting
      </Link>
    </div>
  )
}

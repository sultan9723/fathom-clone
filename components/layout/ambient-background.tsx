/**
 * The two drifting glows that sit behind every page (DESIGN.md).
 *
 * Decoration with no meaning, so it is aria-hidden and pinned behind the
 * content. Only `transform` animates — the glows are composited and never
 * cause layout — and the two loops run at different periods so they never
 * beat in sync.
 *
 * Under prefers-reduced-motion the glows stay exactly where they are and
 * stop moving: still visible, still doing their job as background, just
 * static. `motion-safe:` is what does that, so there is no second rule to
 * keep in step.
 *
 * `fixed` rather than absolute: the glows belong to the viewport, so a long
 * page scrolls its content past them instead of dragging them along.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[150px] -top-[200px] h-[700px] w-[700px] rounded-full blur-[10px] motion-safe:animate-drift-a"
        style={{
          background:
            'radial-gradient(circle, rgba(74,222,128,0.16) 0%, rgba(74,222,128,0) 70%)',
        }}
      />
      <div
        className="absolute -bottom-[250px] -right-[150px] h-[800px] w-[800px] rounded-full blur-[10px] motion-safe:animate-drift-b"
        style={{
          background:
            'radial-gradient(circle, rgba(125,180,255,0.10) 0%, rgba(125,180,255,0) 70%)',
        }}
      />
    </div>
  )
}

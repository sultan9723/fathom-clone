/**
 * Landing chrome. DESIGN.md gives the landing page 80px side padding and a
 * 1440px max width — and no sidebar, which is the whole reason this is a
 * separate route group from (app).
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-landing px-6 md:px-landing-x">
      {children}
    </div>
  )
}

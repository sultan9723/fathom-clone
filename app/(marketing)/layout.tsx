import { Navbar } from '@/components/layout/navbar'
import { MarketingFooter } from '@/components/layout/footer'
import { AmbientBackground } from '@/components/layout/ambient-background'

/**
 * Landing chrome: the shared navbar, the ambient background, and the full
 * marketing footer. DESIGN.md gives the landing page a 1440px max width;
 * the padding lives on the inner container so the navbar and footer can run
 * their own edges.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground />
      <Navbar />
      <main className="mx-auto w-full max-w-landing flex-1 px-6 lg:px-8">{children}</main>
      <MarketingFooter />
    </div>
  )
}

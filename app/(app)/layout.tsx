import { Sidebar } from '@/components/layout/sidebar'
import { AmbientBackground } from '@/components/layout/ambient-background'
import { ProductPreferences } from '@/components/product/preferences'
import '@/components/product/product.css'

/**
 * App shell: 240px sidebar beside the content. The ambient background sits
 * behind both, so the app and the landing page share one atmosphere instead
 * of the app looking like a different product.
 *
 * The app footer lives inside the sidebar (DESIGN.md), not here — a page
 * that scrolls should not push a footer bar around.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductPreferences>
      <AmbientBackground />
      <div className="product-shell">
        <a href="#product-main" className="product-skip">Skip to content</a>
        <Sidebar />
        <main id="product-main" className="product-main">{children}</main>
      </div>
    </ProductPreferences>
  )
}

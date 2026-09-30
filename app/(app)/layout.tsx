import { Sidebar } from '@/components/layout/sidebar'
import { ProductPreferences } from '@/components/product/preferences'
import '@/components/product/product.css'

/**
 * App shell: 240px sidebar beside the content, which takes DESIGN.md's
 * 28px vertical / 48px horizontal padding. The sidebar drops away below lg
 * so the content keeps the full width on a phone.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductPreferences><div className="product-shell"><a href="#product-main" className="product-skip">Skip to content</a><Sidebar /><main id="product-main" className="product-main">{children}</main></div></ProductPreferences>
  )
}

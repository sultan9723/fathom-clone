import { Sidebar } from '@/components/layout/sidebar'

/**
 * App shell: 240px sidebar beside the content, which takes DESIGN.md's
 * 28px vertical / 48px horizontal padding. The sidebar drops away below lg
 * so the content keeps the full width on a phone.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-stretch">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>
      <main className="min-w-0 flex-1 px-4 py-app-y sm:px-6 lg:px-app-x">
        {children}
      </main>
    </div>
  )
}

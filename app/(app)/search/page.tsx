import { ProductSearch } from '@/components/product/search'
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  return <ProductSearch key={q} query={q} />
}

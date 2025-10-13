import { getAllTags } from '@/db/queries'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { TagPageClient } from '@/components/tags/TagPageClient'

export default async function TagsPage() {
  const tags = await getAllTags()

  return (
    <main className="container mx-auto p-8">
      <Breadcrumbs />
      <TagPageClient tags={tags} />
    </main>
  )
}

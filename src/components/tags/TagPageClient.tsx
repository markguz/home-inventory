'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon, Tag as TagIcon } from 'lucide-react'
import { Tag } from '@/types'
import { TagForm } from './TagForm'

interface TagPageClientProps {
  tags: (Tag & { _count?: { itemTags: number } })[]
}

export function TagPageClient({ tags }: TagPageClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Tags</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No tags yet. Create your first tag to get started.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/items?tagId=${tag.id}`}>
              <Card className="relative hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{tag.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {tag._count && (
                      <span>
                        {tag._count.itemTags} item{tag._count.itemTags !== 1 ? 's' : ''}
                      </span>
                    )}
                    {tag.color && (
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: tag.color,
                          color: 'white',
                        }}
                      >
                        {tag.color}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <TagForm
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
      />
    </div>
  )
}

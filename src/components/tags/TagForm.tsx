'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tagSchema, type TagFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Tag } from '@/types'

interface TagFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: Tag
  mode: 'create' | 'edit'
}

export function TagForm({ open, onOpenChange, tag, mode }: TagFormProps) {
  const router = useRouter()

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: tag?.name || '',
      color: tag?.color || '',
    },
  })

  const onSubmit = async (data: TagFormData) => {
    try {
      const url = mode === 'create'
        ? '/api/tags'
        : `/api/tags/${tag?.id}`

      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save tag')
      }

      toast.success(
        mode === 'create'
          ? 'Tag created successfully'
          : 'Tag updated successfully'
      )

      form.reset()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Tag' : 'Edit Tag'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new tag to label and organize your inventory items.'
              : 'Update the tag information.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fragile, Important" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., #FF5733"
                        {...field}
                        value={field.value || ''}
                        maxLength={7}
                      />
                      <Input
                        type="color"
                        className="w-16 h-10 cursor-pointer"
                        value={field.value || '#000000'}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter a hex color code (e.g., #FF5733) or use the color picker
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : mode === 'create'
                  ? 'Create'
                  : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

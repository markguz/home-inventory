'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { itemSchema, type ItemFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Category } from '@/types'

interface Location {
  id: string
  name: string
}

interface ItemFormProps {
  item?: Partial<ItemFormData>
  categories: Category[]
  locations: Location[]
  onSubmit: (data: ItemFormData) => Promise<void>
  onCancel?: () => void
}

export function ItemForm({ categories, locations, item, onSubmit, onCancel }: ItemFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: item
  })

  const handleFormSubmit = async (data: ItemFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Item Name</Label>
        <Input id="name" {...register('name')} placeholder="e.g., Cordless Drill" />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} placeholder="Optional description" />
      </div>

      <div>
        <Label htmlFor="categoryId">Category</Label>
        <select {...register('categoryId')} className="w-full rounded-md border p-2">
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && <p className="text-sm text-red-500">{errors.categoryId.message}</p>}
      </div>

      <div>
        <Label htmlFor="locationId">Location</Label>
        <select {...register('locationId')} className="w-full rounded-md border p-2">
          <option value="">Select a location</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
        {errors.locationId && <p className="text-sm text-red-500">{errors.locationId.message}</p>}
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} defaultValue={1} />
      </div>

      <div>
        <Label htmlFor="minQuantity">Minimum Quantity (Alert Threshold)</Label>
        <Input
          id="minQuantity"
          type="number"
          {...register('minQuantity', {
            setValueAs: (v) => v === '' || v === null ? undefined : Number(v)
          })}
          placeholder="Optional - alerts when stock is low"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty to use category default
        </p>
      </div>

      <div>
        <Label htmlFor="serialNumber">Serial Number</Label>
        <Input id="serialNumber" {...register('serialNumber')} placeholder="Optional" />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} placeholder="Additional notes" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Item'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

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

interface ItemFormProps {
  categories: Category[]
  defaultValues?: Partial<ItemFormData>
  onSubmit: (data: FormData) => Promise<void>
}

export function ItemForm({ categories, defaultValues, onSubmit }: ItemFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues
  })

  const handleFormSubmit = async (data: ItemFormData) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
    await onSubmit(formData)
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
        <Label htmlFor="location">Location</Label>
        <Input id="location" {...register('location')} placeholder="e.g., Garage, Shelf 3" />
        {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
      </div>

      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} defaultValue={1} />
      </div>

      <div>
        <Label htmlFor="serialNumber">Serial Number</Label>
        <Input id="serialNumber" {...register('serialNumber')} placeholder="Optional" />
      </div>

      <div>
        <Label htmlFor="modelNumber">Model Number</Label>
        <Input id="modelNumber" {...register('modelNumber')} placeholder="Optional" />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register('notes')} placeholder="Additional notes" />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Item'}
      </Button>
    </form>
  )
}

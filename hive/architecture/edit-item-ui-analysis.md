# Edit Item UI - Frontend Analysis & Implementation Plan

## Executive Summary

The frontend is well-structured with reusable components. The **ItemForm** component can be reused for editing with minimal modifications. We'll create a new route at `/items/[id]/edit` that mirrors the `/items/new` pattern.

## Current Architecture Analysis

### 1. Form Component Structure

**File:** `/src/components/items/ItemForm.tsx`

**Key Features:**
- Uses **React Hook Form** with Zod validation
- Accepts `defaultValues` prop for pre-population (already edit-ready!)
- Generic `onSubmit` handler accepting FormData
- Validated with `itemSchema` from `/src/lib/validations.ts`

**Props Interface:**
```typescript
interface ItemFormProps {
  categories: Category[]
  defaultValues?: Partial<ItemFormData>  // ✅ Already supports edit mode!
  onSubmit: (data: FormData) => Promise<void>
}
```

### 2. Form Library

**Library:** React Hook Form v7.64.0 with Zod resolver
- `@hookform/resolvers` v5.2.2
- Validation schema: `itemSchema` from `/src/lib/validations.ts`

### 3. Current Routes

```
/items              → Item list page
/items/new          → Add new item (uses ItemForm)
/items/[id]         → View item details (READ ONLY)
/items/[id]/edit    → ❌ NEEDS TO BE CREATED
```

### 4. API Service Layer

**File:** `/src/app/actions/items.ts`

**Available Server Actions:**
- ✅ `createItem(formData: FormData)` - Existing
- ✅ `updateItem(id: string, formData: FormData)` - **Already implemented!**
- ✅ `deleteItem(id: string)` - Existing

**Authentication:** Uses `auth()` from NextAuth to check session

### 5. Database Queries

**File:** `/src/db/queries.ts`

**Available Functions:**
- ✅ `getItemById(id: string)` - Fetches item with relations
- ✅ `getAllCategories()` - For category dropdown
- ✅ `getAllLocations()` - For location dropdown

### 6. Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ /items/[id]/edit Page (Server Component)               │
│  1. Fetch item data with getItemById()                 │
│  2. Fetch categories with getAllCategories()           │
│  3. Transform item data to form defaultValues          │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ ItemForm Component (Client Component)                   │
│  - Pre-populated with defaultValues                     │
│  - React Hook Form handles validation                   │
│  - OnSubmit → Server Action                            │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ updateItem() Server Action                              │
│  1. Validate with itemSchema                            │
│  2. Check authentication                                │
│  3. Update in Prisma                                    │
│  4. Revalidate paths                                    │
│  5. Return success/error                                │
└─────────────────────────────────────────────────────────┘
```

### 7. State Management

**Approach:** Server Components + Server Actions (Next.js App Router pattern)
- No client-side state management library needed
- Form state managed by React Hook Form
- Cache invalidation via `revalidatePath()`

### 8. Navigation

**Current Patterns:**
- Uses Next.js `<Link>` component for navigation
- Uses `redirect()` after form submission
- ItemCard has "View Details" button → `/items/[id]`
- **NEEDS:** "Edit" button in detail view → `/items/[id]/edit`

## Implementation Plan

### Phase 1: Create Edit Route ✅

**New File:** `/src/app/items/[id]/edit/page.tsx`

**Pattern to Follow:** Mirror `/src/app/items/new/page.tsx`

```typescript
// Server Component
export default async function EditItemPage({ params }: { params: { id: string } }) {
  // 1. Fetch item data
  const item = await getItemById(params.id)

  // 2. Handle not found
  if (!item) notFound()

  // 3. Fetch categories
  const categories = await getAllCategories()

  // 4. Create server action for this specific item
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await updateItem(params.id, formData)
    if (result.success) {
      redirect(`/items/${params.id}`)
    }
  }

  // 5. Transform item data for defaultValues
  const defaultValues = {
    name: item.name,
    description: item.description || '',
    categoryId: item.categoryId,
    locationId: item.locationId,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    serialNumber: item.serialNumber || '',
    notes: item.notes || ''
  }

  // 6. Render form with defaultValues
  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <Breadcrumbs />
      <Card>
        <CardHeader>
          <CardTitle>Edit Item</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemForm
            categories={categories}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </main>
  )
}
```

### Phase 2: Add Edit Button to Detail View ✅

**File to Modify:** `/src/app/items/[id]/page.tsx`

**Add Edit Button:**
```typescript
<div className="flex gap-2">
  <Link href={`/items/${item.id}/edit`}>
    <Button>Edit Item</Button>
  </Link>
  <Link href="/items">
    <Button variant="outline">Back to Items</Button>
  </Link>
</div>
```

### Phase 3: Optional - Update ItemForm Component

**File:** `/src/components/items/ItemForm.tsx`

**Potential Enhancement:** Dynamic button text
```typescript
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting
    ? 'Saving...'
    : defaultValues?.id ? 'Update Item' : 'Save Item'
  }
</Button>
```

### Phase 4: Add Edit Option to ItemCard (Optional)

**File:** `/src/components/items/ItemCard.tsx`

**Add Quick Edit Button:**
```typescript
<div className="flex items-center justify-between gap-2">
  <Badge variant="secondary">{item.category.name}</Badge>
  <div className="flex gap-2">
    <Link href={`/items/${item.id}/edit`}>
      <Button variant="ghost" size="sm">Edit</Button>
    </Link>
    <Link href={`/items/${item.id}`}>
      <Button variant="outline" size="sm">View</Button>
    </Link>
  </div>
</div>
```

## Key Advantages of Current Architecture

1. ✅ **ItemForm already supports editing** via `defaultValues` prop
2. ✅ **updateItem() server action already exists**
3. ✅ **Validation schema is shared** (create & update use same `itemSchema`)
4. ✅ **Database queries already available** (getItemById, getAllCategories)
5. ✅ **No new dependencies needed**
6. ✅ **Follows existing patterns** (mirror `/items/new` structure)

## Validation Schema

**File:** `/src/lib/validations.ts`

```typescript
export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  locationId: z.string().min(1, 'Location is required'),
  quantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0).optional().or(z.literal(undefined)),
  serialNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
})

// Also available for partial updates:
export const itemUpdateSchema = itemSchema.partial().extend({
  id: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})
```

## Error Handling

**Server Action Response:**
```typescript
{ success: true, data?: Item }  // Success
{ error: string | ZodErrors }    // Validation or server error
```

**Form handles errors via:**
- React Hook Form's `errors` object
- Display inline validation messages
- Server errors shown via toast/alert

## Testing Considerations

1. **Form Pre-population:** Verify all fields load with correct data
2. **Validation:** Test required fields, min/max values
3. **Update Success:** Verify redirect to detail view after save
4. **Not Found:** Test invalid item ID handling
5. **Permissions:** Verify only authenticated users can edit
6. **Concurrent Edits:** Consider optimistic locking (future enhancement)

## Coordination Points

### Backend Team
- ✅ `updateItem()` server action exists and is ready
- ✅ Authentication check is implemented
- ✅ Validation uses shared schema

### Frontend Team
- **Task 1:** Create `/items/[id]/edit/page.tsx`
- **Task 2:** Add Edit button to detail view
- **Task 3:** Test form pre-population
- **Task 4:** Test update flow end-to-end

### Testing Team
- Validate edit form functionality
- Test error scenarios
- Verify navigation flow
- Test mobile responsiveness

## Timeline Estimate

- **Route Creation:** 30 minutes
- **Edit Button Addition:** 15 minutes
- **Testing & Refinement:** 45 minutes
- **Total:** ~1.5 hours

## Dependencies

**None needed!** All required libraries and functions already exist.

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Data transformation errors | Use TypeScript types, test with various item states |
| Invalid item ID | Handle with `notFound()` from Next.js |
| Form not pre-populating | Verify defaultValues prop structure matches ItemFormData |
| Concurrent edits | Document as future enhancement, consider timestamp checking |

## Next Steps

1. **Immediate:** Create edit route following the pattern above
2. **Quick Win:** Add Edit button to detail view
3. **Polish:** Consider adding "Last updated" timestamp display
4. **Future:** Add optimistic UI updates, undo functionality

---

**Status:** Ready for implementation
**Complexity:** Low (reuses existing components and patterns)
**Estimated Effort:** 1.5 hours

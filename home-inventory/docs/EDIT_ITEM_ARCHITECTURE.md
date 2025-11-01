# Edit Item Feature - Complete Architecture Design

## Executive Summary

This document provides a comprehensive architectural design for the Edit Item feature in the Home Inventory application. The design leverages existing infrastructure while adding intuitive editing capabilities accessible from multiple entry points.

**Key Design Principles:**
- Reuse existing ItemForm component with mode switching
- Maintain RESTful API patterns with PATCH for partial updates
- Provide multiple entry points (list view, detail view)
- Ensure data consistency with optimistic UI updates
- Support both inline and modal editing patterns

---

## 1. Backend API Design

### 1.1 Existing Endpoint Analysis

**Current Implementation:** `/api/items/[id]/route.ts`

The PATCH endpoint already exists and is well-designed:

```typescript
PATCH /api/items/:id
```

**Current Capabilities:**
- ✅ Partial updates (using `itemUpdateSchema.partial()`)
- ✅ Tag management (delete existing, create new)
- ✅ Proper validation with Zod
- ✅ Includes related data in response
- ✅ Error handling for validation and not found

### 1.2 Request/Response Specification

#### Request Structure
```typescript
PATCH /api/items/{id}
Content-Type: application/json
Authorization: Bearer {session-token}

{
  // All fields optional - send only what changed
  "name"?: string,
  "description"?: string,
  "categoryId"?: string,
  "locationId"?: string,
  "quantity"?: number,
  "minQuantity"?: number,
  "serialNumber"?: string,
  "notes"?: string,
  "tagIds"?: string[],

  // Extended fields (from schema)
  "purchaseDate"?: string (ISO 8601),
  "purchasePrice"?: number,
  "currentValue"?: number,
  "condition"?: "excellent" | "good" | "fair" | "poor",
  "imageUrl"?: string,
  "barcode"?: string,
  "warrantyUntil"?: string (ISO 8601)
}
```

#### Success Response (200 OK)
```typescript
{
  "success": true,
  "data": {
    "id": "cuid",
    "name": "Updated Item Name",
    "description": "...",
    "quantity": 5,
    "categoryId": "cuid",
    "category": {
      "id": "cuid",
      "name": "Tools",
      "icon": "wrench",
      "color": "#FF6B6B"
    },
    "locationId": "cuid",
    "location": {
      "id": "cuid",
      "name": "Garage"
    },
    "tags": [
      {
        "id": "cuid",
        "itemId": "cuid",
        "tagId": "cuid",
        "tag": {
          "id": "cuid",
          "name": "Power Tools",
          "color": "#4ECDC4"
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T10:30:00Z"
  }
}
```

#### Error Responses

**400 Bad Request - Validation Error**
```typescript
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Name is required",
      "path": ["name"]
    }
  ]
}
```

**404 Not Found**
```typescript
{
  "success": false,
  "error": "Item not found"
}
```

**401 Unauthorized**
```typescript
{
  "success": false,
  "error": "Unauthorized"
}
```

### 1.3 API Enhancements Needed

**RECOMMENDATION: Add authorization check**

The current PATCH endpoint lacks user ownership verification. Should add:

```typescript
// In /api/items/[id]/route.ts PATCH handler
const session = await auth();
if (!session?.user) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

// Verify ownership (unless admin)
const existingItem = await prisma.item.findUnique({
  where: { id },
  select: { userId: true }
});

if (session.user.role !== 'ADMIN' && existingItem.userId !== session.user.id) {
  return NextResponse.json(
    { success: false, error: 'Forbidden' },
    { status: 403 }
  );
}
```

---

## 2. Data Model & Schema

### 2.1 Current Schema Analysis

**Item Model (from schema.prisma):**
```prisma
model Item {
  id            String    @id @default(cuid())
  name          String
  description   String?
  quantity      Int       @default(1)
  minQuantity   Int?
  purchaseDate  DateTime?
  purchasePrice Float?
  currentValue  Float?
  condition     String?   @default("good")
  notes         String?
  imageUrl      String?
  barcode       String?
  serialNumber  String?
  warrantyUntil DateTime?
  userId        String
  categoryId    String
  locationId    String
  tags          ItemTag[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 2.2 Validation Rules

**Current Validation (itemSchema):**
```typescript
const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  locationId: z.string().min(1, 'Location is required'),
  quantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0).optional().or(z.literal(undefined)),
  serialNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
})
```

**Update Schema:**
```typescript
const itemUpdateSchema = itemSchema.partial().extend({
  id: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})
```

### 2.3 Schema Extensions Needed

**RECOMMENDATION: Enhance validation schema**

Add validation for extended fields:

```typescript
const itemSchemaExtended = z.object({
  // ... existing fields ...
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  barcode: z.string().max(100).optional(),
  warrantyUntil: z.coerce.date().optional(),
})
```

### 2.4 Database Query Pattern

**Efficient Update Query:**
```typescript
// Only update fields that are provided
const updateData = Object.fromEntries(
  Object.entries(validatedData).filter(([_, v]) => v !== undefined)
);

const item = await prisma.item.update({
  where: { id },
  data: updateData,
  include: {
    category: true,
    location: true,
    tags: { include: { tag: true } }
  }
});
```

---

## 3. Frontend Flow & User Experience

### 3.1 Entry Points

**Multiple Access Patterns:**

1. **Item List View** (`/items`)
   - Inline edit button on each ItemCard
   - Quick edit modal for simple changes
   - Full page edit for comprehensive updates

2. **Item Detail View** (`/items/[id]`)
   - Edit button in page header
   - Navigates to dedicated edit page
   - Preserves context with breadcrumbs

3. **Search Results**
   - Edit option in action menu
   - Consistent with list view pattern

### 3.2 Editing Patterns

#### Pattern A: Modal Edit (Recommended for Quick Changes)

**Use Cases:**
- Update quantity
- Change location
- Edit description
- Modify tags

**Advantages:**
- Context preservation
- Faster interaction
- Less navigation
- Mobile-friendly

**Implementation:**
```tsx
// ItemCard.tsx - Add edit button
<Button
  variant="ghost"
  size="sm"
  onClick={() => setEditModalOpen(true)}
>
  <PencilIcon />
</Button>

// EditItemModal.tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Item</DialogTitle>
    </DialogHeader>
    <ItemForm
      mode="edit"
      defaultValues={item}
      onSubmit={handleUpdate}
    />
  </DialogContent>
</Dialog>
```

#### Pattern B: Dedicated Edit Page (Recommended for Complex Changes)

**Use Cases:**
- Comprehensive updates
- Add/edit images
- Update financial information
- Multiple field changes

**Advantages:**
- More screen space
- Better for complex forms
- Native back button support
- Easier validation display

**Implementation:**
```tsx
// /items/[id]/edit/page.tsx
export default async function EditItemPage({ params }: { params: { id: string } }) {
  const item = await getItemById(params.id);

  return (
    <main>
      <Breadcrumbs />
      <h1>Edit Item: {item.name}</h1>
      <ItemForm
        mode="edit"
        itemId={item.id}
        defaultValues={item}
        onSubmit={handleUpdate}
      />
    </main>
  );
}
```

### 3.3 Component Architecture

```
┌─────────────────────────────────────────┐
│         Items List Page                 │
│  /items/page.tsx                        │
└────────────┬────────────────────────────┘
             │
             ├──> ItemCard (displays item)
             │    ├─> Quick Edit Button
             │    └─> View Details Link
             │
             ├──> EditItemModal
             │    └─> ItemForm (mode="edit")
             │
             └──> ItemList Component
                  └─> Maps items to ItemCards

┌─────────────────────────────────────────┐
│      Item Detail Page                   │
│  /items/[id]/page.tsx                   │
└────────────┬────────────────────────────┘
             │
             └──> Edit Button
                  └─> Links to /items/[id]/edit

┌─────────────────────────────────────────┐
│      Edit Item Page                     │
│  /items/[id]/edit/page.tsx              │
└────────────┬────────────────────────────┘
             │
             └──> ItemForm (mode="edit")
                  ├─> Fetches item data
                  ├─> Pre-fills form
                  ├─> Validates input
                  └─> Calls API on submit
```

### 3.4 Form State Management

**ItemForm Component Enhancement:**

```typescript
interface ItemFormProps {
  mode: 'create' | 'edit'
  itemId?: string
  defaultValues?: Partial<ItemFormData>
  onSubmit: (data: ItemFormData) => Promise<void>
  onCancel?: () => void
}

export function ItemForm({ mode, itemId, defaultValues, onSubmit, onCancel }: ItemFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {mode === 'edit' ? 'Update Item' : 'Create Item'}
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
```

### 3.5 Optimistic Updates

**Client-Side Update Strategy:**

```typescript
// In edit action or form handler
const handleUpdate = async (data: ItemFormData) => {
  // Optimistic update
  const optimisticItem = { ...currentItem, ...data };
  setCurrentItem(optimisticItem);

  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Update failed');

    const result = await response.json();

    // Confirm update with server data
    setCurrentItem(result.data);

    // Revalidate cache
    router.refresh();

    toast.success('Item updated successfully');
  } catch (error) {
    // Rollback on error
    setCurrentItem(currentItem);
    toast.error('Failed to update item');
  }
};
```

---

## 4. Integration Points

### 4.1 Component Updates Required

#### ItemCard.tsx
**Changes:**
- Add edit button to card actions
- Add edit modal state management
- Handle optimistic updates

```typescript
// Add to ItemCard component
const [isEditModalOpen, setIsEditModalOpen] = useState(false);

// In card header or actions
<Button
  variant="ghost"
  size="sm"
  onClick={() => setIsEditModalOpen(true)}
  aria-label="Edit item"
>
  <PencilIcon className="h-4 w-4" />
</Button>

<EditItemModal
  item={item}
  open={isEditModalOpen}
  onOpenChange={setIsEditModalOpen}
/>
```

#### ItemForm.tsx
**Changes:**
- Add mode prop ('create' | 'edit')
- Support partial defaultValues
- Update submit button text based on mode
- Add cancel button for edit mode
- Track isDirty state

```typescript
// Already has good structure, minor enhancements:
- Add mode prop
- Conditional button text
- Cancel handler
```

#### Item Detail Page (`/items/[id]/page.tsx`)
**Changes:**
- Add edit button to page header
- Link to edit page

```typescript
<div className="flex justify-between items-center mb-8">
  <h1 className="text-4xl font-bold">{item.name}</h1>
  <Link href={`/items/${item.id}/edit`}>
    <Button variant="default">
      <PencilIcon className="h-4 w-4 mr-2" />
      Edit Item
    </Button>
  </Link>
</div>
```

### 4.2 New Components Needed

#### 1. EditItemModal.tsx
```typescript
interface EditItemModalProps {
  item: ItemWithRelations
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditItemModal({ item, open, onOpenChange }: EditItemModalProps) {
  const router = useRouter();

  const handleSubmit = async (data: ItemFormData) => {
    const response = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      onOpenChange(false);
      router.refresh();
      toast.success('Item updated successfully');
    } else {
      toast.error('Failed to update item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item: {item.name}</DialogTitle>
        </DialogHeader>
        <ItemForm
          mode="edit"
          defaultValues={item}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

#### 2. Edit Item Page (`/items/[id]/edit/page.tsx`)
```typescript
export default async function EditItemPage({
  params
}: {
  params: { id: string }
}) {
  const item = await getItemById(params.id);
  const categories = await getAllCategories();
  const locations = await getAllLocations();

  if (!item) notFound();

  return (
    <main className="container mx-auto p-8 max-w-3xl">
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-4xl font-bold">Edit Item</h1>
        <p className="text-muted-foreground mt-2">
          Update details for {item.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditItemForm
            item={item}
            categories={categories}
            locations={locations}
          />
        </CardContent>
      </Card>
    </main>
  );
}
```

#### 3. EditItemForm.tsx (Client Component)
```typescript
'use client'

interface EditItemFormProps {
  item: ItemWithRelations
  categories: Category[]
  locations: Location[]
}

export function EditItemForm({ item, categories, locations }: EditItemFormProps) {
  const router = useRouter();

  const handleSubmit = async (data: ItemFormData) => {
    const response = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      toast.success('Item updated successfully');
      router.push(`/items/${item.id}`);
      router.refresh();
    } else {
      const error = await response.json();
      toast.error(error.error || 'Failed to update item');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ItemForm
      mode="edit"
      categories={categories}
      defaultValues={{
        name: item.name,
        description: item.description || '',
        categoryId: item.categoryId,
        locationId: item.locationId,
        quantity: item.quantity,
        minQuantity: item.minQuantity || undefined,
        serialNumber: item.serialNumber || '',
        notes: item.notes || ''
      }}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
```

### 4.3 API Service Updates

#### Create centralized API service

```typescript
// src/lib/api/items.ts
export class ItemsAPI {
  static async updateItem(id: string, data: Partial<ItemFormData>) {
    const response = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update item');
    }

    return response.json();
  }

  static async getItem(id: string) {
    const response = await fetch(`/api/items/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch item');
    }

    return response.json();
  }
}
```

### 4.4 Server Actions

```typescript
// src/app/actions/items.ts
'use server'

export async function updateItem(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    categoryId: formData.get('categoryId') as string,
    locationId: formData.get('locationId') as string,
    quantity: parseInt(formData.get('quantity') as string),
    minQuantity: formData.get('minQuantity')
      ? parseInt(formData.get('minQuantity') as string)
      : undefined,
    serialNumber: formData.get('serialNumber') as string,
    notes: formData.get('notes') as string,
  };

  try {
    const validatedData = itemUpdateSchema.parse(data);

    const item = await prisma.item.update({
      where: { id },
      data: validatedData,
      include: {
        category: true,
        location: true,
        tags: { include: { tag: true } }
      }
    });

    revalidatePath('/items');
    revalidatePath(`/items/${id}`);

    return { success: true, data: item };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation error',
        details: error.issues
      };
    }

    return {
      success: false,
      error: 'Failed to update item'
    };
  }
}
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (2-3 hours)
1. ✅ Backend PATCH endpoint (already exists)
2. Add authorization checks to PATCH endpoint
3. Enhance validation schema for extended fields
4. Update TypeScript types

### Phase 2: Core Edit UI (3-4 hours)
1. Create EditItemModal component
2. Update ItemCard with edit button
3. Create /items/[id]/edit page
4. Update ItemForm to support edit mode

### Phase 3: Integration (2-3 hours)
1. Add edit button to item detail page
2. Implement optimistic updates
3. Add loading states and error handling
4. Create centralized API service

### Phase 4: Polish & Testing (2-3 hours)
1. Add confirmation for unsaved changes
2. Implement keyboard shortcuts
3. Add accessibility attributes
4. Write unit and integration tests
5. Test on mobile devices

**Total Estimated Time: 9-13 hours**

---

## 6. Technical Decisions & Rationale

### Decision 1: PATCH vs PUT
**Choice:** PATCH
**Rationale:**
- Allows partial updates
- More efficient (only send changed fields)
- Better UX (user doesn't need to fill entire form)
- Already implemented in codebase

### Decision 2: Modal vs Page Edit
**Choice:** Both patterns
**Rationale:**
- Modal for quick edits (quantity, location)
- Page for comprehensive edits (all fields)
- Provides flexibility for different use cases
- Better mobile experience with modal

### Decision 3: Optimistic Updates
**Choice:** Implement with rollback
**Rationale:**
- Perceived performance improvement
- Better user experience
- Rollback ensures data consistency
- Common pattern in modern web apps

### Decision 4: Form Reuse
**Choice:** Extend existing ItemForm
**Rationale:**
- DRY principle
- Consistent validation
- Reduced maintenance
- Easier to keep create/edit in sync

### Decision 5: Authorization
**Choice:** Server-side with session check
**Rationale:**
- Security best practice
- Prevents unauthorized edits
- Aligns with existing auth patterns
- User can only edit their own items (unless admin)

---

## 7. Security Considerations

### 7.1 Authorization
- Verify user owns item before allowing edit
- Admin users can edit any item
- Session validation on every request

### 7.2 Validation
- Server-side validation with Zod
- Client-side validation for UX
- Sanitize user input
- Validate IDs exist (categoryId, locationId)

### 7.3 Data Integrity
- Use transactions for complex updates
- Atomic tag updates (delete all, create new)
- Prevent race conditions with optimistic locking

### 7.4 Rate Limiting
- Consider adding rate limits for update endpoint
- Prevent abuse of API

---

## 8. Performance Considerations

### 8.1 Database Queries
- Use selective includes (only fetch needed relations)
- Add indexes on frequently queried fields (already exists)
- Consider caching for categories/locations

### 8.2 Frontend Optimization
- Lazy load edit modal
- Debounce validation
- Use React.memo for ItemCard
- Implement virtual scrolling for large lists

### 8.3 Network Optimization
- Only send changed fields
- Compress responses
- Use HTTP caching headers
- Implement retry logic for failed updates

---

## 9. Testing Strategy

### 9.1 Unit Tests
```typescript
// ItemForm.test.tsx
describe('ItemForm edit mode', () => {
  it('should pre-fill form with item data', () => {});
  it('should show "Update Item" button in edit mode', () => {});
  it('should track dirty state', () => {});
  it('should call onCancel when cancel clicked', () => {});
});

// API route test
describe('PATCH /api/items/[id]', () => {
  it('should update item with valid data', () => {});
  it('should return 404 for non-existent item', () => {});
  it('should return 401 for unauthenticated user', () => {});
  it('should return 403 for non-owner', () => {});
  it('should validate required fields', () => {});
});
```

### 9.2 Integration Tests
```typescript
describe('Edit Item Flow', () => {
  it('should edit item from list view modal', () => {});
  it('should edit item from detail page', () => {});
  it('should handle optimistic updates', () => {});
  it('should rollback on error', () => {});
  it('should show validation errors', () => {});
});
```

### 9.3 E2E Tests (Playwright)
```typescript
test('Edit item end-to-end', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to items
  await page.goto('/items');

  // Click edit on first item
  await page.click('[data-testid="edit-item-button"]');

  // Update name
  await page.fill('[name="name"]', 'Updated Item Name');

  // Submit
  await page.click('button[type="submit"]');

  // Verify update
  await expect(page.locator('text=Updated Item Name')).toBeVisible();
});
```

---

## 10. Accessibility

### 10.1 Keyboard Navigation
- Tab through form fields
- Enter to submit
- Escape to close modal
- Arrow keys for select inputs

### 10.2 ARIA Attributes
```tsx
<Button
  aria-label="Edit item"
  aria-describedby="edit-description"
>
  Edit
</Button>

<Dialog
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  {/* Modal content */}
</Dialog>
```

### 10.3 Screen Reader Support
- Announce form errors
- Announce successful updates
- Label all form inputs
- Provide context for actions

---

## 11. Future Enhancements

### 11.1 Batch Edit
- Select multiple items
- Edit common fields
- Bulk update

### 11.2 Edit History
- Track changes over time
- Show audit log
- Revert to previous version

### 11.3 Collaborative Editing
- Real-time updates
- Conflict resolution
- Show who's editing

### 11.4 Advanced Features
- Inline editing in list view
- Drag-and-drop image upload
- Barcode scanning
- Auto-save drafts

---

## Appendix A: File Structure

```
home-inventory/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── items/
│   │   │       └── [id]/
│   │   │           └── route.ts (PATCH endpoint - exists)
│   │   └── items/
│   │       ├── [id]/
│   │       │   ├── page.tsx (detail page - exists)
│   │       │   └── edit/
│   │       │       └── page.tsx (NEW - edit page)
│   │       └── page.tsx (list page - exists)
│   ├── components/
│   │   ├── items/
│   │   │   ├── ItemCard.tsx (UPDATE - add edit button)
│   │   │   ├── ItemForm.tsx (UPDATE - add mode prop)
│   │   │   ├── EditItemModal.tsx (NEW)
│   │   │   └── EditItemForm.tsx (NEW)
│   │   └── ui/ (shadcn components)
│   ├── lib/
│   │   ├── api/
│   │   │   └── items.ts (NEW - centralized API)
│   │   └── validations.ts (UPDATE - enhance schema)
│   └── types/
│       └── item.types.ts (exists)
└── docs/
    └── EDIT_ITEM_ARCHITECTURE.md (this file)
```

---

## Appendix B: API Integration Examples

### React Hook for Item Updates
```typescript
// hooks/useUpdateItem.ts
import { useState } from 'react';
import { ItemsAPI } from '@/lib/api/items';

export function useUpdateItem(itemId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = async (data: Partial<ItemFormData>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await ItemsAPI.updateItem(itemId, data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateItem, isLoading, error };
}
```

---

## Document Information

- **Author:** System Architecture Designer
- **Date:** 2025-10-31
- **Version:** 1.0
- **Status:** Design Complete - Ready for Implementation
- **Related Documents:**
  - `/home-inventory/docs/API.md`
  - `/home-inventory/README.md`
  - `/home-inventory/prisma/schema.prisma`

---

## Approval & Sign-off

This architecture has been designed to integrate seamlessly with the existing codebase while following best practices for:
- RESTful API design
- React/Next.js patterns
- Database efficiency
- User experience
- Security
- Accessibility

**Ready for development implementation.**

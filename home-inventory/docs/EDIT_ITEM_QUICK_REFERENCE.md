# Edit Item Feature - Quick Reference Guide

## 📋 Overview

This is a quick reference for implementing the Edit Item feature. For detailed architecture, see:
- **Full Architecture:** `EDIT_ITEM_ARCHITECTURE.md`
- **Diagrams:** `EDIT_ITEM_DIAGRAMS.md`

---

## 🎯 Quick Start

### What's Already Built
✅ PATCH `/api/items/[id]` endpoint (fully functional)
✅ Item validation schema with partial updates
✅ ItemForm component (needs mode prop)
✅ Item detail page at `/items/[id]`

### What Needs to Be Built
❌ Authorization check in PATCH endpoint
❌ EditItemModal component
❌ Edit item page at `/items/[id]/edit`
❌ Edit button in ItemCard
❌ Edit button in detail page

---

## 🔧 Implementation Steps

### Step 1: Add Authorization (30 mins)
**File:** `/src/app/api/items/[id]/route.ts`

```typescript
// Add to PATCH handler (after line 45)
const session = await auth();
if (!session?.user) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}

// Verify ownership
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

### Step 2: Update ItemCard (30 mins)
**File:** `/src/components/items/ItemCard.tsx`

Add edit button and modal:
```typescript
import { useState } from 'react';
import { EditItemModal } from './EditItemModal';
import { PencilIcon } from 'lucide-react';

export function ItemCard({ item }: { item: ItemWithRelations }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>{item.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            aria-label="Edit item"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      {/* ... rest of card ... */}

      <EditItemModal
        item={item}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </Card>
  );
}
```

### Step 3: Create EditItemModal (1 hour)
**New File:** `/src/components/items/EditItemModal.tsx`

```typescript
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ItemForm } from './ItemForm';
import { ItemWithRelations } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface EditItemModalProps {
  item: ItemWithRelations;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemModal({ item, open, onOpenChange }: EditItemModalProps) {
  const router = useRouter();

  const handleSubmit = async (data: ItemFormData) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update item');
      }

      toast.success('Item updated successfully');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update item');
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

### Step 4: Update ItemForm (30 mins)
**File:** `/src/components/items/ItemForm.tsx`

Add mode prop and cancel button:
```typescript
interface ItemFormProps {
  mode?: 'create' | 'edit';  // Add this
  categories: Category[];
  defaultValues?: Partial<ItemFormData>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;  // Add this
}

export function ItemForm({
  mode = 'create',  // Default to create
  categories,
  defaultValues,
  onSubmit,
  onCancel
}: ItemFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* ... existing form fields ... */}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting
            ? 'Saving...'
            : mode === 'edit'
              ? 'Update Item'
              : 'Save Item'
          }
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
```

### Step 5: Add Edit Button to Detail Page (15 mins)
**File:** `/src/app/items/[id]/page.tsx`

```typescript
import Link from 'next/link';
import { PencilIcon } from 'lucide-react';

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const item = await getItemById(params.id);

  return (
    <main className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{item.name}</h1>
        <Link href={`/items/${item.id}/edit`}>
          <Button variant="default">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Item
          </Button>
        </Link>
      </div>
      {/* ... rest of page ... */}
    </main>
  );
}
```

### Step 6: Create Edit Page (1 hour)
**New File:** `/src/app/items/[id]/edit/page.tsx`

```typescript
import { notFound, redirect } from 'next/navigation';
import { getItemById, getAllCategories, getAllLocations } from '@/db/queries';
import { auth } from '@/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { EditItemForm } from '@/components/items/EditItemForm';

export default async function EditItemPage({
  params
}: {
  params: { id: string }
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const item = await getItemById(params.id);
  if (!item) {
    notFound();
  }

  // Check authorization
  if (session.user.role !== 'ADMIN' && item.userId !== session.user.id) {
    redirect('/items');
  }

  const [categories, locations] = await Promise.all([
    getAllCategories(),
    getAllLocations()
  ]);

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

### Step 7: Create EditItemForm Client Component (45 mins)
**New File:** `/src/components/items/EditItemForm.tsx`

```typescript
'use client'

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ItemForm } from './ItemForm';
import { ItemWithRelations, Category, Location } from '@/types';
import { ItemFormData } from '@/lib/validations';

interface EditItemFormProps {
  item: ItemWithRelations;
  categories: Category[];
  locations: Location[];
}

export function EditItemForm({ item, categories, locations }: EditItemFormProps) {
  const router = useRouter();

  const handleSubmit = async (data: ItemFormData) => {
    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update item');
      }

      toast.success('Item updated successfully');
      router.push(`/items/${item.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update item');
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

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Login as regular user
- [ ] Click edit button on item card (opens modal)
- [ ] Edit item name and quantity
- [ ] Submit form (should update and close modal)
- [ ] Verify changes in list view
- [ ] Click "Edit" button on detail page
- [ ] Navigate to `/items/[id]/edit`
- [ ] Edit multiple fields
- [ ] Click "Update Item" (redirects to detail page)
- [ ] Try editing another user's item (should fail)
- [ ] Test validation errors

### Unit Tests Needed
```typescript
// ItemForm.test.tsx
describe('ItemForm edit mode', () => {
  it('should show "Update Item" button in edit mode');
  it('should pre-fill form with defaultValues');
  it('should track dirty state correctly');
  it('should call onCancel when cancel clicked');
});

// PATCH /api/items/[id]
describe('PATCH /api/items/[id]', () => {
  it('should return 401 for unauthenticated user');
  it('should return 403 for non-owner');
  it('should allow admin to edit any item');
  it('should update item with valid data');
});
```

---

## 🚀 API Usage

### Update Item Request
```typescript
// PATCH /api/items/:id
fetch(`/api/items/${itemId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Name',
    quantity: 10,
    categoryId: 'abc123',
    // Only send fields that changed
  })
})
```

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "item123",
    "name": "Updated Name",
    "quantity": 10,
    "category": {
      "id": "abc123",
      "name": "Tools"
    },
    "location": {
      "id": "loc456",
      "name": "Garage"
    },
    "tags": [],
    "updatedAt": "2024-01-02T10:30:00Z"
  }
}
```

### Error Responses
```json
// 400 - Validation Error
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["name"],
      "message": "Name is required"
    }
  ]
}

// 401 - Unauthorized
{
  "success": false,
  "error": "Unauthorized"
}

// 403 - Forbidden
{
  "success": false,
  "error": "Forbidden"
}

// 404 - Not Found
{
  "success": false,
  "error": "Item not found"
}
```

---

## 📝 Common Issues & Solutions

### Issue: Form doesn't pre-fill
**Solution:** Check defaultValues prop matches form field names exactly

### Issue: "Unauthorized" error
**Solution:** Ensure session is valid and user is authenticated

### Issue: "Forbidden" error
**Solution:** User doesn't own the item. Check userId matches session.user.id

### Issue: Modal doesn't close after submit
**Solution:** Call `onOpenChange(false)` after successful update

### Issue: Changes don't appear in list
**Solution:** Call `router.refresh()` to revalidate server data

---

## 🎨 UI Patterns

### Modal Edit (Quick changes)
✅ Good for: quantity, location, description
✅ Fast interaction
✅ Context preserved
❌ Limited screen space

### Page Edit (Full changes)
✅ Good for: comprehensive updates, images
✅ More screen space
✅ Native back button
❌ More navigation

---

## ⏱️ Estimated Time

| Task | Time | Difficulty |
|------|------|-----------|
| Add authorization | 30 min | Easy |
| Update ItemCard | 30 min | Easy |
| Create EditItemModal | 1 hour | Medium |
| Update ItemForm | 30 min | Easy |
| Add edit button (detail) | 15 min | Easy |
| Create edit page | 1 hour | Medium |
| Create EditItemForm | 45 min | Medium |
| Testing | 2 hours | Medium |
| **TOTAL** | **6-7 hours** | **Medium** |

---

## 📦 Dependencies

Already installed:
- ✅ React Hook Form
- ✅ Zod validation
- ✅ Prisma ORM
- ✅ NextAuth.js
- ✅ Shadcn UI components

No new dependencies needed!

---

## 🔍 Key Files Reference

```
home-inventory/
├── src/
│   ├── app/
│   │   ├── api/items/[id]/route.ts      (UPDATE - add auth)
│   │   └── items/
│   │       ├── [id]/
│   │       │   ├── page.tsx              (UPDATE - add edit button)
│   │       │   └── edit/
│   │       │       └── page.tsx          (NEW)
│   │       └── page.tsx
│   ├── components/
│   │   └── items/
│   │       ├── ItemCard.tsx              (UPDATE)
│   │       ├── ItemForm.tsx              (UPDATE)
│   │       ├── EditItemModal.tsx         (NEW)
│   │       └── EditItemForm.tsx          (NEW)
│   ├── lib/
│   │   └── validations.ts                (exists)
│   └── types/
│       └── item.types.ts                 (exists)
└── docs/
    ├── EDIT_ITEM_ARCHITECTURE.md         (this doc)
    ├── EDIT_ITEM_DIAGRAMS.md
    └── EDIT_ITEM_QUICK_REFERENCE.md
```

---

## ✅ Definition of Done

Feature is complete when:
- [ ] User can edit item from list view modal
- [ ] User can edit item from detail page
- [ ] User can edit item from dedicated edit page
- [ ] Only item owner or admin can edit
- [ ] Form validates input correctly
- [ ] Success/error messages show appropriately
- [ ] Changes persist to database
- [ ] UI updates reflect changes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Screen reader accessible

---

**Next Steps:**
1. Review architecture documents
2. Start with Step 1 (authorization)
3. Work through steps sequentially
4. Test after each step
5. Add tests at the end

**Questions?** See full architecture document for detailed explanations.

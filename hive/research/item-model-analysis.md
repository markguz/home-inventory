# Home Inventory Item Model Analysis

## Research Findings Summary

**Date**: 2025-10-31
**Agent**: Research Specialist
**Task**: Analyze home-inventory project structure for Item model and creation flow

---

## 1. Item Model/Interface Definition

### Primary Location
**File**: `/export/projects/homeinventory/home-inventory/prisma/schema.prisma` (lines 112-141)

### Prisma Schema Definition
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
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  categoryId    String
  category      Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  locationId    String
  location      Location  @relation(fields: [locationId], references: [id], onDelete: Cascade)
  tags          ItemTag[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([categoryId])
  @@index([locationId])
  @@index([name])
}
```

### TypeScript Type Definitions
**File**: `/export/projects/homeinventory/home-inventory/src/types/item.types.ts`

```typescript
// Base Item with relations
export type ItemWithRelations = Item & {
  category: Category;
  location: Location;
  tags: (ItemTag & { tag: Tag })[];
};

// List view item
export type ItemListItem = Item & {
  category: Category;
  location: Location;
  tags: (ItemTag & { tag: Tag })[];
  _count?: {
    tags: number;
  };
};

// Condition enum
export type ItemCondition = 'excellent' | 'good' | 'fair' | 'poor';
```

---

## 2. Item Creation Flow

### A. Server Action (Primary Creation Method)
**File**: `/export/projects/homeinventory/home-inventory/src/app/actions/items.ts` (lines 27-68)

```typescript
export async function createItem(formData: FormData) {
  // 1. Check authentication
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  // 2. Validate input with Zod schema
  const parsed = itemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    categoryId: formData.get('categoryId'),
    location: formData.get('location'),
    quantity: Number(formData.get('quantity')) || 1,
    serialNumber: formData.get('serialNumber') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // 3. Create item with Prisma
  try {
    const result = await prisma.item.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        locationId: parsed.data.locationId,
        quantity: parsed.data.quantity,
        serialNumber: parsed.data.serialNumber,
        notes: parsed.data.notes,
        userId: session.user.id,
      }
    })

    revalidatePath('/items')
    return { success: true, data: result }
  } catch (error) {
    return { error: 'Failed to create item' }
  }
}
```

### B. API Endpoint (Alternative Creation Method)
**File**: `/export/projects/homeinventory/home-inventory/src/app/api/items/route.ts` (lines 78-136)

```typescript
export async function POST(request: NextRequest) {
  // 1. Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse and validate JSON body
  const body = await request.json();
  const { tagIds, ...itemBody } = body;
  const validatedData = itemSchema.parse(itemBody);

  // 3. Create item with optional tags
  const item = await prisma.item.create({
    data: {
      ...validatedData,
      userId: session.user.id,
      ...(tagIds && Array.isArray(tagIds) && {
        tags: {
          create: tagIds.map((tagId: string) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      }),
    },
    include: {
      category: true,
      location: true,
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({ success: true, data: item }, { status: 201 });
}
```

### C. Form Component
**File**: `/export/projects/homeinventory/home-inventory/src/app/items/new/page.tsx`

```typescript
export default async function NewItemPage() {
  const categories = await getAllCategories()

  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createItem(formData)
    if (result.success) {
      redirect('/items')
    }
  }

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <Breadcrumbs />
      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemForm categories={categories} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </main>
  )
}
```

---

## 3. Item Fields

### Required Fields
- **name**: `String` - Item name (max 200 chars)
- **categoryId**: `String` - Foreign key to Category
- **locationId**: `String` - Foreign key to Location
- **userId**: `String` - Foreign key to User (auto-assigned)

### Optional Fields
- **description**: `String?` - Detailed description
- **quantity**: `Int` (default: 1) - Current quantity
- **minQuantity**: `Int?` - Alert threshold for low stock
- **serialNumber**: `String?` - Product serial number (max 100 chars)
- **notes**: `String?` - Additional notes
- **purchaseDate**: `DateTime?` - When item was purchased
- **purchasePrice**: `Float?` - Original purchase price
- **currentValue**: `Float?` - Current estimated value
- **condition**: `String?` (default: "good") - Item condition
- **imageUrl**: `String?` - URL to item image
- **barcode**: `String?` - Product barcode
- **warrantyUntil**: `DateTime?` - Warranty expiration date

### Timestamp Fields (Auto-managed)
- **createdAt**: `DateTime` - Creation timestamp
- **updatedAt**: `DateTime` - Last update timestamp

### Relations
- **category**: Many-to-One with Category (required)
- **location**: Many-to-One with Location (required)
- **user**: Many-to-One with User (required)
- **tags**: Many-to-Many with Tag through ItemTag

---

## 4. Data Storage Architecture

### Database Type
- **Provider**: SQLite (via Prisma ORM)
- **Location**: Configured via `DATABASE_URL` environment variable
- **Schema Management**: Prisma migrations

### Key Database Features
1. **Indexes**:
   - `userId` - Fast user-specific queries
   - `categoryId` - Category filtering
   - `locationId` - Location filtering
   - `name` - Search optimization

2. **Cascading Deletes**:
   - When User is deleted → all Items deleted
   - When Category is deleted → all Items deleted
   - When Location is deleted → all Items deleted
   - When Item is deleted → all ItemTag relations deleted

3. **ID Generation**: Uses `cuid()` for globally unique identifiers

### Data Access Layer
**File**: `/export/projects/homeinventory/home-inventory/src/db/queries.ts`

Key query functions:
- `getAllItems()` - Fetch all items with relations
- `getItemById(id)` - Fetch single item with full details
- `getItemsByCategory(categoryId)` - Filter by category
- `searchItems(query)` - Full-text search
- `getRecentItems(limit)` - Latest items

---

## 5. Form Management

### Form Component
**File**: `/export/projects/homeinventory/home-inventory/src/components/items/ItemForm.tsx`

**Technology Stack**:
- **react-hook-form**: Form state management
- **zod**: Runtime validation via `zodResolver`

**Form Fields Displayed**:
1. **name** (required) - Text input
2. **description** (optional) - Textarea
3. **categoryId** (required) - Select dropdown
4. **locationId** (required) - Text input (needs improvement - should be dropdown)
5. **quantity** (required, default: 1) - Number input
6. **minQuantity** (optional) - Number input for alerts
7. **serialNumber** (optional) - Text input
8. **notes** (optional) - Textarea

**Current Limitations**:
- Location field uses text input instead of dropdown (UX issue)
- No support for tags in the form
- Missing optional fields: purchaseDate, purchasePrice, condition, imageUrl, etc.

### Validation Schema
**File**: `/export/projects/homeinventory/home-inventory/src/lib/validations.ts`

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

export type ItemFormData = z.infer<typeof itemSchema>
```

---

## Key Patterns & Architecture

### 1. Authentication & Authorization
- All item operations require authentication via NextAuth
- Row-level security: Users can only see their own items (unless ADMIN)
- Session checked in both server actions and API routes

### 2. Validation Strategy
- **Client-side**: Zod schema via react-hook-form
- **Server-side**: Same Zod schema in server actions/API routes
- **Database**: Prisma schema enforces constraints

### 3. Data Flow
```
User Input → ItemForm (client)
  ↓ (react-hook-form validation)
FormData → createItem() server action
  ↓ (Zod validation)
Prisma ORM → SQLite database
  ↓ (revalidatePath)
UI refresh with new data
```

### 4. API Design
- **Server Actions**: Primary method for form submissions
- **REST API**: Alternative for external/programmatic access
- Both methods use same validation and business logic

---

## Recommendations

### Immediate Improvements Needed
1. **Location Field**: Convert text input to dropdown with available locations
2. **Tag Support**: Add multi-select for tags in ItemForm
3. **Optional Fields**: Expose purchaseDate, purchasePrice, condition, imageUrl in form
4. **Error Handling**: Improve user feedback for validation errors

### Architecture Strengths
✅ Strong type safety with Prisma + Zod
✅ Consistent validation across client/server
✅ Good separation of concerns
✅ Proper authentication/authorization
✅ Cascading deletes prevent orphaned records

### Potential Issues
⚠️ ItemForm has hardcoded locationId text input instead of Location dropdown
⚠️ Missing helper function `findOrCreateLocation()` referenced in actions but unused
⚠️ No image upload functionality despite imageUrl field in schema
⚠️ No barcode scanning despite barcode field

---

## Files Referenced

| File | Purpose |
|------|---------|
| `/prisma/schema.prisma` | Database schema definition |
| `/src/types/item.types.ts` | TypeScript type definitions |
| `/src/lib/validations.ts` | Zod validation schemas |
| `/src/app/actions/items.ts` | Server actions for CRUD operations |
| `/src/app/api/items/route.ts` | REST API endpoints |
| `/src/components/items/ItemForm.tsx` | Form component |
| `/src/app/items/new/page.tsx` | Add item page |
| `/src/db/queries.ts` | Database query functions |

---

**Analysis Complete** ✓
**Stored in**: `/hive/research/item-model-analysis.md`

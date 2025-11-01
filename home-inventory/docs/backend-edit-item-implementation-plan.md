# Backend Implementation Plan: Edit Item Feature

## Executive Summary

**Project**: Home Inventory Management System
**Framework**: Next.js 15 App Router with TypeScript
**Database**: Prisma ORM with SQLite
**Authentication**: NextAuth.js v5
**Validation**: Zod schemas
**Date**: 2025-10-31

## Current Architecture Analysis

### 1. Framework & Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Server Components + Server Actions
- **ORM**: Prisma Client v6.17.1
- **Database**: SQLite (production-ready schema)
- **Validation**: Zod v3.x
- **Authentication**: NextAuth.js v5 (JWT strategy)
- **API Pattern**: Next.js API Routes (App Router)

### 2. Existing API Structure

#### Current API Routes:
```
/api/items/
├── route.ts              # GET (list), POST (create)
└── [id]/
    └── route.ts          # GET (single), PATCH (update), DELETE
```

#### Existing Endpoints:
✅ **GET /api/items** - List items with pagination, filtering
✅ **POST /api/items** - Create new item
✅ **GET /api/items/:id** - Get single item
✅ **PATCH /api/items/:id** - Update item (ALREADY IMPLEMENTED!)
✅ **DELETE /api/items/:id** - Delete item

### 3. Database Schema (Prisma)

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
  userId        String    # Owner reference
  categoryId    String    # Required foreign key
  locationId    String    # Required foreign key
  tags          ItemTag[] # Many-to-many relation
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  # Relations
  user     User     @relation(...)
  category Category @relation(...)
  location Location @relation(...)
}
```

### 4. Validation Schema

```typescript
// /src/lib/validations.ts
export const itemUpdateSchema = itemSchema.partial().extend({
  id: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
})

// Base item schema
export const itemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  categoryId: z.string().min(1),
  locationId: z.string().min(1),
  quantity: z.number().int().min(0),
  minQuantity: z.number().int().min(0).optional(),
  serialNumber: z.string().max(100).optional(),
  notes: z.string().optional(),
})
```

## Implementation Status

### ✅ ALREADY IMPLEMENTED

The **PATCH /api/items/:id** endpoint is **FULLY IMPLEMENTED** in:
- **File**: `/src/app/api/items/[id]/route.ts`
- **Lines**: 42-101

#### Current Implementation Features:

1. **Request Handling**:
   - Accepts JSON body with partial updates
   - Uses async/await for promise handling
   - Validates item ID from URL params

2. **Validation**:
   - Uses `itemUpdateSchema` from Zod
   - All fields are optional (partial update)
   - Validates data types and constraints

3. **Database Operations**:
   - Prisma ORM for type-safe updates
   - Includes related data (category, location, tags)
   - Atomic tag updates (delete old, create new)

4. **Tag Management**:
   - Deletes all existing tags
   - Creates new tag associations
   - Handles many-to-many relationship

5. **Error Handling**:
   - Zod validation errors (400)
   - Generic errors (500)
   - Structured error responses

6. **Response Format**:
   ```typescript
   {
     success: boolean,
     data?: ItemWithRelations,
     error?: string,
     details?: ZodIssue[]
   }
   ```

### ⚠️ MISSING FEATURES (Enhancement Opportunities)

The current implementation lacks these security and business logic features:

#### 1. **Authentication Check** ❌
```typescript
// MISSING: User authentication
const session = await auth();
if (!session?.user) {
  return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
  );
}
```

#### 2. **Authorization Check** ❌
```typescript
// MISSING: Ownership verification
const existingItem = await prisma.item.findUnique({
  where: { id },
  select: { userId: true }
});

if (existingItem?.userId !== session.user.id &&
    session.user.role !== 'ADMIN') {
  return NextResponse.json(
    { success: false, error: 'Forbidden' },
    { status: 403 }
  );
}
```

#### 3. **Item Existence Check** ❌
```typescript
// MISSING: 404 handling before update
if (!existingItem) {
  return NextResponse.json(
    { success: false, error: 'Item not found' },
    { status: 404 }
  );
}
```

#### 4. **Audit Logging** ❌
```typescript
// MISSING: Track who changed what
console.log('Item updated:', {
  itemId: id,
  userId: session.user.id,
  timestamp: new Date(),
  changes: Object.keys(dataToUpdate)
});
```

#### 5. **Race Condition Protection** ❌
```typescript
// MISSING: Optimistic locking
// Could add version field or use Prisma transactions
```

#### 6. **Related Data Validation** ❌
```typescript
// MISSING: Verify categoryId and locationId exist
if (updateData.categoryId) {
  const categoryExists = await prisma.category.findUnique({
    where: { id: updateData.categoryId }
  });
  if (!categoryExists) {
    return NextResponse.json(
      { success: false, error: 'Invalid category' },
      { status: 400 }
    );
  }
}
```

## Required Enhancements

### Priority 1: Security (CRITICAL)

1. **Add Authentication Middleware**
   - Location: `/src/app/api/items/[id]/route.ts`
   - Add session check at start of PATCH handler
   - Return 401 if not authenticated

2. **Add Authorization Check**
   - Verify user owns the item OR is admin
   - Return 403 if unauthorized

3. **Add Item Existence Verification**
   - Check item exists before attempting update
   - Return 404 if not found

### Priority 2: Data Integrity (HIGH)

1. **Validate Foreign Keys**
   - Verify categoryId exists in Category table
   - Verify locationId exists in Location table
   - Verify all tagIds exist in Tag table

2. **Add Business Rules**
   - Prevent quantity from going negative
   - Validate date ranges (e.g., purchaseDate < warrantyUntil)
   - Enforce minimum quantity alerts

### Priority 3: Developer Experience (MEDIUM)

1. **Improve Error Messages**
   - More specific validation errors
   - Include field names in error responses
   - Add error codes for client handling

2. **Add Request Logging**
   - Log all update attempts
   - Track failed updates for monitoring
   - Add performance metrics

3. **Add Response Metadata**
   - Include timestamp in response
   - Add request ID for tracing
   - Return updated field list

### Priority 4: Optimization (LOW)

1. **Reduce Database Queries**
   - Combine checks into single query
   - Use `select` to limit returned fields
   - Implement caching for categories/locations

2. **Add Batch Update Support**
   - Allow updating multiple items
   - Use Prisma transactions

## Implementation Roadmap

### Phase 1: Security Hardening (IMMEDIATE)
**Files to Modify**: `/src/app/api/items/[id]/route.ts`

```typescript
// Add to PATCH handler (after line 45)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. Verify item exists and check ownership
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    if (existingItem.userId !== session.user.id &&
        session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 3. Continue with existing validation and update logic...
    const body = await request.json();
    // ... rest of existing code
  } catch (error) {
    // ... existing error handling
  }
}
```

### Phase 2: Validation Enhancement (SAME SESSION)
**Files to Modify**: `/src/app/api/items/[id]/route.ts`

```typescript
// Add before Prisma update
if (updateData.categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: updateData.categoryId }
  });
  if (!category) {
    return NextResponse.json(
      { success: false, error: 'Invalid category ID' },
      { status: 400 }
    );
  }
}

if (updateData.locationId) {
  const location = await prisma.location.findUnique({
    where: { id: updateData.locationId }
  });
  if (!location) {
    return NextResponse.json(
      { success: false, error: 'Invalid location ID' },
      { status: 400 }
    );
  }
}

if (tagIds && tagIds.length > 0) {
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } }
  });
  if (tags.length !== tagIds.length) {
    return NextResponse.json(
      { success: false, error: 'One or more invalid tag IDs' },
      { status: 400 }
    );
  }
}
```

### Phase 3: Testing Strategy (NEXT SESSION)
**Files to Create**: `/tests/api/items-update.test.ts`

```typescript
describe('PATCH /api/items/:id', () => {
  describe('Authentication', () => {
    it('should return 401 without session');
    it('should return 403 for non-owner');
    it('should allow admin to update any item');
  });

  describe('Validation', () => {
    it('should reject invalid item ID');
    it('should reject invalid category ID');
    it('should reject invalid location ID');
    it('should reject invalid tag IDs');
    it('should validate field types');
  });

  describe('Update Operations', () => {
    it('should update single field');
    it('should update multiple fields');
    it('should update tags');
    it('should handle partial updates');
  });

  describe('Error Handling', () => {
    it('should handle database errors');
    it('should handle validation errors');
    it('should handle concurrent updates');
  });
});
```

## Server Actions Alternative

The codebase also has **Server Actions** in `/src/app/actions/items.ts`:

```typescript
// Existing server action
export async function updateItem(id: string, formData: FormData)
```

### Server Action vs API Route

**Current Setup**:
- **API Routes**: Used by client components (fetch/axios)
- **Server Actions**: Used by server components (form actions)

**Recommendation**:
- Keep both patterns for flexibility
- Add same security checks to server action
- Share validation logic between both

## Testing Requirements

### Unit Tests
1. Validation schema tests
2. Authorization logic tests
3. Business rule tests

### Integration Tests
1. Full PATCH request flow
2. Database transaction tests
3. Error scenario tests

### E2E Tests
1. Edit item form submission
2. Multi-field update
3. Tag management
4. Error message display

## Performance Considerations

### Current Performance:
- Single database update operation
- Includes related data (N+1 query concern)
- No caching implemented

### Optimization Opportunities:
1. Add Redis caching for categories/locations
2. Use Prisma `select` to limit returned fields
3. Implement request rate limiting
4. Add database connection pooling

## Security Checklist

- [x] Input validation (Zod schemas)
- [ ] Authentication check (NextAuth session)
- [ ] Authorization check (ownership/admin)
- [ ] SQL injection protection (Prisma ORM)
- [ ] XSS protection (auto-escaped responses)
- [ ] CSRF protection (NextAuth built-in)
- [ ] Rate limiting (to be added)
- [ ] Audit logging (to be added)

## Deployment Considerations

### Environment Variables Required:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3001"
```

### Database Migrations:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed
```

## API Documentation

### PATCH /api/items/:id

**Description**: Update an existing item with partial data

**Authentication**: Required (NextAuth session)

**Authorization**: Item owner or ADMIN role

**Request**:
```typescript
PATCH /api/items/cm3d2knfb0002qxkq0h5gvrv6
Content-Type: application/json

{
  "name": "Updated Item Name",
  "quantity": 5,
  "categoryId": "cm3d2...",
  "locationId": "cm3d2...",
  "tagIds": ["tag1", "tag2"],
  "notes": "Additional notes"
}
```

**Success Response** (200):
```typescript
{
  "success": true,
  "data": {
    "id": "cm3d2knfb0002qxkq0h5gvrv6",
    "name": "Updated Item Name",
    "description": "...",
    "quantity": 5,
    "category": { "id": "...", "name": "..." },
    "location": { "id": "...", "name": "..." },
    "tags": [
      { "id": "...", "tag": { "name": "..." } }
    ],
    "createdAt": "2024-...",
    "updatedAt": "2024-..."
  }
}
```

**Error Responses**:
- **401 Unauthorized**: No active session
- **403 Forbidden**: User doesn't own item
- **404 Not Found**: Item doesn't exist
- **400 Bad Request**: Validation error
- **500 Internal Server Error**: Database error

**Validation Rules**:
- All fields are optional (partial update)
- `name`: 1-200 characters
- `quantity`: Non-negative integer
- `categoryId`: Must exist in database
- `locationId`: Must exist in database
- `tagIds`: All must exist in database

## Next Steps

### Immediate Actions (This Session):
1. Add authentication check to PATCH endpoint
2. Add authorization (ownership) check
3. Add item existence verification
4. Add foreign key validation
5. Write unit tests for new security logic

### Follow-up Tasks (Next Session):
1. Implement audit logging
2. Add rate limiting middleware
3. Create comprehensive E2E tests
4. Update API documentation
5. Add monitoring/alerting

## Team Coordination

### Coordination via Hooks:
```bash
# Notify team of backend changes
npx claude-flow@alpha hooks notify --message "Enhanced PATCH /api/items/:id with auth/authz checks"

# Store implementation details in memory
npx claude-flow@alpha hooks post-edit \
  --file "/src/app/api/items/[id]/route.ts" \
  --memory-key "backend/items/update-endpoint"

# Update task status
npx claude-flow@alpha hooks post-task \
  --task-id "edit-item-backend" \
  --status "enhanced"
```

### Dependencies:
- **Frontend**: Can use existing endpoint, will need to handle new 401/403 responses
- **Testing**: Needs mock authentication for tests
- **Documentation**: Update API docs with security requirements

## Conclusion

The **PATCH /api/items/:id endpoint is already implemented** with solid functionality. The primary gaps are **security features** (authentication, authorization, existence checks).

**Recommended approach**: Enhance existing implementation with security features before writing tests.

**Estimated effort**:
- Security enhancements: 2 hours
- Validation enhancements: 1 hour
- Testing: 3 hours
- **Total**: 6 hours

**Risk level**: LOW (endpoint exists, adding defensive checks)

**Breaking changes**: NONE (only adding validation, not changing interface)

# Receipt Processor Item Creation Fix

## Problem Summary

The receipt processor was failing to create items due to a schema mismatch between the validation layer and the database model.

### Root Causes

1. **Schema Mismatch**: `itemSchema` in `/src/lib/validations.ts` was validating `location` as a STRING (location name), but Prisma's Item model requires `locationId` (UUID) to establish a relation with the Location model.

2. **Missing Location Fetch**: The ReceiptProcessor component was hardcoding `location: 'Pantry'` instead of fetching an actual location ID from the database.

3. **Data Flow Issue**: The API endpoint receives data validated by itemSchema, but the validated data didn't match what Prisma expected for creating an Item record.

## Changes Made

### 1. Updated Validation Schema (`/src/lib/validations.ts`)

**Before:**
```typescript
export const itemSchema = z.object({
  // ...
  location: z.string().min(1, 'Location is required').max(200),
  // ...
})
```

**After:**
```typescript
export const itemSchema = z.object({
  // ...
  locationId: z.string().min(1, 'Location is required'),
  // ...
})
```

This ensures the validation layer expects `locationId` (UUID) instead of `location` (string name).

### 2. Added Location Fetch Helper (`/src/features/receipt-processing/components/ReceiptProcessor.tsx`)

Added three new functions mirroring the category fetch pattern:

```typescript
interface Location {
  id: string;
  name: string;
}

/**
 * Fetch available locations from the API
 */
async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch('/api/locations');
    if (!response.ok) {
      throw new Error('Failed to fetch locations');
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

/**
 * Find or get a default location
 * Prefers 'Pantry' if available, otherwise uses first location
 */
async function getDefaultLocation(): Promise<string | null> {
  try {
    const locations = await fetchLocations();
    if (locations.length === 0) {
      console.warn('No locations available');
      return null;
    }
    // Try to find a Pantry location, otherwise use first location
    const pantryLocation = locations.find((l) =>
      l.name.toLowerCase().includes('pantry')
    );
    return (pantryLocation || locations[0])?.id || null;
  } catch (error) {
    console.error('Error getting default location:', error);
    return null;
  }
}
```

### 3. Updated handleItemsConfirmed Function

**Before:**
```typescript
// Get default category before processing items
const categoryId = await getDefaultCategory();
if (!categoryId) {
  toast.error('No categories available...');
  return;
}

// ... then in the fetch call:
body: JSON.stringify({
  name: item.name,
  quantity: item.quantity,
  categoryId,
  location: 'Pantry', // ❌ Wrong: string instead of UUID
  description: '...',
})
```

**After:**
```typescript
// Get default category and location before processing items
const [categoryId, locationId] = await Promise.all([
  getDefaultCategory(),
  getDefaultLocation(),
]);

if (!categoryId) {
  toast.error('No categories available...');
  return;
}

if (!locationId) {
  toast.error('No locations available...');
  return;
}

// ... then in the fetch call:
body: JSON.stringify({
  name: item.name,
  quantity: item.quantity,
  categoryId,      // ✅ UUID from database
  locationId,      // ✅ UUID from database
  description: '...',
})
```

## Data Flow (After Fix)

1. **Receipt Upload** → User uploads receipt image
2. **OCR Processing** → Extract items with names, quantities, prices
3. **Review Stage** → User confirms/edits extracted items
4. **Fetch Prerequisites**:
   - `GET /api/categories` → Find "Groceries" category or use first available
   - `GET /api/locations` → Find "Pantry" location or use first available
5. **Item Creation Loop**:
   - For each item: `POST /api/items` with:
     ```json
     {
       "name": "Milk",
       "quantity": 2,
       "categoryId": "clxxx123...",  // UUID
       "locationId": "clyyy456...",   // UUID
       "description": "From receipt - Walmart - Confidence: 95%"
     }
     ```
6. **Validation** → `itemSchema` validates all fields including `locationId`
7. **Prisma Creation** → Item is created with proper foreign key relationships:
   ```typescript
   await prisma.item.create({
     data: {
       ...validatedData,  // includes locationId
       userId: session.user.id,
     }
   })
   ```

## Required Database State

For the receipt processor to work, the database must have:

1. **At least one Category** (preferably named "Groceries")
2. **At least one Location** (preferably named "Pantry")
3. **Authenticated user session** (userId is captured from auth session)

If either categories or locations are missing, the user will receive a helpful error message directing them to create them in settings.

## Testing Checklist

- [ ] Verify categories exist in database
- [ ] Verify locations exist in database
- [ ] Upload a receipt image
- [ ] Confirm extracted items appear in review
- [ ] Click "Add to Inventory"
- [ ] Verify success toast appears
- [ ] Check database that items were created with proper categoryId and locationId
- [ ] Verify items appear in /items page

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/categories` | GET | Fetch available categories |
| `/api/locations` | GET | Fetch available locations |
| `/api/items` | POST | Create individual item |

## Files Modified

1. `/src/lib/validations.ts` - Changed `location: string` to `locationId: string`
2. `/src/features/receipt-processing/components/ReceiptProcessor.tsx` - Added location fetching and proper locationId usage

## Prisma Schema Reference

```prisma
model Item {
  id            String    @id @default(cuid())
  name          String
  quantity      Int       @default(1)
  description   String?

  // Required foreign keys
  userId        String
  user          User      @relation(fields: [userId], references: [id])

  categoryId    String
  category      Category  @relation(fields: [categoryId], references: [id])

  locationId    String
  location      Location  @relation(fields: [locationId], references: [id])

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

All three foreign keys (userId, categoryId, locationId) must be valid UUIDs pointing to existing records.

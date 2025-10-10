# API Endpoints and Server Actions

Complete reference for all API endpoints in the Home Inventory System.

## Items API

Base path: `/api/items`

### GET /api/items

Retrieve a paginated list of items.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Items per page (max 100) |
| categoryId | string (CUID) | No | - | Filter by category |
| locationId | string (CUID) | No | - | Filter by location |
| sortBy | string | No | createdAt | Sort field (name, createdAt, updatedAt, purchasePrice, currentValue) |
| sortOrder | string | No | desc | Sort order (asc, desc) |

**Example Request:**

```bash
GET /api/items?page=1&limit=20&categoryId=abc123&sortBy=name&sortOrder=asc
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clh1234567890",
      "name": "Samsung 65-inch TV",
      "description": "4K Smart TV",
      "quantity": 1,
      "purchaseDate": "2024-01-15T00:00:00.000Z",
      "purchasePrice": 1299.99,
      "currentValue": 1100.00,
      "condition": "excellent",
      "notes": "Mounted in living room",
      "imageUrl": "https://...",
      "barcode": "1234567890123",
      "serialNumber": "SN123456",
      "warrantyUntil": "2026-01-15T00:00:00.000Z",
      "categoryId": "clh0987654321",
      "locationId": "clh1122334455",
      "category": {
        "id": "clh0987654321",
        "name": "Electronics",
        "icon": "tv",
        "color": "#3B82F6"
      },
      "location": {
        "id": "clh1122334455",
        "name": "Living Room"
      },
      "tags": [
        {
          "tag": {
            "id": "clh5566778899",
            "name": "high-value",
            "color": "#EF4444"
          }
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### GET /api/items/[id]

Get a single item by ID.

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (CUID) | Yes | Item ID |

**Example Request:**

```bash
GET /api/items/clh1234567890
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clh1234567890",
    "name": "Samsung 65-inch TV",
    // ... full item details
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Item not found"
}
```

### POST /api/items

Create a new item.

**Request Body:**

```json
{
  "name": "Samsung 65-inch TV",
  "description": "4K Smart TV with HDR",
  "quantity": 1,
  "purchaseDate": "2024-01-15T00:00:00.000Z",
  "purchasePrice": 1299.99,
  "currentValue": 1299.99,
  "condition": "excellent",
  "notes": "Purchased on sale",
  "imageUrl": "https://...",
  "barcode": "1234567890123",
  "serialNumber": "SN123456",
  "warrantyUntil": "2026-01-15T00:00:00.000Z",
  "categoryId": "clh0987654321",
  "locationId": "clh1122334455",
  "tagIds": ["clh5566778899"]
}
```

**Required Fields:**
- `name` (string, 1-100 chars)
- `categoryId` (CUID)
- `locationId` (CUID)

**Optional Fields:**
- `description` (string, max 500 chars)
- `quantity` (integer, min 0, default 1)
- `purchaseDate` (ISO 8601 datetime)
- `purchasePrice` (number, min 0)
- `currentValue` (number, min 0)
- `condition` (enum: excellent, good, fair, poor, default: good)
- `notes` (string, max 1000 chars)
- `imageUrl` (valid URL)
- `barcode` (string, max 50 chars)
- `serialNumber` (string, max 100 chars)
- `warrantyUntil` (ISO 8601 datetime)
- `tagIds` (array of CUIDs)

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "clh1234567890",
    "name": "Samsung 65-inch TV",
    // ... full item details including relations
  }
}
```

**Validation Error (400):**

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["name"],
      "message": "Name is required"
    }
  ]
}
```

### PUT /api/items/[id]

Update an existing item.

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (CUID) | Yes | Item ID |

**Request Body:**

Partial update supported - include only fields to update:

```json
{
  "name": "Samsung 65-inch 4K TV",
  "currentValue": 1100.00,
  "condition": "good"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    // ... updated item details
  }
}
```

### DELETE /api/items/[id]

Delete an item.

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (CUID) | Yes | Item ID |

**Response (200):**

```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

## Categories API

Base path: `/api/categories`

### GET /api/categories

List all categories.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clh0987654321",
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "icon": "tv",
      "color": "#3B82F6",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "items": 45
      }
    }
  ]
}
```

### POST /api/categories

Create a category.

**Request Body:**

```json
{
  "name": "Electronics",
  "description": "Electronic devices",
  "icon": "tv",
  "color": "#3B82F6"
}
```

**Required:**
- `name` (string, 1-50 chars, unique)

**Optional:**
- `description` (string, max 200 chars)
- `icon` (string, max 50 chars)
- `color` (hex color code, e.g., #3B82F6)

## Locations API

Base path: `/api/locations`

### GET /api/locations

List all locations with hierarchy.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clh1122334455",
      "name": "House",
      "description": "Main residence",
      "parentId": null,
      "children": [
        {
          "id": "clh2233445566",
          "name": "Living Room",
          "parentId": "clh1122334455"
        }
      ],
      "_count": {
        "items": 120
      }
    }
  ]
}
```

### POST /api/locations

Create a location.

**Request Body:**

```json
{
  "name": "Living Room",
  "description": "Main living area",
  "parentId": "clh1122334455"
}
```

**Required:**
- `name` (string, 1-100 chars, unique)

**Optional:**
- `description` (string, max 200 chars)
- `parentId` (CUID, for nested locations)

## Tags API

Base path: `/api/tags`

### GET /api/tags

List all tags.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clh5566778899",
      "name": "high-value",
      "color": "#EF4444",
      "_count": {
        "itemTags": 23
      }
    }
  ]
}
```

### POST /api/tags

Create a tag.

**Request Body:**

```json
{
  "name": "high-value",
  "color": "#EF4444"
}
```

**Required:**
- `name` (string, 1-30 chars, unique)

**Optional:**
- `color` (hex color code)

## Search API

Base path: `/api/search`

### GET /api/search

Advanced search with multiple filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search term (1-100 chars) |
| categoryId | string (CUID) | No | Filter by category |
| locationId | string (CUID) | No | Filter by location |
| tagIds | array of CUIDs | No | Filter by tags (comma-separated) |
| minValue | number | No | Minimum current value |
| maxValue | number | No | Maximum current value |
| condition | string | No | Filter by condition (excellent, good, fair, poor) |
| sortBy | string | No | Sort field (default: name) |
| sortOrder | string | No | Sort order (asc, desc, default: asc) |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20, max: 100) |

**Example Request:**

```bash
GET /api/search?query=samsung&categoryId=clh123&minValue=500&sortBy=currentValue&sortOrder=desc
```

**Response:**

```json
{
  "success": true,
  "data": [
    // ... matching items with full relations
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

## Error Handling

All endpoints follow consistent error handling:

### 400 Bad Request

```json
{
  "success": false,
  "error": "Validation error",
  "details": [ /* Zod validation errors */ ]
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error"
}
```

## TypeScript Types

All endpoints have corresponding TypeScript types generated from Zod schemas:

```typescript
import { ItemFormData, ItemUpdateData } from '@/lib/validations';
import { Item, Category, Location, Tag } from '@prisma/client';
```

## Rate Limiting

Currently no rate limiting. For production, implement:

```typescript
// Example rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## See Also

- [API Overview](overview.md)
- [Database Schema](../architecture/database-schema.md)
- [Development Guide](../development/setup.md)

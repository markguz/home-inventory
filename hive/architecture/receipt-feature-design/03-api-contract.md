# API Contract Specification - Receipt Processing

## Base URL
```
Production: https://yourdomain.com/api
Development: http://localhost:3000/api
```

## Authentication
All endpoints require authentication via Supabase JWT token in Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Rate Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /receipts/upload | 10 requests | 1 minute |
| POST /receipts/process | 5 requests | 1 minute |
| POST /receipts | 30 requests | 1 minute |
| Other endpoints | 60 requests | 1 minute |

Rate limit headers returned:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1697385600
```

---

## Endpoints

### 1. Upload Receipt Image

**POST** `/api/receipts/upload`

Upload a receipt image for temporary storage before processing.

#### Request
```http
POST /api/receipts/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
  image: <binary file data>
```

**Form Fields:**
- `image` (required): Image file (JPEG, PNG)
  - Max size: 10 MB
  - Recommended: < 2 MB for faster processing

#### Response - Success (201 Created)
```json
{
  "success": true,
  "data": {
    "receiptId": "550e8400-e29b-41d4-a716-446655440000",
    "imageUrl": "https://storage.example.com/receipts-temp/user123/receipt.jpg?signed=...",
    "expiresAt": "2025-10-16T14:30:00Z",
    "uploadedAt": "2025-10-15T14:30:00Z"
  }
}
```

#### Response - Error (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPEG and PNG images are supported",
    "details": {
      "receivedType": "application/pdf",
      "allowedTypes": ["image/jpeg", "image/png"]
    }
  }
}
```

#### Response - Error (413 Payload Too Large)
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Image size exceeds maximum allowed",
    "details": {
      "maxSize": 10485760,
      "receivedSize": 15728640
    }
  }
}
```

---

### 2. Process Receipt (Server-Side OCR - Optional)

**POST** `/api/receipts/process`

Fallback server-side OCR processing for receipts that fail client-side processing.

#### Request
```http
POST /api/receipts/process
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "receiptId": "550e8400-e29b-41d4-a716-446655440000"
}
```

OR send image directly:
```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

#### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "merchantName": "Whole Foods Market",
    "receiptDate": "2025-10-15",
    "totalAmount": 67.43,
    "confidence": 0.87,
    "rawOcrText": "WHOLE FOODS MARKET\n123 Main St...",
    "extractedItems": [
      {
        "name": "Organic Bananas",
        "quantity": 2,
        "unitPrice": 1.99,
        "totalPrice": 3.98,
        "confidence": 0.92,
        "boundingBox": {"x": 45, "y": 120, "width": 200, "height": 25},
        "rawText": "2 Organic Bananas @ $1.99 ea"
      },
      {
        "name": "Almond Milk",
        "quantity": 1,
        "unitPrice": 4.99,
        "totalPrice": 4.99,
        "confidence": 0.85,
        "boundingBox": {"x": 45, "y": 150, "width": 180, "height": 25},
        "rawText": "Almond Milk $4.99"
      }
    ]
  }
}
```

#### Response - Error (422 Unprocessable Entity)
```json
{
  "success": false,
  "error": {
    "code": "OCR_FAILED",
    "message": "Unable to extract text from image",
    "details": {
      "reason": "Image quality too low",
      "suggestions": [
        "Ensure receipt is well-lit",
        "Avoid shadows and glare",
        "Keep camera steady"
      ]
    }
  }
}
```

---

### 3. Create Draft Receipt

**POST** `/api/receipts`

Save a draft receipt with extracted items for user review.

#### Request
```http
POST /api/receipts
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "merchantName": "Whole Foods Market",
  "receiptDate": "2025-10-15",
  "totalAmount": 67.43,
  "imageUrl": "https://storage.example.com/receipts-temp/...",
  "rawOcrText": "WHOLE FOODS MARKET\n...",
  "confidence": 0.87,
  "extractedItems": [
    {
      "name": "Organic Bananas",
      "quantity": 2,
      "unitPrice": 1.99,
      "totalPrice": 3.98,
      "confidence": 0.92,
      "boundingBox": {"x": 45, "y": 120, "width": 200, "height": 25},
      "rawText": "2 Organic Bananas @ $1.99 ea"
    }
  ]
}
```

**Field Requirements:**
- `merchantName` (optional): string, max 255 chars
- `receiptDate` (optional): ISO 8601 date string
- `totalAmount` (optional): number, decimal(10,2)
- `imageUrl` (optional): string, max 500 chars
- `rawOcrText` (optional): string, for debugging
- `confidence` (optional): number, 0.0-1.0
- `extractedItems` (required): array, min 1 item
  - Each item requires: `name` (string)
  - Optional: `quantity`, `unitPrice`, `totalPrice`, `confidence`, `boundingBox`, `rawText`

#### Response - Success (201 Created)
```json
{
  "success": true,
  "data": {
    "receipt": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "merchantName": "Whole Foods Market",
      "receiptDate": "2025-10-15",
      "totalAmount": 67.43,
      "processingStatus": "draft",
      "confidence": 0.87,
      "imageUrl": "https://storage.example.com/...",
      "imageExpiresAt": "2025-10-16T14:30:00Z",
      "createdAt": "2025-10-15T14:30:00Z",
      "updatedAt": "2025-10-15T14:30:00Z"
    },
    "extractedItems": [
      {
        "id": "item-uuid-1",
        "receiptId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Organic Bananas",
        "quantity": 2,
        "unitPrice": 1.99,
        "totalPrice": 3.98,
        "confidence": 0.92,
        "status": "pending",
        "createdAt": "2025-10-15T14:30:00Z"
      }
    ]
  }
}
```

#### Response - Error (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid receipt data",
    "details": {
      "extractedItems": "At least one item is required"
    }
  }
}
```

---

### 4. Get Receipt Details

**GET** `/api/receipts/:id`

Retrieve a specific receipt with all extracted items.

#### Request
```http
GET /api/receipts/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

#### Query Parameters
- `includeItems` (optional): boolean, default true
- `includeRawText` (optional): boolean, default false

#### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "receipt": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "merchantName": "Whole Foods Market",
      "receiptDate": "2025-10-15",
      "totalAmount": 67.43,
      "processingStatus": "draft",
      "confidence": 0.87,
      "imageUrl": "https://storage.example.com/...",
      "imageExpiresAt": "2025-10-16T14:30:00Z",
      "createdAt": "2025-10-15T14:30:00Z",
      "updatedAt": "2025-10-15T14:30:00Z"
    },
    "extractedItems": [
      {
        "id": "item-uuid-1",
        "receiptId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Organic Bananas",
        "quantity": 2,
        "unitPrice": 1.99,
        "totalPrice": 3.98,
        "confidence": 0.92,
        "status": "pending",
        "createdAt": "2025-10-15T14:30:00Z"
      }
    ]
  }
}
```

#### Response - Error (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "RECEIPT_NOT_FOUND",
    "message": "Receipt not found or access denied"
  }
}
```

---

### 5. Update Receipt

**PATCH** `/api/receipts/:id`

Update receipt metadata or extracted items.

#### Request
```http
PATCH /api/receipts/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "merchantName": "Whole Foods Market (Corrected)",
  "receiptDate": "2025-10-14",
  "totalAmount": 70.00
}
```

OR update specific extracted item:
```json
{
  "extractedItems": [
    {
      "id": "item-uuid-1",
      "name": "Organic Bananas (Updated)",
      "quantity": 3,
      "status": "edited"
    }
  ]
}
```

#### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "receipt": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "merchantName": "Whole Foods Market (Corrected)",
      "updatedAt": "2025-10-15T14:35:00Z"
    }
  }
}
```

---

### 6. Confirm Receipt & Create Inventory Items

**POST** `/api/receipts/:id/confirm`

Convert reviewed extracted items into actual inventory items.

#### Request
```http
POST /api/receipts/550e8400-e29b-41d4-a716-446655440000/confirm
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "items": [
    {
      "extractedItemId": "item-uuid-1",
      "name": "Organic Bananas",
      "quantity": 2,
      "categoryId": "category-uuid",
      "locationId": "location-uuid",
      "minQuantity": 1,
      "notes": "Added from receipt"
    },
    {
      "extractedItemId": "item-uuid-2",
      "name": "Almond Milk",
      "quantity": 1,
      "categoryId": "category-uuid",
      "locationId": "location-uuid"
    }
  ]
}
```

**Field Requirements:**
- `extractedItemId` (required): UUID of extracted item
- `name` (required): string, item name
- `quantity` (required): integer, > 0
- `categoryId` (required): UUID
- `locationId` (required): UUID
- `minQuantity` (optional): integer
- `notes` (optional): string
- All other inventory item fields are optional

#### Response - Success (201 Created)
```json
{
  "success": true,
  "data": {
    "receipt": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "processingStatus": "confirmed",
      "updatedAt": "2025-10-15T14:40:00Z"
    },
    "createdItems": [
      {
        "itemId": "inventory-item-uuid-1",
        "extractedItemId": "item-uuid-1",
        "name": "Organic Bananas",
        "quantity": 2
      },
      {
        "itemId": "inventory-item-uuid-2",
        "extractedItemId": "item-uuid-2",
        "name": "Almond Milk",
        "quantity": 1
      }
    ],
    "summary": {
      "totalItems": 2,
      "successCount": 2,
      "failedCount": 0
    }
  }
}
```

#### Response - Partial Success (207 Multi-Status)
```json
{
  "success": true,
  "data": {
    "receipt": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "processingStatus": "confirmed",
      "updatedAt": "2025-10-15T14:40:00Z"
    },
    "createdItems": [
      {
        "itemId": "inventory-item-uuid-1",
        "extractedItemId": "item-uuid-1",
        "name": "Organic Bananas",
        "quantity": 2,
        "success": true
      }
    ],
    "failedItems": [
      {
        "extractedItemId": "item-uuid-2",
        "error": "Invalid category ID",
        "success": false
      }
    ],
    "summary": {
      "totalItems": 2,
      "successCount": 1,
      "failedCount": 1
    }
  }
}
```

#### Response - Error (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid items data",
    "details": {
      "items[0].quantity": "Must be greater than 0",
      "items[1].categoryId": "Invalid category ID"
    }
  }
}
```

---

### 7. Delete Receipt

**DELETE** `/api/receipts/:id`

Delete a draft receipt (soft delete) and clean up associated image.

#### Request
```http
DELETE /api/receipts/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

#### Query Parameters
- `deleteImage` (optional): boolean, default true - Delete associated image

#### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "receiptId": "550e8400-e29b-41d4-a716-446655440000",
    "deleted": true,
    "imageDeleted": true
  }
}
```

#### Response - Error (409 Conflict)
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_DELETE_CONFIRMED",
    "message": "Cannot delete confirmed receipts",
    "details": {
      "receiptStatus": "confirmed",
      "linkedItems": 5
    }
  }
}
```

---

### 8. List User Receipts

**GET** `/api/receipts`

List all receipts for authenticated user with pagination and filtering.

#### Request
```http
GET /api/receipts?status=draft&limit=20&offset=0
Authorization: Bearer <token>
```

#### Query Parameters
- `status` (optional): string - Filter by status (draft, confirmed, failed)
- `startDate` (optional): ISO 8601 date - Filter by receipt date >= startDate
- `endDate` (optional): ISO 8601 date - Filter by receipt date <= endDate
- `limit` (optional): integer, default 20, max 100
- `offset` (optional): integer, default 0
- `sortBy` (optional): string - Field to sort by (createdAt, receiptDate, totalAmount)
- `sortOrder` (optional): string - asc or desc, default desc

#### Response - Success (200 OK)
```json
{
  "success": true,
  "data": {
    "receipts": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "merchantName": "Whole Foods Market",
        "receiptDate": "2025-10-15",
        "totalAmount": 67.43,
        "processingStatus": "draft",
        "itemCount": 8,
        "confidence": 0.87,
        "createdAt": "2025-10-15T14:30:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_FILE_TYPE` | 400 | Unsupported image format |
| `FILE_TOO_LARGE` | 413 | Image exceeds size limit |
| `OCR_FAILED` | 422 | OCR processing failed |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RECEIPT_NOT_FOUND` | 404 | Receipt doesn't exist or no access |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `CANNOT_DELETE_CONFIRMED` | 409 | Cannot delete confirmed receipt |
| `INTERNAL_ERROR` | 500 | Server error |

## Webhooks (Future Enhancement)

```http
POST <your-webhook-url>
Content-Type: application/json
X-Receipt-Event: receipt.confirmed

Body:
{
  "event": "receipt.confirmed",
  "timestamp": "2025-10-15T14:40:00Z",
  "data": {
    "receiptId": "550e8400-e29b-41d4-a716-446655440000",
    "itemCount": 5
  }
}
```

## SDK Example (TypeScript)

```typescript
import { ReceiptAPI } from '@/lib/api/receipts';

const api = new ReceiptAPI(supabaseClient);

// Upload image
const { receiptId, imageUrl } = await api.uploadImage(file);

// Create draft
const draft = await api.createDraft({
  merchantName: "Store Name",
  extractedItems: [{ name: "Product", quantity: 1 }]
});

// Confirm and create items
const result = await api.confirmReceipt(receiptId, {
  items: [
    { extractedItemId: "...", name: "Product", quantity: 1, categoryId: "..." }
  ]
});

console.log(`Created ${result.summary.successCount} items`);
```

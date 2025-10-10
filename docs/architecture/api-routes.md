# API Routes Architecture

## Overview

This document defines the RESTful API design for the home inventory system using Next.js App Router API routes. The API follows REST principles with consistent patterns for CRUD operations, error handling, and response formats.

## API Design Principles

### Core Principles

1. **RESTful Conventions**: Use standard HTTP methods and status codes
2. **Consistent Responses**: Uniform response structure across all endpoints
3. **Validation**: Request validation on all endpoints using Zod
4. **Error Handling**: Comprehensive error responses with meaningful messages
5. **Security**: Authentication and authorization on protected routes
6. **Pagination**: Cursor-based pagination for large datasets
7. **Filtering**: Support for filtering, sorting, and searching

## Base URL Structure

```
Development: http://localhost:3000/api
Production:  https://homeinventory.vercel.app/api
```

## API Route Organization

```
app/api/
├── items/
│   ├── route.ts                    # GET (list), POST (create)
│   ├── [id]/
│   │   ├── route.ts                # GET (detail), PATCH (update), DELETE
│   │   └── image/route.ts          # POST (upload image)
│   └── search/route.ts             # GET (search items)
│
├── categories/
│   ├── route.ts                    # GET (list), POST (create)
│   ├── [id]/
│   │   ├── route.ts                # GET (detail), PATCH, DELETE
│   │   └── children/route.ts       # GET (child categories)
│   └── tree/route.ts               # GET (full hierarchy)
│
├── locations/
│   ├── route.ts                    # GET (list), POST (create)
│   └── [id]/route.ts               # GET, PATCH, DELETE
│
├── tags/
│   ├── route.ts                    # GET (list), POST (create)
│   └── [id]/route.ts               # GET, PATCH, DELETE
│
├── upload/
│   └── route.ts                    # POST (image upload)
│
├── auth/
│   └── [...nextauth]/route.ts      # NextAuth.js endpoints
│
└── health/
    └── route.ts                    # GET (health check)
```

## Standard Response Format

### Success Response

```typescript
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
  meta?: {
    pagination?: PaginationMeta
    timestamp: string
  }
}

interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  cursor?: string
}
```

### Error Response

```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
    timestamp: string
  }
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error with details |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Authentication & Authorization

### Authentication

**Method**: NextAuth.js session-based authentication

**Protected Route Example**:
```typescript
// lib/auth.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    )
  }

  return session
}
```

### Authorization

**Role-Based Access Control (RBAC)**:
```typescript
// lib/authorization.ts
import { Session } from "next-auth"

export function hasPermission(session: Session, resource: string, action: string) {
  const { role } = session.user

  // Admin has all permissions
  if (role === "ADMIN") return true

  // Define permission rules
  const permissions = {
    USER: {
      items: ["read", "create", "update", "delete"],
      categories: ["read"],
      locations: ["read"],
      tags: ["read"],
    },
    GUEST: {
      items: ["read"],
      categories: ["read"],
      locations: ["read"],
      tags: ["read"],
    },
  }

  return permissions[role]?.[resource]?.includes(action) ?? false
}
```

## API Endpoints

### Items API

#### List Items

**Endpoint**: `GET /api/items`

**Query Parameters**:
```typescript
interface ItemListParams {
  page?: number
  pageSize?: number
  cursor?: string
  categoryId?: string
  locationId?: string
  tags?: string[]
  sort?: "name" | "createdAt" | "updatedAt" | "estimatedValue"
  order?: "asc" | "desc"
  search?: string
}
```

**Response**:
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      name: "Laptop",
      description: "MacBook Pro 16-inch",
      imageUrl: "https://...",
      purchaseDate: "2024-01-15T00:00:00Z",
      estimatedValue: 2500.00,
      category: { id: "uuid", name: "Electronics", type: "HOME" },
      location: { id: "uuid", name: "Office Desk" },
      tags: [{ id: "uuid", name: "High Value", color: "#FF0000" }],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    }
  ],
  meta: {
    pagination: {
      total: 100,
      page: 1,
      pageSize: 20,
      hasMore: true,
      cursor: "cursor_string"
    },
    timestamp: "2025-10-10T20:00:00Z"
  }
}
```

**Implementation**:
```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const itemListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  sort: z.enum(["name", "createdAt", "updatedAt", "estimatedValue"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  // Authenticate
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  // Validate query parameters
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)
  const validation = itemListSchema.safeParse(searchParams)

  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validation.error.errors,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    )
  }

  const { page, pageSize, categoryId, locationId, tags, sort, order, search } = validation.data

  // Build query
  const where = {
    userId: session.user.id,
    deletedAt: null,
    ...(categoryId && { categoryId }),
    ...(locationId && { locationId }),
    ...(tags && { tags: { some: { tag: { name: { in: tags } } } } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
  }

  // Get total count
  const total = await prisma.item.count({ where })

  // Get items
  const items = await prisma.item.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, type: true } },
      location: { select: { id: true, name: true } },
      tags: {
        include: { tag: { select: { id: true, name: true, color: true } } },
      },
    },
    orderBy: { [sort]: order },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  return NextResponse.json({
    success: true,
    data: items,
    meta: {
      pagination: {
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
      timestamp: new Date().toISOString(),
    },
  })
}
```

#### Create Item

**Endpoint**: `POST /api/items`

**Request Body**:
```typescript
{
  name: string                    // Required, 1-200 chars
  description?: string            // Optional
  categoryId: string              // Required, UUID
  locationId?: string             // Optional, UUID
  tags?: string[]                 // Optional, array of tag names
  purchaseDate?: string           // Optional, ISO date
  estimatedValue?: number         // Optional, positive number
  imageUrl?: string               // Optional, URL
}
```

**Validation Schema**:
```typescript
const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  purchaseDate: z.string().datetime().optional(),
  estimatedValue: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
})
```

**Response**: `201 Created`
```typescript
{
  success: true,
  data: { id: "uuid", name: "...", ... },
  message: "Item created successfully",
  meta: { timestamp: "2025-10-10T20:00:00Z" }
}
```

#### Get Item by ID

**Endpoint**: `GET /api/items/[id]`

**Response**: `200 OK`
```typescript
{
  success: true,
  data: {
    id: "uuid",
    name: "Laptop",
    description: "...",
    // ... all item fields
    category: { ... },
    location: { ... },
    tags: [ ... ],
  }
}
```

#### Update Item

**Endpoint**: `PATCH /api/items/[id]`

**Request Body**: Partial item data (only fields to update)

**Response**: `200 OK`

#### Delete Item

**Endpoint**: `DELETE /api/items/[id]`

**Response**: `204 No Content`

**Note**: Soft delete (sets `deletedAt` timestamp)

#### Search Items

**Endpoint**: `GET /api/items/search`

**Query Parameters**:
```typescript
{
  q: string              // Search query
  categoryId?: string
  tags?: string[]
  minValue?: number
  maxValue?: number
  dateFrom?: string
  dateTo?: string
}
```

### Categories API

#### List Categories

**Endpoint**: `GET /api/categories`

**Query Parameters**:
```typescript
{
  type?: "HOME" | "GARAGE" | "AUTOMOBILE"
  parentId?: string      // Filter by parent
  includeChildren?: boolean
}
```

#### Get Category Tree

**Endpoint**: `GET /api/categories/tree`

**Response**: Hierarchical category structure
```typescript
{
  success: true,
  data: [
    {
      id: "uuid",
      name: "Home",
      type: "HOME",
      children: [
        {
          id: "uuid",
          name: "Living Room",
          type: "HOME",
          children: [...]
        }
      ]
    }
  ]
}
```

#### Get Child Categories

**Endpoint**: `GET /api/categories/[id]/children`

**Response**: List of direct children

### Locations API

**Endpoints**:
- `GET /api/locations` - List locations
- `POST /api/locations` - Create location
- `GET /api/locations/[id]` - Get location
- `PATCH /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Delete location

### Tags API

**Endpoints**:
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag
- `GET /api/tags/[id]` - Get tag
- `PATCH /api/tags/[id]` - Update tag
- `DELETE /api/tags/[id]` - Delete tag

### Upload API

#### Upload Image

**Endpoint**: `POST /api/upload`

**Request**: `multipart/form-data`
```typescript
{
  file: File              // Max 5MB, image/* only
  folder?: string         // Optional folder name
}
```

**Response**: `201 Created`
```typescript
{
  success: true,
  data: {
    url: "https://cloudinary.com/...",
    publicId: "homeinventory/items/uuid",
    width: 1920,
    height: 1080,
    format: "jpg",
    size: 245678
  }
}
```

**Implementation**:
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { uploadToCloudinary } from "@/lib/cloudinary"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const session = await requireAuth(request)
  if (session instanceof NextResponse) return session

  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json(
      { success: false, error: { code: "NO_FILE", message: "No file provided" } },
      { status: 400 }
    )
  }

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: { code: "FILE_TOO_LARGE", message: "File must be under 5MB" } },
      { status: 400 }
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TYPE", message: "Only image files allowed" } },
      { status: 400 }
    )
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(file, {
    folder: formData.get("folder") as string || "homeinventory/items",
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto:good" },
    ],
  })

  return NextResponse.json(
    {
      success: true,
      data: result,
      message: "Image uploaded successfully",
    },
    { status: 201 }
  )
}
```

## Error Handling

### Global Error Handler

```typescript
// lib/api/error-handler.ts
import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.errors,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 422 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Resource already exists",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      )
    }

    // Foreign key constraint violation
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REFERENCE",
            message: "Referenced resource not found",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }
  }

  // Generic server error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  )
}
```

### Usage in Route Handlers

```typescript
export async function GET(request: NextRequest) {
  try {
    // Route logic
  } catch (error) {
    return handleApiError(error)
  }
}
```

## Rate Limiting

### Implementation

```typescript
// lib/rate-limit.ts
import { NextRequest, NextResponse } from "next/server"

const rateLimit = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 60 // 60 requests per minute

export function checkRateLimit(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const now = Date.now()

  const record = rateLimit.get(ip)

  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return null
  }

  if (record.count >= MAX_REQUESTS) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later",
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
        },
      }
    )
  }

  record.count++
  return null
}
```

## API Testing

### Test Structure

```typescript
// tests/api/items.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import { createMocks } from "node-mocks-http"
import { GET, POST } from "@/app/api/items/route"

describe("/api/items", () => {
  beforeEach(() => {
    // Setup test database
  })

  describe("GET", () => {
    it("returns list of items", async () => {
      const { req } = createMocks({ method: "GET" })
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it("returns 401 when not authenticated", async () => {
      // Test unauthorized access
    })

    it("filters by category", async () => {
      // Test filtering
    })
  })

  describe("POST", () => {
    it("creates item with valid data", async () => {
      // Test item creation
    })

    it("returns 400 with invalid data", async () => {
      // Test validation errors
    })
  })
})
```

## API Documentation

### OpenAPI/Swagger

Generate API documentation using OpenAPI specification:

```typescript
// lib/openapi.ts
export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Home Inventory API",
    version: "1.0.0",
    description: "RESTful API for home inventory management",
  },
  servers: [
    { url: "http://localhost:3000/api", description: "Development" },
    { url: "https://homeinventory.vercel.app/api", description: "Production" },
  ],
  paths: {
    "/items": {
      get: {
        summary: "List items",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "pageSize", in: "query", schema: { type: "integer" } },
          // ... more parameters
        ],
        responses: {
          200: { description: "Success", content: { /* ... */ } },
          401: { description: "Unauthorized" },
        },
      },
      // ... more endpoints
    },
  },
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-10
**Author**: Architect Agent (Hive Mind swarm-1760128533906-e6cc3wfik)

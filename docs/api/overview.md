# API Overview

Home Inventory System uses Next.js 15 App Router with API Routes for backend functionality.

## Architecture

- **Framework**: Next.js 15 App Router
- **Database**: SQLite with Prisma ORM
- **API Pattern**: RESTful API Routes
- **Authentication**: (To be implemented)
- **Validation**: Zod schemas

## Base URL

\`\`\`
Development: http://localhost:3000/api
Production: https://your-domain.com/api
\`\`\`

## API Endpoints

### Items
- `GET /api/items` - List all items (with pagination/filtering)
- `GET /api/items/[id]` - Get single item
- `POST /api/items` - Create new item
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Locations
- `GET /api/locations` - List all locations
- `POST /api/locations` - Create location
- `PUT /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Delete location

### Tags
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/[id]` - Update tag
- `DELETE /api/tags/[id]` - Delete tag

### Search
- `GET /api/search` - Advanced search with filters

## Request/Response Format

### Standard Response
\`\`\`json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "details": { /* validation errors */ }
}
\`\`\`

### Paginated Response
\`\`\`json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
\`\`\`

## Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Filtering
- `categoryId` - Filter by category
- `locationId` - Filter by location
- `tagIds` - Filter by tags (comma-separated)
- `query` - Text search
- `condition` - Filter by condition
- `minValue` - Minimum value
- `maxValue` - Maximum value

### Sorting
- `sortBy` - Field to sort by (name, createdAt, currentValue)
- `sortOrder` - asc or desc

## Authentication

Currently, authentication is not implemented. When added, it will use:
- JWT tokens
- Authorization header: `Bearer <token>`

## Rate Limiting

- **Development**: No limits
- **Production**: 100 requests per minute per IP

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

## CORS

- **Development**: Allow all origins
- **Production**: Configure allowed origins

## Best Practices

1. Always validate input with Zod schemas
2. Use proper HTTP status codes
3. Include descriptive error messages
4. Paginate large responses
5. Cache frequently accessed data

See also:
- [Database Queries](./database-queries.md)
- [Developer Setup](../development/setup.md)

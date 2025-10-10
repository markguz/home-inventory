# Database Schema Design

## Overview

This document details the PostgreSQL database schema for the home inventory system, designed with Prisma ORM for type safety and excellent developer experience.

## Schema Principles

### Design Decisions

1. **UUID Primary Keys**: Better for distributed systems, no sequential ID exposure
2. **Soft Deletes**: Retain deleted records for audit and recovery
3. **Audit Timestamps**: Track creation and modification times
4. **Normalized Design**: Minimize data redundancy
5. **Foreign Key Constraints**: Maintain referential integrity
6. **Indexes**: Optimize frequent queries

## Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  emailVerified DateTime?
  image         String?
  password      String?   // Hashed with bcrypt
  role          UserRole  @default(USER)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete

  // Relations
  items         Item[]
  categories    Category[]
  accounts      Account[]
  sessions      Session[]

  @@index([email])
  @@map("users")
}

enum UserRole {
  ADMIN
  USER
  GUEST
}

// NextAuth.js models
model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================
// CORE INVENTORY MODELS
// ============================================

model Item {
  id              String    @id @default(uuid())
  name            String
  description     String?
  imageUrl        String?
  purchaseDate    DateTime?
  estimatedValue  Decimal?  @db.Decimal(10, 2)

  // Foreign keys
  userId          String
  categoryId      String
  locationId      String?

  // Metadata
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime? // Soft delete

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  category        Category  @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  location        Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)
  tags            ItemTag[]

  @@index([userId])
  @@index([categoryId])
  @@index([locationId])
  @@index([name])
  @@index([createdAt])
  @@index([deletedAt]) // For filtering out soft-deleted items
  @@map("items")
}

model Category {
  id          String    @id @default(uuid())
  name        String
  type        CategoryType
  description String?
  icon        String?   // Icon name or emoji
  color       String?   // Hex color for UI

  // Self-referential for hierarchy
  parentId    String?

  // Foreign keys
  userId      String

  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")
  items       Item[]
  locations   Location[]

  @@index([userId])
  @@index([parentId])
  @@index([type])
  @@index([name])
  @@map("categories")
}

enum CategoryType {
  HOME
  GARAGE
  AUTOMOBILE
}

model Location {
  id          String    @id @default(uuid())
  name        String
  description String?

  // Foreign keys
  categoryId  String
  userId      String

  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  // Relations
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  items       Item[]

  @@index([categoryId])
  @@index([userId])
  @@index([name])
  @@map("locations")
}

model Tag {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  color       String?   // Hex color for UI

  // Metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  items       ItemTag[]

  @@index([name])
  @@map("tags")
}

// Junction table for many-to-many relationship
model ItemTag {
  id        String   @id @default(uuid())
  itemId    String
  tagId     String
  createdAt DateTime @default(now())

  item Item @relation(fields: [itemId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([itemId, tagId])
  @@index([itemId])
  @@index([tagId])
  @@map("item_tags")
}

// ============================================
// AUDIT & ACTIVITY LOGGING
// ============================================

model ActivityLog {
  id          String       @id @default(uuid())
  userId      String
  action      ActivityAction
  entityType  String       // e.g., "Item", "Category"
  entityId    String
  metadata    Json?        // Additional context
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime     @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("activity_logs")
}

enum ActivityAction {
  CREATE
  UPDATE
  DELETE
  VIEW
  EXPORT
}
```

## Entity Relationship Diagram

```
┌─────────┐         ┌──────────┐         ┌─────────┐
│  User   │1──────N│   Item   │N──────1│Category │
└─────────┘         └──────────┘         └─────────┘
                         │                     │
                         │N                    │1
                         │                     │
                         │1                    │N
                    ┌─────────┐           ┌─────────┐
                    │ItemTag  │           │Location │
                    └─────────┘           └─────────┘
                         │N
                         │
                         │1
                    ┌─────────┐
                    │   Tag   │
                    └─────────┘

Category Hierarchy (Self-referential):
┌─────────┐
│Category │──┐
└─────────┘  │
     │       │
   parent    │children
     │       │
     └───────┘
```

## Schema Details

### Items Table

**Purpose**: Core entity representing inventory items

**Key Fields**:
- `id`: UUID primary key
- `name`: Item name (indexed for search)
- `description`: Detailed item description
- `imageUrl`: Cloud storage URL for item image
- `purchaseDate`: When item was acquired
- `estimatedValue`: Current estimated value (Decimal for precision)
- `userId`: Owner reference
- `categoryId`: Category classification
- `locationId`: Physical location (optional)

**Indexes**:
- `userId` - Fast user-specific queries
- `categoryId` - Category filtering
- `locationId` - Location filtering
- `name` - Text search optimization
- `createdAt` - Temporal queries
- `deletedAt` - Soft delete filtering

**Soft Delete**: Items are never hard-deleted to preserve history

### Categories Table

**Purpose**: Hierarchical classification system

**Key Fields**:
- `id`: UUID primary key
- `name`: Category name
- `type`: Enum (HOME, GARAGE, AUTOMOBILE)
- `parentId`: Self-reference for hierarchy
- `icon`, `color`: UI customization

**Hierarchy Example**:
```
Home (type: HOME)
├── Living Room (parent: Home)
│   ├── Furniture (parent: Living Room)
│   └── Electronics (parent: Living Room)
├── Kitchen (parent: Home)
└── Bedroom (parent: Home)

Garage (type: GARAGE)
├── Tools (parent: Garage)
└── Storage (parent: Garage)

Automobile (type: AUTOMOBILE)
├── Toyota Camry 2020 (parent: Automobile)
└── Honda Civic 2018 (parent: Automobile)
```

**Cascade Behavior**: Deleting parent deletes all children

### Locations Table

**Purpose**: Physical locations within categories

**Key Fields**:
- `id`: UUID primary key
- `name`: Location name
- `categoryId`: Parent category
- `userId`: Owner reference

**Example**:
- Category: "Living Room" → Location: "South Wall Shelf"
- Category: "Garage" → Location: "Workbench Drawer 3"
- Category: "Toyota Camry 2020" → Location: "Trunk"

### Tags Table

**Purpose**: Flexible categorization and filtering

**Key Fields**:
- `id`: UUID primary key
- `name`: Unique tag name
- `color`: UI color coding

**Example Tags**:
- "Warranty Active"
- "Needs Repair"
- "High Value"
- "Seasonal"
- "Gift"

**Many-to-Many**: Items can have multiple tags via ItemTag junction

### User & Authentication Tables

**Purpose**: User management and NextAuth.js integration

**Models**:
- `User`: Core user data with soft delete support
- `Account`: OAuth provider accounts
- `Session`: Active user sessions
- `VerificationToken`: Email verification tokens

**Roles**:
- `ADMIN`: Full system access
- `USER`: Standard user permissions
- `GUEST`: Read-only access

### Activity Log Table

**Purpose**: Audit trail for compliance and debugging

**Key Fields**:
- `action`: CREATE, UPDATE, DELETE, VIEW, EXPORT
- `entityType`, `entityId`: Reference to affected entity
- `metadata`: JSON field for additional context
- `ipAddress`, `userAgent`: Request metadata

**Use Cases**:
- Security auditing
- User activity tracking
- Debugging issues
- Compliance reporting

## Indexing Strategy

### Primary Indexes

1. **User Queries**:
   - `items.userId` - User's item list
   - `categories.userId` - User's categories

2. **Search Optimization**:
   - `items.name` - Item name search
   - `categories.name` - Category search
   - `tags.name` - Tag lookup

3. **Relationship Queries**:
   - `items.categoryId` - Items by category
   - `items.locationId` - Items by location
   - `categories.parentId` - Category tree traversal

4. **Temporal Queries**:
   - `items.createdAt` - Recent items
   - `items.deletedAt` - Active vs deleted items

### Composite Indexes (Future Optimization)

If query patterns show need:
```prisma
@@index([userId, categoryId]) // User's items in category
@@index([userId, createdAt])  // User's recent items
```

## Data Integrity

### Foreign Key Constraints

1. **Cascade Deletes**:
   - User deleted → All user's data deleted
   - Category deleted → Child categories deleted
   - Item deleted → ItemTags deleted

2. **Restrict Deletes**:
   - Category with items → Cannot delete (must reassign items)

3. **Set Null**:
   - Location deleted → Item.locationId set to NULL

### Validation Rules

**Application-Level** (Prisma + Zod):
- Email format validation
- Password complexity
- Decimal precision (10, 2)
- Required fields
- String length limits

## Migration Strategy

### Initial Migration

```bash
# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Adding Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default categories
  await prisma.category.createMany({
    data: [
      { name: 'Home', type: CategoryType.HOME },
      { name: 'Garage', type: CategoryType.GARAGE },
      { name: 'Automobile', type: CategoryType.AUTOMOBILE },
    ],
  });

  // Create common tags
  await prisma.tag.createMany({
    data: [
      { name: 'High Value', color: '#FF0000' },
      { name: 'Warranty', color: '#00FF00' },
      { name: 'Needs Repair', color: '#FFA500' },
    ],
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

### Rollback Strategy

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Reset database (development only)
npx prisma migrate reset
```

## Performance Considerations

### Query Optimization

1. **Select Only Needed Fields**:
```typescript
// ❌ Bad: Fetches all fields
const items = await prisma.item.findMany();

// ✅ Good: Fetches only needed fields
const items = await prisma.item.findMany({
  select: { id: true, name: true, imageUrl: true }
});
```

2. **Pagination**:
```typescript
// Cursor-based pagination for large datasets
const items = await prisma.item.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastItemId },
});
```

3. **Eager Loading**:
```typescript
// Load related data efficiently
const items = await prisma.item.findMany({
  include: {
    category: true,
    location: true,
    tags: { include: { tag: true } },
  },
});
```

### Connection Pooling

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/inventory?connection_limit=10"
```

## Security Considerations

### Sensitive Data

1. **Password Hashing**: Use bcrypt with salt rounds = 12
2. **No Plain Text**: Never store passwords in plain text
3. **Environment Variables**: Database credentials in .env
4. **Connection Encryption**: Use SSL for database connections

### Row-Level Security (RLS)

Consider implementing RLS in PostgreSQL for multi-tenant data isolation:

```sql
-- Enable RLS on items table
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own items
CREATE POLICY user_items ON items
  FOR ALL
  TO authenticated
  USING (user_id = current_user_id());
```

## Backup & Recovery

### Automated Backups

**Daily Backups**:
- Retention: 30 days
- Storage: Separate geographic region
- Testing: Monthly restore tests

**Point-in-Time Recovery**:
- Enable WAL (Write-Ahead Logging)
- 7-day recovery window

### Manual Backup

```bash
# Export database
pg_dump -U username -d inventory > backup_$(date +%Y%m%d).sql

# Restore database
psql -U username -d inventory < backup_20251010.sql
```

## Future Schema Enhancements

### Potential Additions

1. **Attachments Table**: Support multiple files per item
2. **ItemHistory Table**: Track value changes over time
3. **Sharing Table**: Share items with other users
4. **Notifications Table**: User notifications
5. **Templates Table**: Reusable item templates

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-10
**Author**: Architect Agent (Hive Mind swarm-1760128533906-e6cc3wfik)

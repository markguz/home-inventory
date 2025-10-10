# Database Guide

Database schema, migrations, and best practices.

## Schema

### Models

#### Item
Primary inventory item with all tracking fields.
\`\`\`prisma
model Item {
  id            String    @id @default(cuid())
  name          String
  description   String?
  quantity      Int       @default(1)
  purchaseDate  DateTime?
  purchasePrice Float?
  currentValue  Float?
  condition     String?   @default("good")
  notes         String?
  imageUrl      String?
  barcode       String?
  serialNumber  String?
  warrantyUntil DateTime?
  categoryId    String
  locationId    String
  category      Category  @relation(...)
  location      Location  @relation(...)
  tags          ItemTag[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
\`\`\`

#### Category
\`\`\`prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  icon        String?
  color       String?
  items       Item[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
\`\`\`

#### Location
Hierarchical storage locations.
\`\`\`prisma
model Location {
  id          String     @id @default(cuid())
  name        String     @unique
  description String?
  parentId    String?
  parent      Location?  @relation("LocationHierarchy")
  children    Location[] @relation("LocationHierarchy")
  items       Item[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
\`\`\`

#### Tag
\`\`\`prisma
model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  color     String?
  itemTags  ItemTag[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
\`\`\`

#### ItemTag (Join Table)
\`\`\`prisma
model ItemTag {
  id        String   @id @default(cuid())
  itemId    String
  tagId     String
  item      Item     @relation(...)
  tag       Tag      @relation(...)
  createdAt DateTime @default(now())
  
  @@unique([itemId, tagId])
  @@index([itemId])
  @@index([tagId])
}
\`\`\`

## Migrations

### Create Migration
\`\`\`bash
npx prisma migrate dev --name description_of_changes
\`\`\`

### Apply Migrations
\`\`\`bash
npx prisma migrate deploy
\`\`\`

### Reset Database
\`\`\`bash
npx prisma migrate reset
\`\`\`

## Seeding

Create \`prisma/seed.ts\`:
\`\`\`typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  await prisma.category.createMany({
    data: [
      { name: 'Home', icon: '🏠', color: '#3B82F6' },
      { name: 'Garage', icon: '🔧', color: '#F97316' },
      { name: 'Automobile', icon: '🚗', color: '#10B981' }
    ]
  });

  // Create locations
  await prisma.location.createMany({
    data: [
      { name: 'Living Room' },
      { name: 'Kitchen' },
      { name: 'Garage' }
    ]
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
\`\`\`

Run seed:
\`\`\`bash
npx prisma db seed
\`\`\`

## Prisma Studio

Visual database browser:
\`\`\`bash
npx prisma studio
\`\`\`

Opens at [http://localhost:5555](http://localhost:5555)

## Best Practices

1. **Migrations**: Always create migrations for schema changes
2. **Indexes**: Add indexes on frequently queried fields
3. **Cascade**: Use appropriate cascade rules
4. **Timestamps**: Include createdAt and updatedAt
5. **Unique Constraints**: Prevent duplicate data

See also:
- [API Overview](../api/overview.md)
- [Database Queries](../api/database-queries.md)

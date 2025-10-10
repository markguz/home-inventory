# Architecture Overview

System architecture and design patterns.

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library

### Backend
- **Next.js API Routes**: RESTful API
- **Prisma**: ORM
- **SQLite**: Database (dev), PostgreSQL (prod)

### State Management
- **TanStack Query**: Server state
- **React Hook Form**: Form state
- **Zod**: Validation

## Architecture Patterns

### Clean Architecture
\`\`\`
src/
├── app/              # Presentation Layer
├── components/       # UI Components
├── lib/              # Business Logic
└── types/            # Domain Models
\`\`\`

### Component Structure
\`\`\`
components/
├── items/            # Feature components
│   ├── ItemCard.tsx
│   ├── ItemList.tsx
│   └── SearchBar.tsx
├── layout/           # Layout components
│   ├── Header.tsx
│   └── Footer.tsx
└── ui/               # Base UI components
    ├── button.tsx
    ├── dialog.tsx
    └── input.tsx
\`\`\`

## Data Flow

### Read Flow
1. Component triggers query (TanStack Query)
2. API route receives request
3. Prisma queries database
4. Response returned to component
5. Component renders data

### Write Flow
1. Form submission (React Hook Form)
2. Validation (Zod schema)
3. API route processes request
4. Prisma writes to database
5. Cache invalidation (TanStack Query)
6. UI updates

## API Layer

### Route Structure
\`\`\`
app/api/
├── items/
│   ├── route.ts      # GET, POST
│   └── [id]/
│       └── route.ts  # GET, PUT, DELETE
├── categories/
│   └── route.ts
├── locations/
│   └── route.ts
└── tags/
    └── route.ts
\`\`\`

### Error Handling
\`\`\`typescript
try {
  const data = await prisma.item.findMany();
  return NextResponse.json({ success: true, data });
} catch (error) {
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
\`\`\`

## Database Layer

### Schema Design
- **Normalized**: Separate tables for entities
- **Relationships**: Foreign keys with cascading
- **Indexes**: On frequently queried fields

### Prisma Client
\`\`\`typescript
// Singleton pattern
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = prisma;
\`\`\`

## Performance

### Optimization Strategies
1. **Code Splitting**: Automatic with Next.js
2. **Image Optimization**: Next.js Image component
3. **Caching**: TanStack Query cache
4. **Database**: Indexes and connection pooling
5. **Build**: Turbopack for faster builds

See also:
- [Database Guide](./database.md)
- [Testing Guide](./testing.md)

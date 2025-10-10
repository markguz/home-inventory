# Home Inventory System

A modern home inventory management system built with Next.js 14+, Drizzle ORM, and shadcn/ui.

## Features

- ✅ Full CRUD operations for inventory items
- ✅ Category management
- ✅ SQLite database with Drizzle ORM
- ✅ Beautiful UI with shadcn/ui components
- ✅ Form validation with React Hook Form + Zod
- ✅ Server actions for mutations
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript throughout

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: SQLite with Drizzle ORM
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate and push database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Drizzle Studio (visual database manager)
- `npm run db:migrate` - Generate and apply database migrations
- `npm test` - Run tests with Vitest
- `npm run test:e2e` - Run end-to-end tests with Playwright

## Project Structure

```
home-inventory/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── actions/          # Server actions
│   │   ├── items/            # Item pages
│   │   ├── categories/       # Category pages
│   │   └── page.tsx          # Dashboard
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── items/            # Item-specific components
│   │   └── layout/           # Layout components
│   ├── db/                   # Database layer
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── index.ts          # Database connection
│   │   ├── queries.ts        # Query functions
│   │   └── seed.ts           # Seed data
│   ├── lib/                  # Utilities
│   │   ├── utils.ts          # Utility functions
│   │   └── validations.ts    # Zod schemas
│   └── types/                # TypeScript types
├── drizzle.config.ts         # Drizzle configuration
└── inventory.db              # SQLite database file
```

## Features Implemented

### Dashboard
- Statistics overview (total items, categories, tags)
- Recent items list
- Quick navigation

### Items Management
- View all items with grid layout
- Add new items with validated forms
- View item details
- Edit existing items
- Delete items
- Category association
- Quantity tracking
- Location tracking
- Optional fields: serial number, model number, notes

### Categories
- View all categories
- Category-based filtering
- Category assignment for items

### Database Schema
- **Items**: Core inventory items
- **Categories**: Item categorization
- **Tags**: Flexible tagging system (with many-to-many relationship)
- Timestamps for created/updated tracking

## Database Management

### View Database
```bash
npm run db:studio
```

### Create Migrations
```bash
npm run db:migrate
```

### Reset Database
```bash
rm inventory.db
npm run db:migrate
npm run db:seed
```

## Development

This project follows SPARC methodology with TDD principles:
- **S**pecification: Requirements analysis
- **P**seudocode: Algorithm design
- **A**rchitecture: System design
- **R**efinement: TDD implementation
- **C**ompletion: Integration

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. For production, consider using Turso (edge SQLite) instead of local SQLite:

```bash
npm install @libsql/client
```

Update `src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
})

export const db = drizzle(client)
```

## License

MIT

## Created with Claude Code

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# Home Inventory System

A modern, full-featured home inventory management system built with Next.js 15, Prisma, and shadcn/ui. Track your belongings, manage categories, set low-stock alerts, and keep your home organized.

## ✨ Features

### Core Functionality
- ✅ **Full CRUD Operations** for inventory items
- ✅ **Category Management** with icons, colors, and item counts
- ✅ **Clickable Category Cards** that filter items by category
- ✅ **User Authentication** with NextAuth.js (registration, login, sessions)
- ✅ **Low-Stock Alerts** for consumables and supplies
- ✅ **Search Functionality** across items and descriptions
- ✅ **Tag System** with many-to-many relationships
- ✅ **Location Tracking** with hierarchical organization
- ✅ **Responsive Design** that works on mobile, tablet, and desktop

### User Experience
- ✅ Beautiful UI with **shadcn/ui** components
- ✅ Form validation with **React Hook Form** + **Zod**
- ✅ Real-time item count display on category cards
- ✅ Filtered views by category with dynamic page titles
- ✅ Breadcrumb navigation for easy browsing
- ✅ Dashboard with statistics and recent items
- ✅ Role-based access control (USER/ADMIN)

### Developer Experience
- ✅ **TypeScript** throughout for type safety
- ✅ **Server Actions** for mutations
- ✅ **Prisma ORM** for database operations
- ✅ **Turbopack** for fast builds and HMR
- ✅ Comprehensive test suite (unit, integration, e2e)
- ✅ SPARC methodology with TDD principles

## 🚀 Tech Stack

### Core Technologies
- **Framework**: [Next.js 15.5.4](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Database**: SQLite with [Prisma 6.17.1](https://www.prisma.io/)
- **Authentication**: [NextAuth.js 5.0](https://next-auth.js.org/)
- **UI Framework**: [React 19.1.0](https://react.dev/)

### UI & Styling
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod v4](https://zod.dev/)
- **Themes**: [next-themes](https://github.com/pacocoursey/next-themes)

### Development & Testing
- **Testing Framework**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)
- **Testing Libraries**: Testing Library (React, User Event, Jest DOM)
- **Build Tool**: Turbopack (Next.js 15 default)
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with Tailwind plugin

## 📋 Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **yarn** or **pnpm**
- **Git** for version control

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/home-inventory.git
cd home-inventory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate a secure NextAuth secret:**

```bash
openssl rand -base64 32
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 6. Create Admin Account

Navigate to [http://localhost:3000/register](http://localhost:3000/register) and create your first account. The first user is automatically granted admin privileges.

## 📜 Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes (development)
- `npm run db:studio` - Open Prisma Studio (visual database manager)
- `npm run db:seed` - Seed database with sample data

### Testing
- `npm test` - Run all tests with Vitest
- `npm run test:ui` - Open Vitest UI
- `npm run test:unit` - Run unit tests only
- `npm run test:components` - Run component tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:coverage` - Generate coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Open Playwright UI
- `npm run test:e2e:debug` - Debug Playwright tests
- `npm run test:all` - Run all tests (unit + integration + e2e)

## 📁 Project Structure

```
home-inventory/
├── prisma/
│   ├── migrations/          # Database migrations
│   ├── schema.prisma        # Prisma schema definition
│   └── seed.ts             # Database seeding script
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/        # Authentication pages (login, register)
│   │   ├── actions/       # Server actions (items, categories)
│   │   ├── api/           # API routes
│   │   ├── alerts/        # Low-stock alerts page
│   │   ├── categories/    # Category management pages
│   │   ├── items/         # Item management pages
│   │   │   ├── [id]/     # Item detail page
│   │   │   ├── new/      # Create item page
│   │   │   └── page.tsx  # Items list (with filtering)
│   │   ├── layout.tsx     # Root layout with auth
│   │   └── page.tsx       # Dashboard
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── categories/   # Category-specific components
│   │   ├── items/        # Item-specific components
│   │   └── layout/       # Layout components (header, nav, breadcrumbs)
│   ├── db/
│   │   ├── queries.ts    # Database query functions
│   │   └── index.ts      # Prisma client instance
│   ├── lib/
│   │   ├── db.ts         # Database utilities
│   │   ├── auth.ts       # Authentication utilities
│   │   ├── alerts.ts     # Alert logic
│   │   ├── utils.ts      # General utilities
│   │   └── validations.ts # Zod validation schemas
│   └── types/            # TypeScript type definitions
│       ├── index.ts      # Exported types
│       ├── category.types.ts
│       └── item.types.ts
├── tests/
│   ├── e2e/              # Playwright e2e tests
│   ├── integration/      # Integration tests
│   ├── unit/            # Unit tests
│   ├── components/      # Component tests
│   └── fixtures/        # Test data fixtures
├── auth.ts              # NextAuth configuration
├── middleware.ts        # Next.js middleware (auth protection)
└── package.json         # Dependencies and scripts
```

## 🎯 Key Features Explained

### Category Management
- **Create/Edit/Delete** categories with custom icons and colors
- **Item Count Display** on category cards (updated in real-time)
- **Clickable Cards** that filter items by category
- **Minimum Quantity** defaults for low-stock alerts

### Item Management
- **Full CRUD** operations with server actions
- **Category Filtering** via URL query parameters (`/items?categoryId=xxx`)
- **Optional Fields**: description, serial number, notes, min quantity
- **Quantity Tracking** with visual badges
- **Location Assignment** for physical organization

### Alert System
- **Low-Stock Alerts** based on minimum quantity thresholds
- **Category Defaults** with item-level overrides
- **Visual Indicators** with color-coded badges
- **Alerts Page** showing all items below threshold

### Authentication
- **Secure Registration** with password hashing (bcryptjs)
- **Session Management** with NextAuth.js
- **Protected Routes** via middleware
- **Role-Based Access**: Admin can manage categories, users can manage items
- **User Indicator** in header with logout functionality

## 🗄️ Database Schema

### Core Models

**User**
- Authentication and authorization
- Role: USER or ADMIN
- One-to-many with Items

**Category**
- Name, description, icon, color
- Optional minimum quantity threshold
- One-to-many with Items

**Item**
- Name, description, quantity
- Category and location (required)
- Optional: minQuantity, serialNumber, notes
- Purchase info: date, price, current value
- Condition tracking
- Many-to-many with Tags

**Location**
- Hierarchical structure (parent-child)
- One-to-many with Items

**Tag**
- Name and color
- Many-to-many with Items (via ItemTag)

### Relationships
- User → Items (one-to-many)
- Category → Items (one-to-many)
- Location → Items (one-to-many)
- Tags ↔ Items (many-to-many via ItemTag)

## 🧪 Testing

This project includes comprehensive test coverage:

### Unit Tests
- Alert logic and calculations
- Validation schemas
- API route handlers

### Component Tests
- React component rendering
- User interactions
- Form validation

### Integration Tests
- API endpoints
- Database operations
- Server actions

### E2E Tests
- User workflows
- Authentication flow
- CRUD operations
- Consumables workflow

Run all tests:

```bash
npm run test:all
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

### Database Options

**For Production:**

Consider using [Turso](https://turso.tech/) (edge SQLite) for better scalability:

```bash
npm install @libsql/client
```

Update environment variables:

```env
DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"
```

Update `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
})

const adapter = new PrismaLibSQL(libsql)
export const prisma = new PrismaClient({ adapter })
```

## 🔧 Configuration

### Customization

**Update site information** in `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: 'Your App Name',
  description: 'Your app description',
}
```

**Modify color scheme** in `tailwind.config.ts` and `src/app/globals.css`

**Add categories** in `prisma/seed.ts` for initial data

## 📖 Development Methodology

This project follows the **SPARC** methodology:

- **S**pecification: Requirements analysis
- **P**seudocode: Algorithm design
- **A**rchitecture: System design
- **R**efinement: TDD implementation
- **C**ompletion: Integration and testing

Combined with **Test-Driven Development (TDD)** principles for quality assurance.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vercel](https://vercel.com/) - Deployment platform

## 📮 Support

For issues, questions, or suggestions:

- Open an [issue](https://github.com/yourusername/home-inventory/issues)
- Start a [discussion](https://github.com/yourusername/home-inventory/discussions)

---

## 🤖 Created with Claude Code

This project was developed using AI-assisted programming with Claude Code.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

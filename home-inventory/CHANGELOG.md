# Changelog

All notable changes to the Home Inventory System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-10-12

### Added
- **Clickable Category Cards**: Category cards now link to filtered item views
  - Displays current item count on each category card
  - Clicking a category navigates to `/items?categoryId={id}`
  - Hover effects and visual feedback for better UX
  - Category edit/delete actions work independently (click propagation prevented)
- **Filtered Items View**: Items page now supports filtering by category
  - Dynamic page title shows category name when filtered
  - "View all items" link to clear category filter
  - URL query parameter support for deep linking
- **Optional Minimum Quantity**: Made minQuantity field truly optional in item creation form
  - Form validation properly handles empty values
  - Transforms empty strings to undefined
  - Help text indicates fallback to category default
- **User Authentication UI**: Added user indicator and login/logout button to header
  - Displays logged-in user's name or email
  - Logout functionality with proper session cleanup
  - Responsive design for mobile and desktop

### Changed
- **Next.js 15 Compatibility**: Updated searchParams handling to use async/await
- **Prisma Migration**: Completed migration from Drizzle ORM to Prisma
  - Better TypeScript support
  - Improved type safety
  - More reliable migrations
- Updated validation schemas to properly handle optional fields

### Fixed
- Removed non-existent slug field from category validation schema
- Fixed form validation for optional number fields
- Fixed async searchParams access in Next.js 15

### Technical
- Using Next.js 15.5.4 with Turbopack
- React 19.1.0 and React DOM 19.1.0
- Prisma 6.17.1 for database operations
- NextAuth 5.0.0-beta.29 for authentication

## [0.0.9] - 2025-10-12

### Added
- Complete authentication system with NextAuth.js
  - User registration and login
  - Password hashing with bcryptjs
  - Session management
  - Protected routes with middleware
  - Role-based access control (USER/ADMIN)
- Full CRUD functionality for categories page
  - Create, read, update, and delete categories
  - Category form with validation
  - Category icons and color coding
  - Minimum quantity thresholds per category

### Changed
- Removed Drizzle configuration files
- Updated dependencies to latest versions

## [0.0.8] - 2025-10-10

### Added
- **Consumables Feature**: Minimum quantity alerts system
  - Alert threshold for low-stock items
  - Category-level default minimum quantities
  - Item-level minimum quantity overrides
  - Alert badge component with visual indicators
  - Alerts page showing all low-stock items
- Database migrations for minQuantity fields
  - Added to both Category and Item models
  - Nullable field with sensible defaults

### Technical
- Added comprehensive test suite
  - Unit tests for alerts logic
  - Component tests for AlertBadge
  - Integration tests for alerts API
  - E2E tests for consumables workflow

## [0.0.7] - 2025-10-10

### Fixed
- Added missing `/items` page
- Fixed validation schemas for items and categories
- Improved error handling in forms

## [0.0.6] - 2025-10-10

### Added
- **Initial Release**: Complete Next.js Home Inventory System
  - Dashboard with statistics overview
  - Full CRUD operations for inventory items
  - Category management
  - Tag system with many-to-many relationships
  - Location tracking
  - Search functionality
  - Beautiful UI with shadcn/ui components
  - Form validation with React Hook Form + Zod
  - SQLite database with Drizzle ORM (later migrated to Prisma)
  - Responsive design with Tailwind CSS
  - TypeScript throughout
  - Server actions for mutations
  - Breadcrumb navigation
  - Recent items display

### Technical Stack
- **Framework**: Next.js 15+ with App Router
- **Database**: SQLite with Prisma ORM
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Testing**: Vitest + Playwright
- **Date Handling**: date-fns

### Development
- SPARC methodology implementation
- Test-Driven Development (TDD)
- Comprehensive test coverage
- E2E testing with Playwright
- Component testing with Vitest + Testing Library

---

## Version History

- **0.1.0** (2025-10-12) - Clickable categories, filtered views, authentication UI
- **0.0.9** (2025-10-12) - NextAuth authentication, category CRUD
- **0.0.8** (2025-10-10) - Consumables and alerts system
- **0.0.7** (2025-10-10) - Bug fixes and missing pages
- **0.0.6** (2025-10-10) - Initial release

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

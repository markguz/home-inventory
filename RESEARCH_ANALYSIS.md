# Home Inventory Project - Comprehensive Research Analysis

**Date**: October 19, 2025  
**Status**: Complete Analysis  
**Repository**: /export/projects/homeinventory/home-inventory

---

## 1. PROJECT STRUCTURE & ORGANIZATION

### Directory Layout
```
home-inventory/
├── src/                          # Source code (88 TypeScript files)
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes (grouped layout)
│   │   │   ├── login/           # Login page
│   │   │   └── register/        # Registration page
│   │   ├── api/                 # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   │   └── [...nextauth]/
│   │   │   ├── items/           # Item CRUD endpoints
│   │   │   ├── categories/      # Category endpoints
│   │   │   ├── locations/       # Location endpoints
│   │   │   ├── tags/            # Tag endpoints
│   │   │   ├── receipts/        # Receipt processing
│   │   │   │   └── process/     # OCR processing endpoint
│   │   │   ├── search/          # Search functionality
│   │   │   └── alerts/          # Alert endpoints
│   │   ├── items/               # Items pages
│   │   ├── categories/          # Categories pages
│   │   ├── locations/           # Locations pages
│   │   ├── tags/                # Tags pages
│   │   ├── receipts/            # Receipt processing UI
│   │   ├── alerts/              # Alerts pages
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Dashboard
│   ├── db/                       # Database layer
│   ├── lib/                      # Utilities
│   │   ├── auth-utils.ts        # Authentication helpers
│   │   ├── auth/                # Auth-related utilities
│   │   ├── validations/         # Validation schemas
│   │   ├── db.ts                # Prisma client
│   │   └── alerts.ts            # Alert logic
│   ├── auth.ts                   # NextAuth.js v5 configuration
│   └── components/              # React components
│       ├── auth/                # Auth components
│       ├── ui/                  # UI components (shadcn/ui)
│       └── ...
├── tests/                        # Test suite
│   ├── e2e/                      # End-to-end tests (Playwright) - 2397 lines
│   │   ├── auth.spec.ts         # Auth E2E tests (442 lines)
│   │   ├── add-item.spec.ts     # Add item flow (181 lines)
│   │   ├── edit-item.spec.ts    # Edit item flow (240 lines)
│   │   ├── breadcrumb-navigation.spec.ts  # Navigation (320 lines)
│   │   ├── consumables-workflow.spec.ts   # Consumables (350 lines)
│   │   ├── search-filter.spec.ts          # Search (228 lines)
│   │   ├── receipt-processing.spec.ts     # Receipts (636 lines)
│   │   └── README-RECEIPT-TESTS.md        # Receipt test guide
│   ├── fixtures/                # Test data
│   │   ├── items.ts            # Item fixtures
│   │   ├── categories.ts        # Category fixtures
│   │   ├── locations.ts         # Location fixtures
│   │   ├── tags.ts              # Tag fixtures
│   │   ├── breadcrumb-fixtures.ts
│   │   ├── alert-fixtures.ts    # Alert fixtures
│   │   └── receipt-fixtures.ts  # Receipt fixtures
│   ├── helpers/
│   │   └── receipt-test-helpers.ts  # Receipt test utilities
│   ├── setup/
│   │   ├── test-utils.tsx       # Testing library utilities
│   │   ├── vitest.setup.ts      # Vitest setup
│   │   └── jest.setup.ts        # Jest setup
│   ├── components/              # Component tests
│   ├── integration/             # Integration tests
│   └── unit/                    # Unit tests
├── prisma/
│   └── schema.prisma           # Database schema
├── playwright.config.ts         # Playwright configuration
├── vitest.config.ts            # Vitest configuration
├── jest.config.js              # Jest configuration
├── next.config.ts              # Next.js configuration
├── .env                         # Environment variables
├── .env.example                # Environment template
├── package.json               # Dependencies
└── README.md                  # Project documentation
```

---

## 2. PLAYWRIGHT TEST SETUP

### Configuration (playwright.config.ts)
```typescript
testDir: './tests/e2e'
fullyParallel: true
forbidOnly: !!process.env.CI
retries: process.env.CI ? 2 : 0
workers: process.env.CI ? 1 : 8
reporter: 'html'
baseURL: process.env.BASE_URL || 'http://localhost:3000'
trace: 'on-first-retry'
screenshot: 'only-on-failure'
```

### Supported Browsers & Devices
- Desktop Chrome (Chromium)
- Desktop Firefox
- Desktop Safari (WebKit)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Key Features
- **Parallel Execution**: 8 workers for local development, 1 for CI
- **Auto-Retry**: 2 retries in CI environment
- **HTML Reporter**: Auto-generated test reports
- **Web Server**: Automatically starts `npm run dev` on port 3000
- **Screenshots**: Captured only on failure for debugging
- **Traces**: Recording enabled on first retry for troubleshooting

---

## 3. EXISTING TEST FILES & PATTERNS

### Test Suite Overview

| File | Lines | Purpose | Browser Coverage |
|------|-------|---------|------------------|
| auth.spec.ts | 442 | Authentication flows | 5 browsers |
| receipt-processing.spec.ts | 636 | Receipt OCR & processing | 5 browsers |
| breadcrumb-navigation.spec.ts | 320 | Navigation | 5 browsers |
| consumables-workflow.spec.ts | 350 | Low-stock alerts | 5 browsers |
| add-item.spec.ts | 181 | Item creation | 5 browsers |
| edit-item.spec.ts | 240 | Item editing | 5 browsers |
| search-filter.spec.ts | 228 | Search functionality | 5 browsers |
| **TOTAL** | **2397** | **All features** | **5 browsers** |

### Test Pattern Overview

All E2E tests follow a consistent pattern:

```typescript
import { test, expect, type Page } from '@playwright/test';

// Test credentials from environment variables
const TEST_EMAIL = process.env.USERNAME || 'mark@markguz.com';
const TEST_PASSWORD = process.env.PASSWORD || 'eZ$5nzgicDSnBCGL';

// Helper functions for common operations
async function loginHelper(page: Page, email: string, password: string): Promise<void> {
  // Login logic
}

test.describe('Feature Name', () => {
  test.describe('Sub-feature', () => {
    test('should do something', async ({ page }) => {
      // Test implementation
    });
  });
});
```

### Authentication Test Structure (auth.spec.ts)

**Test Groups**:
1. **Login Flow** (7 tests)
   - Successful login with valid credentials
   - Error messages for invalid credentials
   - Field validation (required fields)
   - Loading state during submission
   - Success toast notifications

2. **Logout Flow** (2 tests)
   - Successful logout and redirect
   - Session persistence after logout

3. **Protected Routes** (3 tests)
   - Redirect to login when unauthenticated
   - Access protected routes after login
   - Session maintenance during navigation

4. **User Menu** (2 tests)
   - Display user email in dropdown
   - Menu visibility based on auth state

5. **Accessibility** (2 tests)
   - Form labels and ARIA attributes
   - Keyboard navigation

6. **Browser Compatibility** (1 test)
   - Multiple viewport sizes (mobile, tablet, desktop)

---

## 4. AUTHENTICATION IMPLEMENTATION

### Authentication Architecture

**Provider**: NextAuth.js v5 (Credentials-based)

#### Configuration (`src/auth.ts`)

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate email and password
        // Lookup user in database
        // Verify password hash
        // Return user object
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) { /* ... */ },
    async session({ session, token }) { /* ... */ },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
```

### Key Authentication Files

1. **`src/auth.ts`** - NextAuth.js v5 configuration
   - Credentials provider setup
   - JWT strategy
   - JWT and session callbacks

2. **`src/lib/auth-utils.ts`** - Helper functions
   ```typescript
   - hashPassword(password: string): Promise<string>
   - verifyPassword(password: string, hashedPassword: string): Promise<boolean>
   - getServerSession(): Promise<Session | null>
   - validatePassword(password: string): { isValid: boolean; error?: string }
   - validateEmail(email: string): boolean
   ```

3. **`src/app/(auth)/login/page.tsx`** - Login form UI
   - React Hook Form + Zod validation
   - Form fields: email, password
   - Loading state management
   - Error/success toast notifications

4. **`src/app/(auth)/register/page.tsx`** - Registration form
   - Similar structure to login
   - Additional fields (name, confirm password)

5. **`src/app/api/auth/[...nextauth]/route.ts`** - NextAuth.js API route

6. **`src/app/api/auth/register/route.ts`** - Custom registration endpoint

### Database Schema (prisma/schema.prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Hashed with bcryptjs
  name          String?
  role          UserRole  @default(USER)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  items    Item[]
  sessions Session[]
  accounts Account[]
  
  @@index([email])
}

enum UserRole {
  USER
  ADMIN
}
```

### Password Management

- **Hashing**: bcryptjs with 12 salt rounds
- **Strength Validation**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

### Session Management

- **Strategy**: JWT (JSON Web Tokens)
- **Duration**: 30 days
- **Token Claims**: id, email, name, role
- **Storage**: HTTP-only cookies (automatic via NextAuth)

---

## 5. EXISTING AUTH TESTS & TEST UTILITIES

### Auth Test Coverage (auth.spec.ts)

**Test Helper Functions**:
```typescript
// Login with custom credentials
async function loginHelper(page, email, password, shouldSubmit = true)

// Logout from application
async function logoutHelper(page)

// Assert user is logged in
async function assertLoggedIn(page)

// Assert user is logged out
async function assertLoggedOut(page)
```

**Test Scenarios Covered**:
- Valid credential login → redirect to dashboard
- Invalid email → error message
- Invalid password → error message
- Empty email field → validation error
- Empty password field → validation error
- Both fields empty → validation errors
- Submit button disabled during submission
- Success toast on login
- Logout redirects to login page
- Session persistence (login → logout → login)
- Protected route redirect
- Protected route access after login
- Session maintenance during navigation
- User menu display with email
- Keyboard accessibility
- Multiple viewport sizes

### Test Utilities (`tests/setup/test-utils.tsx`)

```typescript
// Query Client Setup
createTestQueryClient()
renderWithProviders(ui, options?)

// Mock API Responses
mockApiResponse<T>(data, delay?)
mockApiError(message, status?, delay?)

// Database Testing
createTestDatabase()
cleanupTestDatabase(prisma)

// Test Data Builders
buildCategory(overrides?)
buildLocation(overrides?)
buildItem(categoryId, locationId, overrides?)

// Utilities
waitFor(ms)
waitForCondition(condition, timeout?, interval?)
expectAlertLevel(item, expectedLevel)
mockLocalStorage()
```

### Test Fixtures

**Available Fixtures**:
- `tests/fixtures/items.ts` - Mock items and form data
- `tests/fixtures/categories.ts` - Mock categories
- `tests/fixtures/locations.ts` - Mock locations
- `tests/fixtures/tags.ts` - Mock tags
- `tests/fixtures/alert-fixtures.ts` - Mock alerts
- `tests/fixtures/breadcrumb-fixtures.ts` - Breadcrumb test data
- `tests/fixtures/receipt-fixtures.ts` - Receipt OCR test data

---

## 6. ENVIRONMENT CONFIGURATION

### Environment File Location
- **File**: `.env`
- **Template**: `.env.example`
- **Path**: `/export/projects/homeinventory/home-inventory/`

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js v5 Configuration
NEXTAUTH_SECRET="6TYo5PRHScBDs1gCOowoX451NGa8vssVxhmrC4Orbko="
NEXTAUTH_URL="http://localhost:3000"

# Test Credentials
USERNAME="mark@markguz.com"
PASSWORD="eZ$5nzgicDSnBCGL"
```

### Environment File Structure

1. **Database Configuration**
   - Provider: SQLite (file-based)
   - Database file: `dev.db` (local development)
   - Contains all app data (users, items, categories, etc.)

2. **NextAuth Configuration**
   - Secret: Random 32-byte Base64 string (generated with `openssl rand -base64 32`)
   - URL: Base URL for the application
   - Used for JWT signing and session management

3. **Test Credentials**
   - Default test user email
   - Default test user password
   - Used by Playwright E2E tests for authentication

### Database

- **Type**: SQLite (serverless)
- **Location**: `./dev.db` (project root)
- **ORM**: Prisma v6.17.1
- **Schema**: `/export/projects/homeinventory/home-inventory/prisma/schema.prisma`

### Credentials & Security

- **Password Hashing**: bcryptjs (12 salt rounds)
- **Session Strategy**: JWT with 30-day expiration
- **Cookie Security**: HTTP-only cookies (automatic via NextAuth)
- **Secret Rotation**: Not currently implemented (recommended for production)

---

## 7. KEY FINDINGS & OBSERVATIONS

### Strengths

1. **Well-Structured E2E Tests**
   - Comprehensive test coverage (2,397 lines of tests)
   - Organized into logical test groups
   - Helper functions for common operations
   - Cross-browser testing (5 browsers)
   - Mobile and desktop viewport testing

2. **Authentication Implementation**
   - Proper use of NextAuth.js v5
   - Secure password hashing with bcryptjs
   - JWT session strategy with reasonable 30-day expiration
   - Proper error handling and validation

3. **Test Infrastructure**
   - Multiple test frameworks (Playwright, Vitest, Jest)
   - Comprehensive test utilities and fixtures
   - Proper test database cleanup
   - Mock data builders for test data generation

4. **Development Environment**
   - Clean separation of concerns
   - Environment variables properly configured
   - Database migrations set up
   - Seed data available

### Areas for Enhancement

1. **Test Coverage**
   - Currently no unit tests visible in E2E files
   - Component tests directory exists but minimal content
   - Integration tests could be expanded

2. **Security**
   - Test credentials hardcoded in .env (acceptable for dev, needs rotation in CI)
   - No rate limiting on authentication endpoints
   - No password reset functionality visible

3. **Performance**
   - E2E tests take 3-5 minutes per browser locally
   - No visual regression testing setup
   - No performance benchmarks in E2E suite

4. **Documentation**
   - README-RECEIPT-TESTS.md is focused on receipts only
   - General E2E test documentation could be expanded
   - Test data builders not well documented

---

## 8. TECHNOLOGY STACK SUMMARY

### Frontend
- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19.1.0
- **Components**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **Forms**: React Hook Form + Zod v4
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Data Fetching**: TanStack React Query v5

### Backend
- **Framework**: Next.js API Routes
- **Authentication**: NextAuth.js v5 (Credentials)
- **Database**: SQLite with Prisma v6.17.1
- **Password Hashing**: bcryptjs
- **Session Strategy**: JWT

### Testing
- **E2E Testing**: Playwright v1.56.0
- **Unit/Component Testing**: Vitest v3.2.4
- **Component Testing**: Jest v30.2.0
- **Testing Libraries**: Testing Library (React, User Event, Jest DOM)
- **Accessibility**: Jest Axe

### Development
- **Build Tool**: Turbopack (Next.js 15 default)
- **Linting**: ESLint 9
- **Formatting**: Prettier
- **Task Runner**: npm

---

## 9. RUNNING THE TESTS

### Prerequisites
- Node.js 20+
- npm or yarn
- Running dev server: `npm run dev`

### Commands

```bash
# Run all Playwright E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run specific test group
npx playwright test auth.spec.ts -g "Login Flow"

# Run on specific browser
npx playwright test --project=chromium

# View test report
npx playwright show-report
```

### Environment Setup for Tests

```bash
# Set test credentials in environment
export USERNAME="test@example.com"
export PASSWORD="TestPassword123"

# Run tests
npm run test:e2e
```

---

## 10. QUICK REFERENCE: IMPORTANT FILES

| File | Purpose | Lines |
|------|---------|-------|
| `/src/auth.ts` | NextAuth.js configuration | 83 |
| `/src/lib/auth-utils.ts` | Authentication helpers | 85 |
| `/src/app/(auth)/login/page.tsx` | Login form | 153 |
| `/tests/e2e/auth.spec.ts` | Auth E2E tests | 442 |
| `/tests/setup/test-utils.tsx` | Test utilities | 177 |
| `/playwright.config.ts` | Playwright config | 47 |
| `/prisma/schema.prisma` | Database schema | 100+ |
| `/package.json` | Dependencies | 89 |
| `/.env` | Environment config | 7 |

---

## 11. CRITICAL CONFIGURATION VALUES

### Test Credentials
- **Email**: `mark@markguz.com`
- **Password**: `eZ$5nzgicDSnBCGL`

### NextAuth Configuration
- **Secret**: `6TYo5PRHScBDs1gCOowoX451NGa8vssVxhmrC4Orbko=`
- **URL**: `http://localhost:3000`
- **Session Duration**: 30 days
- **Session Strategy**: JWT

### Database
- **Type**: SQLite
- **File**: `./dev.db`
- **Provider**: Prisma v6.17.1

### Testing
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Test Browsers**: 5 (Chromium, Firefox, WebKit, Pixel 5, iPhone 12)
- **Parallel Workers**: 8 (local), 1 (CI)
- **Reporter**: HTML

---

## 12. SESSION FLOW DIAGRAM

```
User → Login Page (GET /login)
  ↓
User Submits Credentials
  ↓
NextAuth.js Credentials Provider
  ↓
Validate Email & Password → Database Lookup
  ↓
Verify Password Hash (bcryptjs)
  ↓
Create JWT Token
  ↓
Set HTTP-Only Cookie with JWT
  ↓
Redirect to Dashboard (/) → Authenticated
  ↓
User Accesses Protected Routes
  ↓
Middleware/Server Action Verifies Session
  ↓
Grant Access if Valid JWT Token
```

---

## CONCLUSION

The Home Inventory project has a well-established testing infrastructure with comprehensive Playwright E2E tests (2,397 lines) covering all major user flows including authentication, item management, receipts processing, and navigation. The authentication system uses NextAuth.js v5 with secure password hashing and JWT-based sessions.

Key strengths include organized test structure, proper environment configuration, and comprehensive test utilities. Areas for potential enhancement include expanded unit/component test coverage, visual regression testing, and performance benchmarking.

All necessary information for testing, authentication, and environment setup has been documented and is readily accessible in the codebase.

---

**End of Analysis Document**

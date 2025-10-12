# Authentication Architecture - Home Inventory System

## Document Information
- **Created**: 2025-10-12
- **Author**: Requirements Analyst Agent
- **Status**: Technical Specification
- **Framework**: Next.js 15.5.4 with App Router
- **Auth Library**: NextAuth.js v5 (Auth.js)
- **Related**: See auth-requirements.md for functional requirements

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Login Page   │  │ Register Page│  │ Protected    │       │
│  │ /login       │  │ /register    │  │ Pages        │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
          │ HTTP POST        │ HTTP POST        │ HTTP GET
          │                  │                  │ (with session)
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 Middleware                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Session Validation & Route Protection                │   │
│  │  - Check session cookie                               │   │
│  │  - Validate session in database                       │   │
│  │  - Redirect to login if unauthorized                  │   │
│  │  - Check role for admin routes                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                      NextAuth.js v5 Core                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Credentials  │  │ Session      │  │ JWT          │       │
│  │ Provider     │  │ Management   │  │ Handling     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ User         │  │ Session      │  │ Account      │       │
│  │ Operations   │  │ Operations   │  │ Operations   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  User | Session | Account | VerificationToken         │   │
│  │  Item (with userId) | Category | Location | Tag       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Justification

**Why NextAuth.js v5 (Auth.js)?**
1. **Native Next.js 15 Support**: Designed for App Router and Server Components
2. **Production Ready**: Battle-tested by thousands of applications
3. **Security First**: Built-in CSRF protection, secure sessions, automatic security updates
4. **Flexible**: Supports credentials, OAuth, email, and custom providers
5. **Type-Safe**: Full TypeScript support with excellent types
6. **Database Agnostic**: Works perfectly with Prisma
7. **Active Development**: Regular updates and security patches

**Why Bcryptjs over Bcrypt?**
1. **Pure JavaScript**: No C++ dependencies, easier deployment
2. **Cross-Platform**: Works on all platforms without compilation
3. **Same Security**: Uses same algorithm as bcrypt
4. **Vercel Compatible**: No native dependencies for edge functions

**Why Prisma?**
1. **Already Used**: Project already uses Prisma
2. **Type Safety**: Auto-generated types from schema
3. **Migration System**: Easy schema changes
4. **NextAuth.js Adapter**: Official Prisma adapter available

---

## 2. Authentication Flow Architecture

### 2.1 Registration Flow

```
┌──────────────┐
│ User visits  │
│ /register    │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Registration Form (Client Component) │
│ - Email input (validated)            │
│ - Password input (strength meter)    │
│ - Name input (optional)              │
│ - Form validation with Zod           │
└──────┬───────────────────────────────┘
       │
       │ Submit Form
       ↓
┌──────────────────────────────────────┐
│ Server Action: registerUser()        │
│ 1. Validate input (Zod schema)       │
│ 2. Check email uniqueness            │
│ 3. Hash password (bcryptjs)          │
│ 4. Create user in database           │
│ 5. Generate verification token       │
│ 6. Send verification email           │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Prisma: User Creation                │
│ prisma.user.create({                 │
│   email, password: hashedPassword,   │
│   name, role: 'USER'                 │
│ })                                   │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Response & Redirect                  │
│ - Show success message               │
│ - Redirect to login                  │
│ - Display "Check email" message      │
└──────────────────────────────────────┘
```

**Implementation Details:**

```typescript
// src/lib/auth/actions.ts
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/lib/validations';

export async function registerUser(data: unknown) {
  // 1. Validate input
  const validated = registerSchema.parse(data);

  // 2. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email }
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(validated.password, 12);

  // 4. Create user
  const user = await prisma.user.create({
    data: {
      email: validated.email,
      password: hashedPassword,
      name: validated.name,
      role: 'USER'
    }
  });

  // 5. Generate verification token
  const token = generateSecureToken();
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });

  // 6. Send verification email
  await sendVerificationEmail(user.email, token);

  return { success: true, userId: user.id };
}
```

### 2.2 Login Flow

```
┌──────────────┐
│ User visits  │
│ /login       │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Login Form (Client Component)        │
│ - Email input                        │
│ - Password input                     │
│ - Remember me checkbox               │
└──────┬───────────────────────────────┘
       │
       │ Submit Form
       ↓
┌──────────────────────────────────────┐
│ NextAuth.js signIn()                 │
│ - Provider: "credentials"            │
│ - Credentials: { email, password }   │
│ - Redirect: true                     │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ NextAuth.js Credentials Provider     │
│ authorize() callback:                │
│ 1. Find user by email                │
│ 2. Verify password with bcrypt       │
│ 3. Check if email verified           │
│ 4. Return user object or null        │
└──────┬───────────────────────────────┘
       │
       │ Success
       ↓
┌──────────────────────────────────────┐
│ NextAuth.js Session Creation         │
│ 1. Generate session token            │
│ 2. Store session in database         │
│ 3. Set HTTP-only cookie              │
│ 4. Return session object             │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Redirect to Dashboard                │
│ - User is now authenticated          │
│ - Session cookie set                 │
│ - Protected routes accessible        │
└──────────────────────────────────────┘
```

**Implementation Details:**

```typescript
// auth.ts (NextAuth.js configuration)
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;

        // Find user
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) return null;

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Return user object (password excluded)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user info to session
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
});
```

### 2.3 Session Validation Flow

```
┌──────────────────────────────────────┐
│ User requests protected page         │
│ GET /items                           │
│ Cookie: session-token=xyz123         │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ Next.js Middleware (middleware.ts)   │
│ 1. Check if route requires auth      │
│ 2. Check if session cookie exists    │
│ 3. Validate session                  │
└──────┬───────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────┐
│ NextAuth.js auth() helper            │
│ 1. Decrypt session token             │
│ 2. Query session from database       │
│ 3. Check expiration                  │
│ 4. Return user object or null        │
└──────┬───────────────────────────────┘
       │
       ├─── Valid Session ───────────────┐
       │                                  │
       ↓                                  │
┌────────────────────────┐               │
│ Allow request          │               │
│ Continue to page/API   │               │
└────────────────────────┘               │
                                         │
       ├─── Invalid/Expired ─────────────┤
       │                                  │
       ↓                                  ↓
┌────────────────────────┐    ┌─────────────────────┐
│ Redirect to /login     │    │ Return 401          │
│ (for page requests)    │    │ (for API requests)  │
└────────────────────────┘    └─────────────────────┘
```

**Implementation Details:**

```typescript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Define protected routes
  const protectedRoutes = ['/items', '/categories', '/alerts', '/profile'];
  const adminRoutes = ['/admin'];
  const publicRoutes = ['/login', '/register', '/forgot-password'];

  // Check if route is protected
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdmin = adminRoutes.some(route => pathname.startsWith(route));
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without session
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check admin access
  if (isAdmin && (!session || session.user.role !== 'ADMIN')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirect to dashboard if accessing public route with session
  if (isPublic && session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 3. Database Schema Architecture

### 3.1 Authentication Tables

The Prisma schema has been designed to support NextAuth.js v5 with proper relationships and indexes:

```prisma
// User model - Core authentication
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

  // Relations
  items         Item[]
  sessions      Session[]
  accounts      Account[]

  @@index([email])
}

// Session model - Active user sessions
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
}

// Account model - OAuth providers (future)
model Account {
  id                String  @id @default(cuid())
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
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// VerificationToken - Email verification & password reset
model VerificationToken {
  identifier String   // User email
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// UserRole enum
enum UserRole {
  USER
  ADMIN
}
```

### 3.2 Data Model Relationships

```
User (1) ─────────────── (*) Session
  │                           (One user can have multiple sessions)
  │
  ├─────────────── (*) Account
  │                    (One user can have multiple OAuth accounts)
  │
  └─────────────── (*) Item
                       (One user owns multiple inventory items)
```

### 3.3 Index Strategy

**Critical Indexes:**
- `User.email` - Unique index for fast login lookups
- `Session.sessionToken` - Unique index for session validation
- `Session.userId` - Index for user session queries
- `Account.userId` - Index for user account queries
- `Account.[provider, providerAccountId]` - Unique index for OAuth
- `Item.userId` - Index for user's items queries

**Performance Considerations:**
- Email lookups: O(1) with unique index
- Session validation: O(1) with sessionToken index
- User items query: O(log n) with userId index
- Composite indexes avoid full table scans

---

## 4. Security Architecture

### 4.1 Password Security

```
┌─────────────────────────────────────────────────────────┐
│                Password Security Layers                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Client-Side Validation                               │
│     - Minimum length check                               │
│     - Complexity requirements                            │
│     - Real-time feedback                                 │
│                                                           │
│  2. Transport Security                                   │
│     - HTTPS only in production                           │
│     - No password in URL/query params                    │
│     - No password in logs                                │
│                                                           │
│  3. Server-Side Validation                               │
│     - Zod schema validation                              │
│     - Reject weak passwords                              │
│     - Check against common passwords                     │
│                                                           │
│  4. Hashing (bcryptjs)                                   │
│     - Salt rounds: 12                                    │
│     - Unique salt per password                           │
│     - One-way hashing (no decryption)                    │
│                                                           │
│  5. Storage Security                                     │
│     - Never log passwords                                │
│     - Exclude from API responses                         │
│     - Database column type: TEXT                         │
│                                                           │
│  6. Comparison Security                                  │
│     - Constant-time comparison                           │
│     - bcrypt.compare() prevents timing attacks           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Password Hashing Implementation:**

```typescript
import bcrypt from 'bcryptjs';

// Configuration
const SALT_ROUNDS = 12; // 2^12 iterations (~250ms)

// Hash password (registration/reset)
export async function hashPassword(password: string): Promise<string> {
  // bcrypt automatically generates unique salt
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password (login)
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // Constant-time comparison prevents timing attacks
  return await bcrypt.compare(password, hashedPassword);
}

// Example: Registration
const hashedPassword = await hashPassword(userPassword);
await prisma.user.create({
  data: {
    email,
    password: hashedPassword, // NEVER store plain password
    name
  }
});

// Example: Login
const user = await prisma.user.findUnique({ where: { email } });
const isValid = await verifyPassword(inputPassword, user.password);
```

### 4.2 Session Security

**Session Token Generation:**
```typescript
// NextAuth.js handles this internally, but conceptually:
import { randomBytes } from 'crypto';

function generateSessionToken(): string {
  // 32 bytes = 256 bits of entropy
  return randomBytes(32).toString('hex');
}
```

**Cookie Configuration:**
```typescript
// In auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,        // No JavaScript access
        secure: process.env.NODE_ENV === 'production', // HTTPS only
        sameSite: 'lax',       // CSRF protection
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
});
```

### 4.3 CSRF Protection

NextAuth.js provides built-in CSRF protection:

1. **CSRF Token**: Automatically generated for each request
2. **State Parameter**: Used in OAuth flows
3. **SameSite Cookies**: Prevents cross-site request forgery
4. **Origin Validation**: Checks request origin

**No additional CSRF implementation needed** - NextAuth.js handles it.

### 4.4 Rate Limiting Architecture

```typescript
// src/lib/rate-limit.ts
import { prisma } from '@/lib/db';

interface RateLimitOptions {
  identifier: string;  // Email or IP
  maxAttempts: number;
  windowMs: number;
}

export async function checkRateLimit(options: RateLimitOptions): Promise<boolean> {
  const { identifier, maxAttempts, windowMs } = options;
  const windowStart = new Date(Date.now() - windowMs);

  // Count attempts in time window
  const attempts = await prisma.loginAttempt.count({
    where: {
      identifier,
      createdAt: { gte: windowStart }
    }
  });

  if (attempts >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  // Log attempt
  await prisma.loginAttempt.create({
    data: { identifier }
  });

  return true; // Allow attempt
}

// Usage in login
const allowed = await checkRateLimit({
  identifier: email,
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
});

if (!allowed) {
  throw new Error('Too many login attempts. Please try again later.');
}
```

---

## 5. API Routes Architecture

### 5.1 API Route Protection Pattern

```typescript
// src/app/api/items/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. Get session
  const session = await auth();

  // 2. Check authentication
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 3. Query user's items only
  const items = await prisma.item.findMany({
    where: { userId: session.user.id },
    include: { category: true, location: true }
  });

  // 4. Return data
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json();

  // Validate input
  const validated = itemSchema.parse(body);

  // Create item with user ID
  const item = await prisma.item.create({
    data: {
      ...validated,
      userId: session.user.id // Automatically assign to current user
    }
  });

  return NextResponse.json({ item }, { status: 201 });
}
```

### 5.2 Server Actions Protection

```typescript
// src/app/actions/items.ts
'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createItem(formData: FormData) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // 2. Validate data
  const validated = itemSchema.parse({
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    locationId: formData.get('locationId'),
    quantity: Number(formData.get('quantity')),
  });

  // 3. Create with user ID
  await prisma.item.create({
    data: {
      ...validated,
      userId: session.user.id
    }
  });

  // 4. Revalidate cache
  revalidatePath('/items');

  return { success: true };
}

export async function deleteItem(itemId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const item = await prisma.item.findUnique({
    where: { id: itemId }
  });

  if (!item || item.userId !== session.user.id) {
    throw new Error('Forbidden');
  }

  await prisma.item.delete({
    where: { id: itemId }
  });

  revalidatePath('/items');
  return { success: true };
}
```

---

## 6. File Structure

```
home-inventory/
├── auth.ts                          # NextAuth.js configuration
├── middleware.ts                    # Route protection middleware
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx         # Registration page
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx         # Password reset request
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx         # Password reset form
│   │   │   └── verify-email/
│   │   │       └── page.tsx         # Email verification
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts     # NextAuth.js handlers
│   │   │   ├── items/
│   │   │   │   └── route.ts         # Protected API route
│   │   │   └── admin/
│   │   │       └── users/
│   │   │           └── route.ts     # Admin-only API
│   │   └── (protected)/             # Protected route group
│   │       ├── layout.tsx           # Protected layout
│   │       ├── items/
│   │       ├── categories/
│   │       └── profile/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── PasswordResetForm.tsx
│   │   │   └── UserMenu.tsx         # User dropdown menu
│   │   └── ui/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── session.ts           # Session utilities
│   │   │   ├── password.ts          # Password hashing
│   │   │   ├── tokens.ts            # Token generation
│   │   │   └── rate-limit.ts        # Rate limiting
│   │   ├── validations/
│   │   │   └── auth.ts              # Zod schemas for auth
│   │   └── db.ts
│   └── types/
│       └── auth.types.ts            # Auth TypeScript types
├── prisma/
│   └── schema.prisma                # Database schema
└── docs/
    ├── auth-requirements.md         # This document
    └── auth-architecture.md         # Architecture documentation
```

---

## 7. Implementation Roadmap

### Phase 1: Core Setup (Week 1)
**Goal**: Basic authentication working

1. **Day 1-2: NextAuth.js Configuration**
   - Create `auth.ts` with Credentials provider
   - Configure Prisma adapter
   - Set up environment variables
   - Test basic session creation

2. **Day 3-4: Login & Registration UI**
   - Create login page with form validation
   - Create registration page
   - Implement password strength indicator
   - Add error handling and user feedback

3. **Day 5: Middleware & Protection**
   - Implement `middleware.ts`
   - Protect existing routes
   - Test authentication flow end-to-end

### Phase 2: User Management (Week 2)
**Goal**: Complete user functionality

1. **Day 1-2: Password Management**
   - Forgot password page and functionality
   - Reset password page
   - Verification token generation
   - Email sending (development: console, production: SMTP)

2. **Day 3: Email Verification**
   - Verification token handling
   - Email verification page
   - Unverified user banner
   - Resend verification functionality

3. **Day 4-5: User Profile**
   - Profile page
   - Password change functionality
   - Account settings
   - User menu component

### Phase 3: Authorization (Week 3)
**Goal**: Role-based access control

1. **Day 1-2: Data Isolation**
   - Update all queries to filter by userId
   - Update all mutations to verify ownership
   - Test data isolation thoroughly

2. **Day 3: Admin Features**
   - Admin middleware checks
   - Admin dashboard
   - User management interface
   - Role assignment

3. **Day 4-5: Testing & Security**
   - Security audit
   - Rate limiting implementation
   - Account lockout logic
   - Penetration testing

### Phase 4: Polish & Production (Week 4)
**Goal**: Production-ready authentication

1. **Day 1-2: Testing**
   - Unit tests for auth utilities
   - Integration tests for flows
   - E2E tests with Playwright

2. **Day 3: Documentation**
   - Update README
   - API documentation
   - User guide

3. **Day 4-5: Deployment**
   - Environment configuration
   - Production testing
   - Security checklist
   - Launch

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// tests/unit/auth/password.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Hashing', () => {
  it('should hash password securely', async () => {
    const password = 'SecurePass123!';
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed).toHaveLength(60); // bcrypt hash length
    expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('should verify correct password', async () => {
    const password = 'SecurePass123!';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword(password, hashed);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'SecurePass123!';
    const hashed = await hashPassword(password);
    const isValid = await verifyPassword('WrongPassword', hashed);

    expect(isValid).toBe(false);
  });
});
```

### 8.2 Integration Tests

```typescript
// tests/integration/auth/login.test.ts
import { describe, it, expect } from 'vitest';
import { signIn } from 'next-auth/react';

describe('Login Flow', () => {
  it('should login with valid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'SecurePass123!',
      redirect: false
    });

    expect(result?.error).toBeNull();
    expect(result?.ok).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    const result = await signIn('credentials', {
      email: 'test@example.com',
      password: 'WrongPassword',
      redirect: false
    });

    expect(result?.error).toBe('CredentialsSignin');
    expect(result?.ok).toBe(false);
  });
});
```

### 8.3 E2E Tests

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register new user', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="name"]', 'Test User');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should login and access protected page', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Home Inventory')).toBeVisible();

    await page.goto('/items');
    await expect(page).toHaveURL('/items'); // Not redirected
  });

  test('should redirect to login when accessing protected page', async ({ page }) => {
    await page.goto('/items');

    await expect(page).toHaveURL(/\/login/);
  });
});
```

---

## 9. Environment Variables

```env
# .env.local (Development)

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-generate-with-openssl

# Database
DATABASE_URL=file:./inventory.db

# Email (Development - logs to console)
EMAIL_SERVER=
EMAIL_FROM=noreply@localhost

# Optional: Rate Limiting
RATE_LIMIT_ENABLED=true
```

```env
# .env.production (Production)

# Next.js
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# NextAuth.js
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-with: openssl rand -base64 32>

# Database (Production - use Turso or similar)
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-turso-token

# Email (Production - use real SMTP)
EMAIL_SERVER=smtp://username:password@smtp.provider.com:587
EMAIL_FROM=noreply@yourdomain.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 10. Deployment Considerations

### 10.1 Vercel Deployment

**Configuration:**
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

**Database Options:**
- **Development**: SQLite (local file)
- **Production**: Turso (edge SQLite) or PostgreSQL

**Turso Setup:**
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create database
turso db create home-inventory

# Get connection string
turso db show home-inventory

# Update DATABASE_URL in Vercel
```

### 10.2 Security Checklist

- [ ] HTTPS enforced in production
- [ ] Secure cookies enabled (httpOnly, secure, sameSite)
- [ ] Strong NEXTAUTH_SECRET (32+ characters)
- [ ] Rate limiting enabled
- [ ] Content Security Policy headers
- [ ] Environment variables not committed
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection (React handles this)
- [ ] CSRF protection (NextAuth.js handles this)

---

## 11. Monitoring & Logging

### 11.1 Authentication Events to Log

```typescript
// src/lib/auth/audit.ts
import { prisma } from '@/lib/db';

interface AuditEvent {
  userId?: string;
  event: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export async function logAuthEvent(event: AuditEvent) {
  await prisma.auditLog.create({
    data: {
      userId: event.userId,
      event: event.event,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      success: event.success,
      metadata: event.metadata,
      timestamp: new Date()
    }
  });
}

// Events to log:
// - USER_REGISTERED
// - USER_LOGIN_SUCCESS
// - USER_LOGIN_FAILED
// - USER_LOGOUT
// - PASSWORD_RESET_REQUESTED
// - PASSWORD_RESET_COMPLETED
// - EMAIL_VERIFIED
// - ACCOUNT_LOCKED
// - ADMIN_ACTION
```

### 11.2 Metrics to Track

- Daily active users (DAU)
- Login success/failure rate
- Average session duration
- Password reset requests
- Account lockouts
- Failed authentication attempts by IP

---

## 12. Future Enhancements

### 12.1 OAuth Integration

```typescript
// auth.ts - Add OAuth providers
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({...}),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
});
```

### 12.2 Two-Factor Authentication

- TOTP implementation with `otplib`
- QR code generation with `qrcode`
- Backup codes generation
- SMS verification (optional)

### 12.3 Advanced Features

- Login history and device management
- Suspicious login detection
- Geolocation-based alerts
- API key generation for external access
- Webhook notifications for security events

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-10-12 | 1.0 | Requirements Analyst Agent | Initial architecture document |

---

## References

- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [Next.js 15 App Router](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

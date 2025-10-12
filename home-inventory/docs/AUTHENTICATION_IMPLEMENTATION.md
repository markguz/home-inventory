# NextAuth.js Backend Implementation

## Overview
Complete NextAuth.js v5 (beta) authentication backend implementation with credentials provider, JWT sessions, and user registration.

## Files Created

### Core Authentication
- **`/src/auth.ts`** - NextAuth.js v5 configuration
  - Credentials provider with email/password
  - JWT session strategy (30-day expiry)
  - Custom callbacks for user ID and role
  - Password verification using bcryptjs

- **`/src/app/api/auth/[...nextauth]/route.ts`** - API route handler
  - Exports GET and POST handlers from NextAuth

- **`/src/types/next-auth.d.ts`** - TypeScript declarations
  - Extended Session and User types with role
  - JWT token type definitions

### Utilities
- **`/src/lib/auth-utils.ts`** - Authentication helper functions
  - `hashPassword()` - Bcrypt password hashing (12 rounds)
  - `verifyPassword()` - Password verification
  - `getServerSession()` - Server-side session wrapper
  - `validatePassword()` - Password strength validation
  - `validateEmail()` - Email format validation

### API Endpoints
- **`/src/app/api/auth/register/route.ts`** - User registration
  - Email/password validation with Zod
  - Password strength requirements (8+ chars, uppercase, lowercase, number)
  - Duplicate email checking
  - Secure password hashing before storage

## Database Schema

### Models Added (via schema agent)
```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Bcrypt hashed
  name          String?
  role          UserRole  @default(USER)
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  items         Item[]
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(...)
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  provider          String
  providerAccountId String
  // OAuth fields...
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
}
```

## Environment Variables

Added to **`.env.example`**:
```bash
# NextAuth.js v5 Configuration
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Generate secret: `openssl rand -base64 32`

## Dependencies Installed

```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.29",
    "bcryptjs": "^3.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

## Database Migration

Applied migration: `20251012152259_add_user_authentication`
- Created User, Session, Account, VerificationToken tables
- Added UserRole enum
- Added userId foreign key to Items table
- Created default admin user

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Hashed with bcrypt (12 salt rounds)

## API Usage Examples

### User Registration
```typescript
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}

Response (201):
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "..."
  }
}
```

### Sign In (NextAuth)
```typescript
import { signIn } from "@/auth";

await signIn("credentials", {
  email: "user@example.com",
  password: "SecurePass123",
  redirect: false
});
```

### Get Session (Server Component)
```typescript
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <div>Welcome {session.user.name}</div>;
}
```

### Get Session (Client Component)
```typescript
"use client";
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return <div>Welcome {session.user.name}</div>;
}
```

## Security Features

1. **Password Hashing**: Bcrypt with 12 salt rounds
2. **Input Validation**: Zod schema validation + custom validators
3. **SQL Injection Protection**: Prisma ORM with parameterized queries
4. **Session Security**: JWT tokens with 30-day expiry
5. **Environment Secrets**: NEXTAUTH_SECRET for token signing
6. **Password Strength**: Enforced complexity requirements
7. **Duplicate Prevention**: Unique email constraint

## Next Steps (for Frontend Agent)

1. Create sign-in page at `/src/app/auth/signin/page.tsx`
2. Create sign-out page at `/src/app/auth/signout/page.tsx`
3. Create error page at `/src/app/auth/error/page.tsx`
4. Add SessionProvider wrapper in root layout
5. Create protected route middleware
6. Add sign in/out buttons to navigation

## Coordination Status

✅ Pre-task hook executed
✅ Post-edit hooks for auth files
✅ Memory stored in `.swarm/memory.db`
✅ Notification sent to swarm
✅ Post-task hook completed

## Testing Recommendations

1. Unit tests for auth-utils functions
2. Integration tests for registration API
3. E2E tests for sign-in flow
4. Security tests for password validation
5. Session persistence tests

## Default Admin User

A default admin user was created during migration:
- Email: `admin@homeinventory.local`
- Password: `admin123` (change immediately in production!)
- Role: ADMIN

---

**Implementation Date**: 2025-10-12
**Agent**: Backend Developer
**Status**: ✅ Complete

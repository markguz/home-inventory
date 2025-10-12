# Authentication Schema Documentation

## Overview

This document describes the authentication database schema designed for NextAuth.js v5 integration with the Home Inventory application. The schema supports both credentials-based authentication and OAuth providers for future extensibility.

## Schema Design Date
**2025-10-12** - Initial authentication schema design

## Database Models

### 1. User Model

The core user model that stores user account information.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String    // Hashed password - never store plain text
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
```

**Fields:**
- `id` (String): Primary key, auto-generated CUID
- `email` (String): Unique email address, indexed for fast lookups
- `password` (String): **Hashed password** using bcrypt/argon2 (min cost factor: 12 for bcrypt)
- `name` (String?): Optional display name
- `role` (UserRole): User role enum (USER or ADMIN), defaults to USER
- `emailVerified` (DateTime?): Timestamp when email was verified (for future email verification)
- `image` (String?): Optional profile image URL
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- One-to-many with `Item`: A user can own multiple items
- One-to-many with `Session`: A user can have multiple active sessions
- One-to-many with `Account`: A user can link multiple OAuth providers

**Indexes:**
- Unique index on `email` for authentication lookups
- Additional index on `email` for query performance

### 2. UserRole Enum

```prisma
enum UserRole {
  USER
  ADMIN
}
```

**Roles:**
- `USER`: Standard user with access to their own inventory
- `ADMIN`: Administrative user with elevated privileges (future: manage all users/items)

### 3. Session Model

Manages user sessions for NextAuth.js.

```prisma
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
```

**Fields:**
- `id` (String): Primary key
- `sessionToken` (String): Unique session token for authentication
- `userId` (String): Foreign key to User
- `expires` (DateTime): Session expiration timestamp
- `createdAt` (DateTime): Session creation time
- `updatedAt` (DateTime): Last update time

**Cascade Behavior:**
- When a User is deleted, all their Sessions are automatically deleted (onDelete: Cascade)

### 4. Account Model

Stores OAuth provider information for social login (Google, GitHub, etc.).

```prisma
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
```

**Purpose:** Future extensibility for OAuth providers (Google, GitHub, Microsoft, etc.)

**Fields:**
- Standard NextAuth.js Account adapter fields
- `provider`: OAuth provider name (e.g., "google", "github")
- `providerAccountId`: User ID from the OAuth provider
- OAuth tokens for API access

**Cascade Behavior:**
- When a User is deleted, all their Accounts are deleted (onDelete: Cascade)

### 5. VerificationToken Model

For email verification and password reset functionality.

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Purpose:**
- Email verification tokens
- Password reset tokens
- Magic link authentication (future)

**Fields:**
- `identifier`: Usually the user's email
- `token`: Unique verification token
- `expires`: Token expiration time

## Item Model Updates

The existing `Item` model has been updated to include user ownership:

```prisma
model Item {
  // ... existing fields ...
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... rest of fields ...

  @@index([userId])
}
```

**Key Changes:**
- Added `userId` field to track item ownership
- Added relation to User model
- Added index on `userId` for query performance
- **Cascade delete**: When a user is deleted, all their items are deleted

## Security Considerations

### 1. Password Storage
- **NEVER store plain text passwords**
- Use bcrypt with cost factor ≥ 12 or argon2id
- Hash passwords before storing in database
- Example (Next.js API route):
  ```typescript
  import bcrypt from 'bcryptjs';
  const hashedPassword = await bcrypt.hash(password, 12);
  ```

### 2. Email Uniqueness
- Email must be unique across all users
- Database constraint enforces uniqueness
- Handle duplicate email errors gracefully in UI

### 3. Session Management
- Sessions automatically expire based on `expires` field
- NextAuth.js handles session rotation
- Sessions are invalidated on password change

### 4. Role-Based Access Control (RBAC)
- `UserRole` enum enforces valid roles at database level
- Application layer should check roles before operations
- Default role is USER for new registrations

### 5. Cascade Delete Strategy
- **User deleted → Items deleted**: Items belong to users, no orphaned items
- **User deleted → Sessions deleted**: Automatically log out deleted users
- **User deleted → Accounts deleted**: Remove OAuth connections
- VerificationTokens are standalone (no user relation for security)

## Migration Strategy

### For New Databases
1. Run Prisma migration: `npx prisma migrate dev --name add-authentication`
2. Generate Prisma Client: `npx prisma generate`
3. Create initial admin user via seed script

### For Existing Databases
1. **Before migration:**
   - Backup database
   - Plan user assignment strategy for existing items

2. **During migration:**
   - Add userId column to Item table (nullable initially)
   - Create authentication tables

3. **After migration:**
   - Create default admin user
   - Assign all existing items to admin or appropriate users
   - Update userId to NOT NULL
   - Add foreign key constraint if not already present

### Migration Script
See: `/export/projects/homeinventory/home-inventory/prisma/migrations/add-authentication.sql`

## NextAuth.js Integration

This schema is fully compatible with NextAuth.js v5 Prisma Adapter.

**Configuration:**
```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  // ... other NextAuth configuration
};
```

## Database Indexes

### Performance Optimization
- `User.email`: Fast authentication lookups
- `Session.sessionToken`: Fast session validation
- `Session.userId`: Fast user session queries
- `Account.userId`: Fast OAuth account lookups
- `Account.[provider, providerAccountId]`: Unique OAuth accounts
- `Item.userId`: Fast user inventory queries

## Future Enhancements

### 1. Email Verification
- Implement email verification flow using VerificationToken
- Send verification emails on registration
- Require email verification before full access

### 2. Two-Factor Authentication (2FA)
- Add new model for 2FA secrets
- Support TOTP (Time-based One-Time Passwords)
- Backup codes for account recovery

### 3. OAuth Providers
- Enable Google OAuth
- Enable GitHub OAuth
- Enable Microsoft OAuth
- Link multiple providers to single account

### 4. Advanced RBAC
- Add more granular roles (MODERATOR, VIEWER, etc.)
- Implement permission system
- Role-based UI rendering

### 5. Audit Logging
- Track user login attempts
- Log item modifications with user info
- Security event logging

## Schema Relationships Diagram

```
User (1) ----< (*) Item
  |
  +----< (*) Session
  |
  +----< (*) Account

VerificationToken (standalone)
```

## Testing Considerations

### Unit Tests
- Test password hashing/verification
- Test unique email constraint
- Test cascade deletes
- Test role assignments

### Integration Tests
- Test user registration flow
- Test login/logout flow
- Test session management
- Test item ownership queries

### Security Tests
- Test SQL injection prevention
- Test password complexity requirements
- Test session hijacking prevention
- Test CSRF protection

## Maintenance Notes

### Regular Tasks
- Review and expire old sessions
- Clean up expired verification tokens
- Monitor failed login attempts
- Audit user roles periodically

### Performance Monitoring
- Monitor index usage
- Track slow authentication queries
- Optimize session lookups if needed

## References

- NextAuth.js v5 Documentation: https://next-auth.js.org
- Prisma Schema Reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- bcrypt Best Practices: https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Author:** Database Architect Agent
**Status:** Ready for Implementation

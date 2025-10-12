# Authentication Requirements - Home Inventory System

## Document Information
- **Created**: 2025-10-12
- **Author**: Requirements Analyst Agent
- **Status**: Draft
- **Target Framework**: Next.js 15.5.4 with App Router
- **Auth Solution**: NextAuth.js v5 (Auth.js beta.29)

---

## 1. Overview

This document outlines the authentication and authorization requirements for the Home Inventory System. The system will support user registration, login, session management, and role-based access control to ensure that users can securely manage their personal inventory data.

### Key Objectives
- Secure user authentication with email/password
- Session-based authentication with JWT tokens
- Password security with bcryptjs hashing
- Role-based authorization (USER and ADMIN roles)
- Protection of user-specific inventory data
- Support for future OAuth providers (Google, GitHub)

---

## 2. Authentication Requirements

### 2.1 User Registration

**Functional Requirements:**
- Users must register with a unique email address
- Password must meet minimum security requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Optional: User's full name
- Email verification token generation
- Automatic USER role assignment on registration

**Technical Requirements:**
- Email uniqueness validation
- Password hashing using bcryptjs (salt rounds: 12)
- NEVER store plain text passwords
- Input validation using Zod schemas
- Server-side validation in Server Actions
- CSRF protection via NextAuth.js

**Data Model (Already Implemented in Prisma):**
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

  items         Item[]
  sessions      Session[]
  accounts      Account[]
}

enum UserRole {
  USER
  ADMIN
}
```

### 2.2 User Login

**Functional Requirements:**
- Login with email and password
- Session creation on successful authentication
- "Remember me" functionality (extended session duration)
- Failed login attempt tracking (rate limiting)
- Clear error messages without revealing if email exists

**Technical Requirements:**
- Password verification using bcryptjs.compare()
- Session token generation with secure random values
- HTTP-only cookies for session storage
- Session expiration: 30 days (default), 90 days (remember me)
- Secure session token storage in database
- Server-side session validation

**Security Considerations:**
- Rate limiting: Max 5 failed attempts per 15 minutes per IP
- Account lockout after 10 failed attempts (requires admin unlock or time-based unlock)
- No information leakage about existing accounts
- Protection against timing attacks

### 2.3 Session Management

**Functional Requirements:**
- Persistent sessions across page refreshes
- Automatic session renewal on activity
- Manual logout functionality
- "Logout all devices" functionality
- Session expiration handling with redirect to login

**Technical Requirements:**
- Session model (Already in Prisma):
```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Session Flow:**
1. User logs in successfully
2. NextAuth.js creates session token
3. Session stored in database with expiration
4. HTTP-only cookie set in browser
5. Middleware validates session on each request
6. Expired sessions automatically cleaned up

### 2.4 Password Management

**Functional Requirements:**
- Password reset via email token
- Token expiration (15 minutes)
- One-time use tokens
- Password change for logged-in users
- Password strength indicator during registration/reset

**Technical Requirements:**
- VerificationToken model (Already in Prisma):
```prisma
model VerificationToken {
  identifier String   // User email
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Password Hashing Strategy:**
```typescript
import bcrypt from 'bcryptjs';

// Registration/Password Change
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Login verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 2.5 Email Verification

**Functional Requirements:**
- Email verification required before full account access
- Verification email sent on registration
- Resend verification email functionality
- Verification link expires after 24 hours

**Technical Requirements:**
- Generate unique verification token
- Store in VerificationToken table
- Send email with verification link
- Mark emailVerified timestamp on successful verification
- Restrict certain features until verified

---

## 3. Authorization Requirements

### 3.1 Role-Based Access Control (RBAC)

**User Roles:**

1. **USER (Default)**
   - View own inventory items
   - Create, update, delete own items
   - View own categories, locations, tags
   - Manage own profile
   - View own statistics and alerts

2. **ADMIN**
   - All USER permissions
   - View all users and their inventories
   - Manage user accounts (suspend, delete, role changes)
   - Access system-wide statistics
   - Manage global categories/tags (if implemented)
   - Access admin dashboard

**Implementation Strategy:**
```typescript
// Utility function for role checking
export function hasRole(user: User, role: UserRole): boolean {
  return user.role === role;
}

export function isAdmin(user: User): boolean {
  return user.role === 'ADMIN';
}
```

### 3.2 Route Protection

**Public Routes (No Authentication Required):**
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form
- `/verify-email` - Email verification
- `/api/auth/*` - NextAuth.js API routes

**Protected Routes (Authentication Required):**
- `/` - Dashboard (authenticated users only)
- `/items` - Inventory items list
- `/items/new` - Add new item
- `/items/[id]` - View/edit item
- `/categories` - Categories management
- `/alerts` - Low quantity alerts
- `/profile` - User profile
- `/settings` - User settings

**Admin-Only Routes:**
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/statistics` - System statistics

**Implementation:**
- Next.js middleware for route protection
- Server Component session checking
- Redirect to login for unauthenticated access
- Show 403 error for unauthorized access

### 3.3 API Endpoint Protection

**Public API Endpoints:**
- None (all require authentication)

**Authenticated API Endpoints:**
- `GET /api/items` - List user's items
- `POST /api/items` - Create item (auto-assign userId)
- `GET /api/items/[id]` - Get item (owner check)
- `PUT /api/items/[id]` - Update item (owner check)
- `DELETE /api/items/[id]` - Delete item (owner check)
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/locations` - List locations
- `GET /api/tags` - List tags
- `GET /api/alerts` - Get low quantity alerts

**Admin API Endpoints:**
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user

**Security Measures:**
- Session validation on every API request
- Owner verification for resource access
- Role verification for admin endpoints
- Input validation with Zod
- SQL injection prevention via Prisma
- Rate limiting on sensitive endpoints

### 3.4 Data Access Control

**User Data Isolation:**
- Users can ONLY access their own inventory items
- Database queries must filter by userId
- Server Actions must verify ownership

**Implementation Example:**
```typescript
// CORRECT: Filter by user ID
export async function getUserItems(userId: string) {
  return await prisma.item.findMany({
    where: { userId }
  });
}

// INCORRECT: Would expose all items
export async function getAllItems() {
  return await prisma.item.findMany(); // SECURITY RISK
}
```

**Admin Data Access:**
- Admins can view all data with explicit role check
- Audit logging for admin actions
- Separate functions for admin operations

---

## 4. Security Requirements

### 4.1 Password Security

- Minimum password length: 8 characters
- Complexity requirements enforced
- Bcryptjs hashing with salt rounds: 12
- No password in API responses
- No password in client-side JavaScript
- Password reset tokens expire in 15 minutes

### 4.2 Session Security

- HTTP-only cookies (no JavaScript access)
- Secure flag in production (HTTPS only)
- SameSite: Lax (CSRF protection)
- Session tokens use cryptographically secure random values
- Session expiration enforced server-side
- Automatic session cleanup of expired sessions

### 4.3 CSRF Protection

- NextAuth.js built-in CSRF protection
- CSRF tokens in forms
- Server Actions with Next.js form actions
- SameSite cookie attribute

### 4.4 XSS Protection

- React automatic escaping
- Content Security Policy headers
- No dangerouslySetInnerHTML usage
- Input sanitization where needed

### 4.5 Rate Limiting

- Login attempts: 5 per 15 minutes per IP
- Password reset: 3 requests per hour per email
- API endpoints: 100 requests per minute per user
- Registration: 3 attempts per hour per IP

---

## 5. User Experience Requirements

### 5.1 Login/Registration Flow

1. **First Visit**
   - Redirect to login page
   - Show register option
   - Social login buttons (future)

2. **Registration Process**
   - Simple form (email, password, name)
   - Real-time password strength indicator
   - Clear error messages
   - Email verification sent
   - Redirect to dashboard with verification notice

3. **Login Process**
   - Email and password fields
   - "Remember me" checkbox
   - "Forgot password" link
   - Clear error messages
   - Redirect to intended page or dashboard

4. **Email Verification**
   - Prominent banner for unverified users
   - Resend verification button
   - Restrict critical actions until verified

### 5.2 Session Management UX

- Show user name/email in header
- Dropdown menu with:
  - Profile link
  - Settings link
  - Logout button
- No session expiration warnings needed (auto-refresh)
- Graceful handling of expired sessions

### 5.3 Error Messages

- **Login Errors**: "Invalid email or password" (don't specify which)
- **Registration Errors**: Specific field errors (email taken, weak password)
- **Session Expired**: "Your session has expired. Please log in again."
- **Unauthorized**: "You don't have permission to access this resource."

---

## 6. Implementation Checklist

### Phase 1: Core Authentication
- [ ] Set up NextAuth.js v5 configuration
- [ ] Create auth.ts with providers configuration
- [ ] Implement Credentials provider with bcryptjs
- [ ] Create login page UI
- [ ] Create registration page UI
- [ ] Implement registration Server Action
- [ ] Implement login Server Action
- [ ] Set up middleware for route protection
- [ ] Test authentication flow

### Phase 2: Session Management
- [ ] Configure session strategy (JWT + Database)
- [ ] Implement session refresh logic
- [ ] Create logout functionality
- [ ] Add "Remember me" feature
- [ ] Test session expiration handling

### Phase 3: Authorization
- [ ] Add role checking utilities
- [ ] Protect routes with middleware
- [ ] Add owner verification to API routes
- [ ] Implement admin-only routes
- [ ] Update database queries to filter by userId
- [ ] Test authorization rules

### Phase 4: Password Management
- [ ] Create forgot password page
- [ ] Implement password reset email
- [ ] Create reset password page
- [ ] Implement password change functionality
- [ ] Add password strength indicator
- [ ] Test password reset flow

### Phase 5: Email Verification
- [ ] Implement email verification token generation
- [ ] Create verification email template
- [ ] Create email verification page
- [ ] Add unverified user banner
- [ ] Implement resend verification
- [ ] Test verification flow

### Phase 6: Security Hardening
- [ ] Implement rate limiting
- [ ] Add account lockout logic
- [ ] Set up proper cookie flags
- [ ] Add Content Security Policy
- [ ] Security audit and testing
- [ ] Penetration testing (if required)

---

## 7. Testing Requirements

### Unit Tests
- Password hashing and verification
- Role checking utilities
- Session validation logic
- Token generation and validation

### Integration Tests
- Registration flow
- Login flow
- Logout flow
- Password reset flow
- Email verification flow
- Session management

### E2E Tests (Playwright)
- User registration and login
- Protected route access
- Admin-only route access
- Unauthorized access attempts
- Session expiration handling

### Security Tests
- SQL injection attempts
- XSS attempts
- CSRF attempts
- Brute force protection
- Session hijacking prevention

---

## 8. Future Enhancements

### OAuth Providers
- Google OAuth integration
- GitHub OAuth integration
- Account linking (email + OAuth)

### Two-Factor Authentication (2FA)
- TOTP (Time-based One-Time Password)
- Backup codes
- SMS verification (optional)

### Advanced Features
- Login history tracking
- Device management
- Security notifications
- API key generation for external access
- Audit logging for sensitive actions

---

## 9. Dependencies Summary

### Required NPM Packages (Already Installed)
```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.29",
    "bcryptjs": "^3.0.2",
    "jose": "^6.1.0",
    "@prisma/client": "^6.17.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

### Environment Variables Required
```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-secure-random-string>

# Database
DATABASE_URL=file:./inventory.db

# Email (for verification and password reset)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```

---

## 10. Success Criteria

The authentication implementation will be considered complete when:

1. Users can successfully register with email/password
2. Passwords are securely hashed and never exposed
3. Users can log in and maintain sessions
4. Users can only access their own inventory data
5. Admins can access admin-only routes
6. Middleware correctly protects routes
7. Session expiration is handled gracefully
8. Password reset flow works end-to-end
9. Email verification flow works end-to-end
10. All security tests pass
11. No authentication vulnerabilities in security audit

---

## Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-10-12 | 1.0 | Requirements Analyst Agent | Initial requirements document |

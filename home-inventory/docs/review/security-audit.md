# Security Audit - Home Inventory Application

**Audit Date:** 2025-10-10
**Auditor:** Reviewer Agent (Hive Mind Swarm)
**Project:** Next.js Home Inventory System
**Phase:** Initial Scaffolding

---

## Executive Summary

This security audit evaluates the Home Inventory application at its initial development phase. The current boilerplate code is secure with no vulnerabilities detected. This document establishes security requirements and guidelines for future development.

### Overall Security Status: ✅ SECURE (Boilerplate)

**Risk Level:** LOW (current), MEDIUM (future development)

---

## 1. Current Security Assessment

### ✅ Secure Elements

1. **No Hardcoded Secrets**
   - No API keys in code ✅
   - No passwords or tokens ✅
   - No connection strings ✅

2. **External Link Security**
   - All external links use `rel="noopener noreferrer"` ✅
   - Prevents window.opener vulnerabilities ✅

3. **Dependencies**
   - All dependencies are up-to-date ✅
   - No known security vulnerabilities ✅
   - Using official packages from npm ✅

4. **TypeScript Safety**
   - Strict mode enabled ✅
   - Type safety throughout ✅

---

## 2. Threat Model

### Potential Threats for Home Inventory Application

#### 🔴 Critical Threats

1. **Authentication Bypass**
   - **Risk:** Unauthorized access to user data
   - **Impact:** Data breach, privacy violation
   - **Mitigation:** Implement robust authentication

2. **SQL Injection**
   - **Risk:** Database manipulation/data exfiltration
   - **Impact:** Complete data loss or corruption
   - **Mitigation:** Use Prisma (parameterized queries)

3. **XSS (Cross-Site Scripting)**
   - **Risk:** Malicious script injection
   - **Impact:** Session hijacking, data theft
   - **Mitigation:** Proper input sanitization, React's built-in escaping

#### 🟡 High Threats

4. **CSRF (Cross-Site Request Forgery)**
   - **Risk:** Unauthorized actions on behalf of user
   - **Impact:** Data modification, unauthorized operations
   - **Mitigation:** CSRF tokens, SameSite cookies

5. **File Upload Vulnerabilities**
   - **Risk:** Malicious file uploads (for item images)
   - **Impact:** Server compromise, malware distribution
   - **Mitigation:** File type validation, size limits, scanning

6. **Session Management Issues**
   - **Risk:** Session hijacking, fixation
   - **Impact:** Account takeover
   - **Mitigation:** Secure session configuration, httpOnly cookies

#### 🟢 Medium Threats

7. **Information Disclosure**
   - **Risk:** Sensitive data exposure in errors
   - **Impact:** Information leakage
   - **Mitigation:** Proper error handling

8. **Insecure Direct Object References (IDOR)**
   - **Risk:** Access to other users' inventory items
   - **Impact:** Privacy violation
   - **Mitigation:** Authorization checks on all resources

---

## 3. Security Requirements

### A. Authentication & Authorization

#### Required Implementation:

```typescript
// ✅ RECOMMENDED: NextAuth.js v5

// /lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

// Middleware for protected routes
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }
  return session;
}
```

#### Security Checklist:

- [ ] Implement password hashing (bcrypt/argon2)
- [ ] Set minimum password requirements (12+ chars, complexity)
- [ ] Implement rate limiting on auth endpoints
- [ ] Add account lockout after failed attempts
- [ ] Implement email verification
- [ ] Add two-factor authentication (optional but recommended)
- [ ] Use secure session cookies (httpOnly, secure, sameSite)
- [ ] Implement proper logout with session invalidation

### B. Input Validation & Sanitization

#### Required Implementation:

```typescript
// ✅ Use Zod for all input validation

// /lib/schemas/inventory.ts
import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .trim(),

  description: z.string()
    .max(1000, "Description too long")
    .trim()
    .optional(),

  category: z.enum([
    "home",
    "garage",
    "vehicle",
    "other"
  ]),

  location: z.string()
    .min(1, "Location is required")
    .max(200, "Location too long")
    .trim(),

  quantity: z.number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(999999, "Quantity too large"),

  value: z.number()
    .min(0, "Value cannot be negative")
    .max(999999999, "Value too large")
    .optional(),

  purchaseDate: z.date()
    .max(new Date(), "Purchase date cannot be in the future")
    .optional(),

  imageUrl: z.string()
    .url("Invalid image URL")
    .optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

// Usage in API route
export async function POST(request: Request) {
  const session = await requireAuth();

  const body = await request.json();

  // Validate input
  const result = createItemSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.format() },
      { status: 400 }
    );
  }

  const data = result.data;

  // Proceed with validated data...
}
```

#### Validation Checklist:

- [ ] Validate all user inputs on server-side
- [ ] Use Zod schemas for all API routes
- [ ] Validate file uploads (type, size, content)
- [ ] Sanitize HTML content if allowing rich text
- [ ] Validate URLs before redirecting
- [ ] Implement rate limiting on input endpoints

### C. Database Security

#### Required Implementation:

```typescript
// ✅ SECURE: Use Prisma with proper authorization

// /lib/db/inventory.ts
import { prisma } from "@/lib/db";

export async function getUserItems(userId: string) {
  // Always filter by user
  return prisma.item.findMany({
    where: {
      userId, // ✅ CRITICAL: Always filter by authenticated user
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getItem(itemId: string, userId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  // ✅ CRITICAL: Verify ownership
  if (!item || item.userId !== userId) {
    throw new Error("Item not found");
  }

  return item;
}

export async function updateItem(
  itemId: string,
  userId: string,
  data: UpdateItemInput
) {
  // ✅ CRITICAL: Verify ownership before update
  const item = await getItem(itemId, userId);

  return prisma.item.update({
    where: { id: itemId },
    data,
  });
}

export async function deleteItem(itemId: string, userId: string) {
  // ✅ CRITICAL: Verify ownership before delete
  const item = await getItem(itemId, userId);

  return prisma.item.delete({
    where: { id: itemId },
  });
}
```

#### Database Security Checklist:

- [ ] Use Prisma for all database operations (prevents SQL injection)
- [ ] Always filter queries by authenticated user
- [ ] Verify ownership before any CRUD operation
- [ ] Use transactions for multi-step operations
- [ ] Implement proper indexes for performance
- [ ] Never expose database errors to client
- [ ] Use connection pooling
- [ ] Enable query logging in development

### D. API Security

#### Required Implementation:

```typescript
// /middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // HSTS (in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

#### API Security Checklist:

- [ ] Implement rate limiting (use Upstash or similar)
- [ ] Add CORS configuration if needed
- [ ] Use HTTPS in production (enforce)
- [ ] Implement proper error handling (don't leak info)
- [ ] Add request size limits
- [ ] Validate Content-Type headers
- [ ] Implement API versioning
- [ ] Use API keys for external integrations

### E. File Upload Security

#### Required Implementation:

```typescript
// /lib/upload.ts
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const fileUploadSchema = z.object({
  file: z.custom<File>()
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      "File size must be less than 5MB"
    )
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type as any),
      "File must be JPEG, PNG, or WebP"
    ),
});

export async function validateAndProcessFile(file: File) {
  // Validate
  const result = fileUploadSchema.safeParse({ file });
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  // Additional checks
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Verify file signature (magic bytes)
  const isValidJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const isValidPNG = bytes[0] === 0x89 && bytes[1] === 0x50;
  const isValidWebP = bytes[8] === 0x57 && bytes[9] === 0x45;

  if (!isValidJPEG && !isValidPNG && !isValidWebP) {
    throw new Error("Invalid file format");
  }

  return buffer;
}
```

#### File Upload Checklist:

- [ ] Validate file type (MIME type AND magic bytes)
- [ ] Enforce file size limits
- [ ] Generate random filenames (prevent overwrite/path traversal)
- [ ] Store files outside web root or use cloud storage
- [ ] Scan files for malware if possible
- [ ] Implement upload rate limiting
- [ ] Use Content-Disposition: attachment for downloads
- [ ] Implement image optimization

### F. Environment Variables

#### Required Implementation:

```typescript
// /lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

```bash
# .env.example (commit this)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

#### Environment Security Checklist:

- [ ] Never commit .env files
- [ ] Use different secrets for dev/staging/prod
- [ ] Rotate secrets regularly
- [ ] Use strong random values (32+ bytes)
- [ ] Validate all environment variables on startup
- [ ] Never expose secrets to client
- [ ] Use secret management service in production

---

## 4. Security Testing

### Required Tests

#### A. Authentication Tests
```typescript
describe("Authentication", () => {
  it("should reject invalid credentials", async () => {
    // Test implementation
  });

  it("should lock account after failed attempts", async () => {
    // Test implementation
  });

  it("should require strong passwords", async () => {
    // Test implementation
  });
});
```

#### B. Authorization Tests
```typescript
describe("Authorization", () => {
  it("should prevent users from accessing other users' items", async () => {
    // Test implementation
  });

  it("should require authentication for protected routes", async () => {
    // Test implementation
  });
});
```

#### C. Input Validation Tests
```typescript
describe("Input Validation", () => {
  it("should reject invalid item data", async () => {
    // Test implementation
  });

  it("should sanitize user input", async () => {
    // Test implementation
  });
});
```

---

## 5. Security Monitoring

### Required Monitoring:

- [ ] Log all authentication events
- [ ] Log failed authorization attempts
- [ ] Monitor rate limit violations
- [ ] Track file upload patterns
- [ ] Alert on suspicious activity
- [ ] Regular security audits

### Recommended Tools:

- **Error Tracking:** Sentry
- **Log Management:** Datadog, LogRocket
- **Security Scanning:** Snyk, Dependabot
- **Penetration Testing:** OWASP ZAP

---

## 6. Compliance

### Data Protection:

- [ ] GDPR compliance (if applicable)
  - Right to access
  - Right to deletion
  - Data export functionality
  - Privacy policy

- [ ] Data encryption at rest (database)
- [ ] Data encryption in transit (HTTPS)
- [ ] Secure data backup procedures

---

## 7. Incident Response Plan

### Preparation:

1. Document all security contacts
2. Maintain list of critical systems
3. Keep backup access methods
4. Document recovery procedures

### Detection:

1. Monitor logs for anomalies
2. Set up automated alerts
3. Regular security reviews

### Response:

1. Contain the incident
2. Assess the damage
3. Notify affected users
4. Document the incident
5. Implement fixes
6. Post-mortem review

---

## 8. Pre-Production Security Checklist

### Critical (Must Complete):

- [ ] All authentication implemented and tested
- [ ] All authorization checks in place
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Secrets in environment variables
- [ ] Database connections secured
- [ ] Error handling doesn't leak info

### High Priority:

- [ ] Rate limiting implemented
- [ ] File upload security
- [ ] CSRF protection
- [ ] XSS protection verified
- [ ] Dependency audit passed
- [ ] Security tests passing

### Medium Priority:

- [ ] Monitoring and alerting
- [ ] Incident response plan
- [ ] Security documentation
- [ ] Penetration testing
- [ ] Compliance requirements met

---

## 9. Security Score

### Current: N/A (No Features Implemented)

### Target for Production: 95+/100

**Scoring Criteria:**
- Authentication: 20 points
- Authorization: 20 points
- Input Validation: 15 points
- Database Security: 15 points
- Infrastructure Security: 15 points
- Monitoring & Response: 10 points
- Compliance: 5 points

---

## 10. Next Steps

1. **Immediate:** Implement authentication framework
2. **Phase 1:** Implement authorization and input validation
3. **Phase 2:** Set up monitoring and logging
4. **Phase 3:** Security testing and auditing
5. **Pre-Production:** Complete security checklist
6. **Post-Launch:** Continuous monitoring and updates

---

**Auditor:** Reviewer Agent (Hive Mind)
**Next Audit:** After authentication implementation
**Review Cadence:** Weekly during development, Monthly in production

# Home Inventory System - Security Considerations

## Executive Summary

This document outlines security requirements, threat analysis, and mitigation strategies for the home inventory management system. The MVP focuses on single-user, local-first architecture with clear security requirements for future multi-user expansion.

---

## 1. Security Context

### 1.1 Application Type
- **MVP**: Single-user, local-first application
- **Data Sensitivity**: Moderate to High
  - Item names/descriptions: Low sensitivity
  - Purchase prices: Medium sensitivity
  - Serial numbers: Medium sensitivity
  - Home layout (locations): Medium-High sensitivity
  - Images of valuables: High sensitivity
  - Combined inventory: High value target for theft planning

### 1.2 Threat Model

**Primary Threats**:
1. **Data Exposure**: Unauthorized access to inventory data
2. **Malicious Input**: Code injection via forms
3. **Image Upload Abuse**: Malicious file uploads
4. **Physical Device Access**: Lost/stolen device with inventory data
5. **Man-in-the-Middle**: Network interception (future multi-user)

**Out of Scope for MVP**:
- Account hijacking (no authentication in MVP)
- Privilege escalation (single-user only)
- API abuse (no public API)
- Distributed attacks (DDoS)

---

## 2. Input Validation and Sanitization

### 2.1 Form Input Validation

**Client-Side Validation** (First line of defense):
```typescript
import { z } from 'zod'

const itemSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(200, "Name too long")
    .trim()
    .refine(val => !/<script|javascript:/i.test(val), "Invalid characters"),

  description: z.string()
    .max(2000, "Description too long")
    .trim()
    .optional(),

  location: z.string()
    .min(1, "Location is required")
    .max(100, "Location too long")
    .trim(),

  quantity: z.number()
    .int("Must be whole number")
    .min(0, "Cannot be negative")
    .max(999999, "Quantity too large"),

  purchasePrice: z.number()
    .positive("Must be positive")
    .max(9999999.99, "Price too large")
    .optional(),

  serialNumber: z.string()
    .max(100)
    .regex(/^[A-Za-z0-9\-]+$/, "Invalid serial number format")
    .optional(),

  imageUrl: z.string()
    .url("Invalid URL")
    .or(z.string().regex(/^\/uploads\//, "Invalid image path"))
    .optional()
})

type ItemFormData = z.infer<typeof itemSchema>
```

**Server-Side Validation** (Required, never trust client):
```typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { itemSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with Zod
    const validatedData = itemSchema.parse(body)

    // Additional server-side checks
    if (await isDuplicateItem(validatedData.name)) {
      return NextResponse.json(
        { error: 'Item already exists' },
        { status: 409 }
      )
    }

    // Proceed with database insert
    const item = await createItem(validatedData)

    return NextResponse.json(item, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### 2.2 SQL Injection Prevention

**Use Parameterized Queries** (Drizzle ORM automatically parameterizes):
```typescript
// ✅ SAFE: Parameterized query
const items = await db.select()
  .from(items)
  .where(eq(items.name, userInput)) // Safe: userInput is parameterized

// ❌ UNSAFE: String concatenation (DON'T DO THIS)
const items = await db.execute(
  sql`SELECT * FROM items WHERE name = '${userInput}'`
) // Vulnerable to SQL injection
```

**Proper SQL Template Usage**:
```typescript
// ✅ SAFE: Use sql.placeholder for dynamic values
const searchQuery = sql`
  SELECT * FROM items
  WHERE name LIKE ${sql.placeholder('query')}
`
const items = await db.execute(searchQuery, { query: `%${userInput}%` })
```

**Database User Permissions** (Future PostgreSQL):
```sql
-- Create restricted app user
CREATE USER inventory_app WITH PASSWORD 'strong_password';

-- Grant minimal necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO inventory_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO inventory_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO inventory_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON items_to_tags TO inventory_app;

-- Deny dangerous operations
REVOKE CREATE, DROP, ALTER ON DATABASE inventory FROM inventory_app;
```

---

### 2.3 XSS (Cross-Site Scripting) Prevention

**React's Built-in Protection**:
```tsx
// ✅ SAFE: React automatically escapes
<div>{item.name}</div> // User input is escaped

// ✅ SAFE: Attributes are escaped
<input value={item.name} />

// ❌ UNSAFE: dangerouslySetInnerHTML (avoid!)
<div dangerouslySetInnerHTML={{ __html: item.description }} />
```

**Content Security Policy** (CSP):
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires these
      "style-src 'self' 'unsafe-inline'", // Tailwind requires inline styles
      "img-src 'self' data: https://res.cloudinary.com", // Allow Cloudinary images
      "font-src 'self'",
      "connect-src 'self' https://api.cloudinary.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ]
  }
}
```

**DOMPurify for Rich Text** (if needed):
```typescript
import DOMPurify from 'isomorphic-dompurify'

// Sanitize HTML before rendering
const sanitizedDescription = DOMPurify.sanitize(item.description, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  ALLOWED_ATTR: []
})
```

---

## 3. Image Upload Security

### 3.1 File Upload Validation

**Client-Side Validation**:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

function validateImageFile(file: File): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 5MB'
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'File type must be JPG, PNG, WebP, or HEIC'
  }

  // Check filename
  if (!/^[\w\-. ]+$/.test(file.name)) {
    return 'Invalid filename'
  }

  return null // Valid
}
```

**Server-Side Validation** (Critical):
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import crypto from 'crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    // Read file buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file type by reading magic bytes (not just MIME type)
    const fileType = await sharp(buffer).metadata()

    if (!['jpeg', 'png', 'webp'].includes(fileType.format || '')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Generate secure filename
    const hash = crypto.randomBytes(16).toString('hex')
    const filename = `${hash}.webp`

    // Process and optimize image
    const processedImage = await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer()

    // Save to disk or upload to Cloudinary
    const imageUrl = await saveImage(filename, processedImage)

    return NextResponse.json({ url: imageUrl }, { status: 200 })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
```

---

### 3.2 Image Storage Security

**Local Filesystem** (MVP):
```typescript
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Secure file save
async function saveImageLocally(filename: string, buffer: Buffer) {
  // Use absolute path outside web root for better security
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'items')

  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true })

  // Construct full path
  const filepath = join(uploadDir, filename)

  // Validate path (prevent directory traversal)
  if (!filepath.startsWith(uploadDir)) {
    throw new Error('Invalid file path')
  }

  // Write file
  await writeFile(filepath, buffer, { mode: 0o644 }) // Read-only for group/others

  return `/uploads/items/${filename}`
}
```

**Cloudinary** (Production):
```typescript
import cloudinary from '@/lib/cloudinary'

async function saveImageToCloudinary(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: 'inventory-items',
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'webp'],
        max_file_size: 5242880, // 5MB
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        // Security options
        access_control: [
          { access_type: 'anonymous' } // Public read (for MVP)
        ],
        moderation: 'manual' // Optional: Manual review for inappropriate content
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    ).end(buffer)
  })
}
```

---

### 3.3 Image Serving Security

**Prevent Hotlinking** (Bandwidth theft):
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // Allow same-origin or no referer (direct access)
    if (referer && !referer.includes(host || '')) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  return NextResponse.next()
}
```

---

## 4. Data Privacy and Protection

### 4.1 Local Data Storage

**SQLite Database Security** (MVP):
```typescript
// Encrypt database file (optional, for high-security needs)
import Database from 'better-sqlite3'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

// Use SQLCipher for encryption (optional)
// npm install @journeyapps/sqlcipher
import SQLCipher from '@journeyapps/sqlcipher'

const db = new SQLCipher('inventory.db')
db.pragma('key = "user-password-here"') // Encrypt database
```

**File System Permissions**:
```bash
# Restrict database file access (Linux/Mac)
chmod 600 inventory.db  # Owner read/write only
chown appuser:appuser inventory.db

# Restrict uploads directory
chmod 755 public/uploads  # Owner full, others read/execute
chmod 644 public/uploads/items/*  # Files read-only for others
```

---

### 4.2 Data at Rest

**Environment Variables** (Never commit secrets):
```bash
# .env.local (gitignored)
DATABASE_URL="file:./inventory.db"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Environment Variable Validation**:
```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test'])
})

export const env = envSchema.parse(process.env)
```

---

### 4.3 Data in Transit (Future Multi-User)

**HTTPS Enforcement**:
```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://yourdomain.com/:path*',
        permanent: true
      }
    ]
  }
}
```

**HSTS (HTTP Strict Transport Security)**:
```typescript
// Security headers (added to CSP configuration above)
{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload'
}
```

---

## 5. Authentication and Authorization (Future)

### 5.1 MVP Approach (No Auth)

**Current State**:
- Single-user, local-first application
- No authentication required
- Security relies on device-level protection
- User responsible for device security (lock screen, etc.)

**Considerations**:
- Store "device fingerprint" to detect if database moved
- Optional: Simple PIN/password for app access
- No user management needed

---

### 5.2 Future Multi-User Authentication

**Recommended: NextAuth.js with JWT**:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await getUserByEmail(credentials.email)

        if (!user || !user.hashedPassword) {
          return null
        }

        const isValid = await compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: '/login'
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**Password Security**:
```typescript
import { hash } from 'bcryptjs'

// Password requirements
const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')

// Hash password
const hashedPassword = await hash(password, 12) // 12 rounds
```

---

### 5.3 Authorization (Row-Level Security)

**Database-Level (Future PostgreSQL)**:
```sql
-- Enable Row-Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own items
CREATE POLICY items_user_policy ON items
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::UUID);

-- Set user context in connection
SET app.current_user_id = 'user-uuid-here';
```

**Application-Level**:
```typescript
// Middleware to check ownership
export async function getUserItem(itemId: string, userId: string) {
  const item = await db.query.items.findFirst({
    where: and(
      eq(items.id, itemId),
      eq(items.userId, userId) // Ownership check
    )
  })

  if (!item) {
    throw new Error('Item not found or access denied')
  }

  return item
}
```

---

## 6. Rate Limiting and Abuse Prevention

### 6.1 API Rate Limiting

**Using upstash/ratelimit**:
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true
})

// Apply to API routes
export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Process request
}
```

---

### 6.2 CSRF Protection

**Built-in Next.js Protection** (Server Actions):
```typescript
// Server Actions have CSRF protection by default
'use server'

import { revalidatePath } from 'next/cache'

export async function createItem(formData: FormData) {
  // Automatically protected against CSRF
  // ...
}
```

**Custom API Routes**:
```typescript
// Use next-csrf package
import { createCsrfProtect } from '@edge-csrf/nextjs'

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production'
  }
})

export async function POST(request: NextRequest) {
  const csrfError = await csrfProtect(request)

  if (csrfError) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Process request
}
```

---

## 7. Logging and Monitoring

### 7.1 Security Event Logging

```typescript
// lib/security-logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
})

export function logSecurityEvent(event: string, details: any) {
  logger.warn({
    timestamp: new Date().toISOString(),
    event,
    ...details
  })
}

// Usage
logSecurityEvent('failed_login', {
  email: 'user@example.com',
  ip: request.ip,
  userAgent: request.headers.get('user-agent')
})

logSecurityEvent('suspicious_upload', {
  filename: file.name,
  size: file.size,
  type: file.type,
  ip: request.ip
})
```

---

### 7.2 Error Handling (Don't Leak Info)

```typescript
// ❌ BAD: Exposes internal details
catch (error) {
  return NextResponse.json({
    error: error.message, // Could leak SQL structure, file paths, etc.
    stack: error.stack
  }, { status: 500 })
}

// ✅ GOOD: Generic error message
catch (error) {
  console.error('Internal error:', error) // Log internally only

  return NextResponse.json({
    error: 'An error occurred. Please try again.'
  }, { status: 500 })
}
```

---

## 8. Security Checklist

### 8.1 Development Phase
- [ ] Input validation on all forms (client + server)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React escaping + CSP)
- [ ] Image upload validation (size, type, content)
- [ ] Environment variables for secrets
- [ ] HTTPS in production
- [ ] Security headers configured
- [ ] Error handling doesn't leak info
- [ ] Rate limiting on API routes
- [ ] CSRF protection on forms
- [ ] File upload restrictions
- [ ] Path traversal prevention

### 8.2 Deployment Phase
- [ ] HTTPS certificate installed
- [ ] Database file permissions set (600)
- [ ] Upload directory permissions set (755)
- [ ] Environment variables set in hosting
- [ ] Security headers active
- [ ] CSP policy tested
- [ ] Rate limiting tested
- [ ] Image upload tested with malicious files
- [ ] SQL injection tests passed
- [ ] XSS tests passed

### 8.3 Ongoing
- [ ] Dependency updates (npm audit)
- [ ] Security audit logs reviewed monthly
- [ ] Backup and recovery tested
- [ ] Incident response plan documented

---

## 9. Security Best Practices

### 9.1 Code Review Focus Areas
- All user input points (forms, URL params, file uploads)
- Database queries (ensure parameterized)
- File system operations (path validation)
- External API calls (input sanitization)
- Authentication logic (if added)
- Error messages (no leaks)

### 9.2 Regular Security Tasks
- **Weekly**: Review dependency vulnerabilities (`npm audit`)
- **Monthly**: Review security logs
- **Quarterly**: Security penetration testing
- **Annually**: Full security audit

---

## Document Control

- **Version**: 1.0
- **Date**: 2025-10-10
- **Author**: Analyst Agent (Hive Mind Swarm)
- **Status**: Complete
- **Next Review**: Pre-deployment security audit

# Security Considerations - Receipt Processing

## Security Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal access required
3. **Privacy by Default**: Opt-in for data retention
4. **Secure by Design**: Security from the start, not added later
5. **Zero Trust**: Verify everything, trust nothing
6. **Data Minimization**: Collect only what's needed

---

## Threat Model

### Assets to Protect

1. **Receipt Images**: May contain sensitive PII (names, addresses, card numbers)
2. **Inventory Data**: Personal item collections, quantities, locations
3. **User Accounts**: Authentication credentials, personal information
4. **API Keys**: Access to third-party services (OCR, storage)
5. **Database**: All user data and system data

### Potential Threats

1. **Unauthorized Access**: Attackers accessing other users' receipts
2. **Data Exfiltration**: Bulk download of receipt images
3. **Injection Attacks**: SQL, XSS, path traversal
4. **DDoS**: Overwhelming system with requests
5. **Credential Theft**: Phishing, session hijacking
6. **Malicious Uploads**: Malware in images, XXE attacks
7. **Privacy Breach**: Unintentional exposure of PII

---

## Input Validation & Sanitization

### 1. Image Upload Validation

#### 1.1 File Type Validation

**Threat**: Malicious file upload (executables, scripts)

**Mitigation**: Validate file type on client AND server

```typescript
// Client-side validation
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const validateImage = (file: File): ValidationResult => {
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG and PNG images are allowed' };
  }

  // Check file size
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Image must be less than 10 MB' };
  }

  // Check file extension (double-check)
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['jpg', 'jpeg', 'png'].includes(ext || '')) {
    return { valid: false, error: 'Invalid file extension' };
  }

  return { valid: true };
};

// Server-side validation (Node.js)
import fileType from 'file-type';

const validateImageServer = async (buffer: Buffer) => {
  // Verify actual file type (not just extension/MIME)
  const type = await fileType.fromBuffer(buffer);

  if (!type || !['image/jpeg', 'image/png'].includes(type.mime)) {
    throw new Error('Invalid image format');
  }

  // Check for embedded scripts (polyglot files)
  const firstBytes = buffer.slice(0, 100).toString('utf8');
  if (firstBytes.includes('<script') || firstBytes.includes('<?php')) {
    throw new Error('Suspicious file content detected');
  }
};
```

**Defense Layers**:
1. Client-side: Fast feedback, reduces bad uploads
2. Server-side MIME check: Catches spoofed headers
3. Magic number validation: Verifies actual file format
4. Content scanning: Detects polyglot/malicious files

---

#### 1.2 File Name Sanitization

**Threat**: Path traversal (../../etc/passwd), code injection

**Mitigation**: Generate safe filenames server-side

```typescript
import { randomUUID } from 'crypto';
import path from 'path';

const sanitizeFileName = (originalName: string): string => {
  // Never trust user-provided filenames
  const ext = path.extname(originalName).toLowerCase();

  // Whitelist allowed extensions
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  if (!allowedExts.includes(ext)) {
    throw new Error('Invalid file extension');
  }

  // Generate UUID-based filename
  return `${randomUUID()}${ext}`;
};

// Storage path generation
const getStoragePath = (userId: string, filename: string): string => {
  // Validate userId is UUID (prevent path traversal)
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    throw new Error('Invalid user ID');
  }

  // Prevent directory traversal in filename
  const safeName = path.basename(filename);

  return `receipts-temp/${userId}/${safeName}`;
};
```

---

#### 1.3 EXIF Data Stripping

**Threat**: Privacy leak (GPS coordinates, device info, personal metadata)

**Mitigation**: Strip all EXIF data before storage

```typescript
import sharp from 'sharp';

const stripExifData = async (imageBuffer: Buffer): Promise<Buffer> => {
  return await sharp(imageBuffer)
    .rotate() // Auto-rotate based on EXIF, then remove
    .withMetadata({
      exif: {},     // Remove all EXIF
      icc: true,    // Keep color profile
      orientation: 1 // Reset orientation
    })
    .toBuffer();
};
```

**What gets removed**:
- GPS coordinates
- Camera make/model
- Date/time taken
- Software used
- Author information
- Copyright data

---

### 2. API Input Validation

#### 2.1 Receipt Data Validation

**Threat**: Injection attacks, data corruption

**Mitigation**: Strict schema validation

```typescript
import { z } from 'zod';

const extractedItemSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  quantity: z.number().int().min(0).max(9999),
  unitPrice: z.number().min(0).max(99999.99).nullable(),
  totalPrice: z.number().min(0).max(99999.99).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  boundingBox: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).nullable(),
  rawText: z.string().max(500).nullable()
});

const createReceiptSchema = z.object({
  merchantName: z.string().max(255).trim().nullable(),
  receiptDate: z.string().date().nullable(),
  totalAmount: z.number().min(0).max(99999.99).nullable(),
  imageUrl: z.string().url().max(500).nullable(),
  rawOcrText: z.string().max(50000).nullable(), // Limit size
  confidence: z.number().min(0).max(1).nullable(),
  extractedItems: z.array(extractedItemSchema).min(1).max(200) // Max 200 items
});

// In API route
const validateAndSanitize = (body: unknown) => {
  try {
    return createReceiptSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors);
    }
    throw error;
  }
};
```

---

#### 2.2 SQL Injection Prevention

**Threat**: Malicious SQL execution

**Mitigation**: Parameterized queries only

```typescript
// ❌ NEVER do this (vulnerable to SQL injection)
const query = `SELECT * FROM receipts WHERE id = '${receiptId}'`;

// ✅ ALWAYS use parameterized queries
const query = 'SELECT * FROM receipts WHERE id = $1 AND user_id = $2';
const result = await pool.query(query, [receiptId, userId]);

// ✅ Or use ORM/query builder
const receipt = await db
  .select()
  .from(receipts)
  .where(eq(receipts.id, receiptId))
  .where(eq(receipts.userId, userId))
  .limit(1);
```

---

#### 2.3 XSS Prevention

**Threat**: Cross-site scripting via OCR text or item names

**Mitigation**: Sanitize output, CSP headers

```typescript
import DOMPurify from 'dompurify';

// Sanitize before rendering
const SafeText = ({ text }: { text: string }) => {
  const clean = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  });

  return <span>{clean}</span>;
};

// Content Security Policy headers
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Required for tesseract.js
    "img-src 'self' data: blob: https:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

---

## Authentication & Authorization

### 3. Row-Level Security (RLS)

**Threat**: Unauthorized access to other users' data

**Mitigation**: Enforce RLS policies at database level

```sql
-- Enable RLS on tables
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own receipts
CREATE POLICY "Users can only view own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Prevent privilege escalation
CREATE POLICY "Users cannot impersonate others"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Extracted items inherit receipt permissions
CREATE POLICY "Users can only view own extracted items"
  ON extracted_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
        AND receipts.deleted_at IS NULL
    )
  );
```

**Testing RLS**:
```sql
-- Switch to test user context
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO 'test-user-uuid';

-- Attempt to access another user's receipt (should fail)
SELECT * FROM receipts WHERE user_id != 'test-user-uuid';
-- Result: 0 rows (RLS blocks access)
```

---

### 4. API Authentication

#### 4.1 JWT Token Validation

**Threat**: Token tampering, expired tokens

**Mitigation**: Verify signature and expiration

```typescript
import jwt from 'jsonwebtoken';

const validateToken = (token: string): JWTPayload => {
  try {
    // Verify signature and expiration
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
      maxAge: '7d' // Token expires after 7 days
    }) as JWTPayload;

    // Validate claims
    if (!payload.sub || !payload.email) {
      throw new Error('Invalid token claims');
    }

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired', 'TOKEN_EXPIRED');
    }
    throw new AuthError('Invalid token', 'INVALID_TOKEN');
  }
};

// Middleware
const authenticateRequest = async (req: Request): Promise<User> => {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing authorization header', 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7);
  const payload = validateToken(token);

  return { id: payload.sub, email: payload.email };
};
```

---

#### 4.2 CSRF Protection

**Threat**: Cross-site request forgery

**Mitigation**: CSRF tokens for state-changing operations

```typescript
import { generateToken, verifyToken } from 'csrf';

// Generate CSRF token (stored in HTTP-only cookie)
const csrfToken = generateToken(req, res);

// Validate on mutations
const validateCsrfToken = (req: Request) => {
  const token = req.headers.get('X-CSRF-Token');
  const cookieToken = req.cookies.get('csrf-token');

  if (!token || !verifyToken(cookieToken, token)) {
    throw new SecurityError('Invalid CSRF token');
  }
};

// Apply to all POST/PUT/PATCH/DELETE requests
if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
  validateCsrfToken(req);
}
```

---

### 5. Rate Limiting

**Threat**: DDoS, brute force, resource exhaustion

**Mitigation**: Rate limits per user and IP

```typescript
import { RateLimiter } from 'limiter';

const limiters = {
  upload: new RateLimiter({
    tokensPerInterval: 10,
    interval: 'minute',
    fireImmediately: true
  }),
  api: new RateLimiter({
    tokensPerInterval: 60,
    interval: 'minute'
  })
};

const checkRateLimit = async (
  userId: string,
  limiter: RateLimiter
): Promise<void> => {
  const allowed = await limiter.removeTokens(1);

  if (!allowed) {
    throw new RateLimitError('Too many requests', {
      retryAfter: limiter.getTokensRemaining()
    });
  }
};

// Per-IP rate limiting (defense against distributed attacks)
const ipLimiter = new Map<string, RateLimiter>();

const getIpLimiter = (ip: string): RateLimiter => {
  if (!ipLimiter.has(ip)) {
    ipLimiter.set(ip, new RateLimiter({
      tokensPerInterval: 100,
      interval: 'minute'
    }));
  }
  return ipLimiter.get(ip)!;
};
```

**Rate Limit Strategy**:
- Upload: 10/minute per user
- OCR processing: 5/minute per user
- API calls: 60/minute per user
- IP-based: 100/minute per IP (catch distributed attacks)

---

## Data Protection

### 6. Encryption

#### 6.1 Data at Rest

**Threat**: Database breach, storage access

**Mitigation**: Encrypt sensitive fields

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64');
const ALGORITHM = 'aes-256-gcm';

const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString('base64'),
    data: encrypted,
    tag: authTag.toString('base64')
  });
};

const decrypt = (encryptedText: string): string => {
  const { iv, data, tag } = JSON.parse(encryptedText);

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(tag, 'base64'));

  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

// Use for sensitive fields (if needed)
const storeReceipt = async (receipt: Receipt) => {
  const encryptedText = receipt.rawOcrText
    ? encrypt(receipt.rawOcrText)
    : null;

  await db.insert(receipts).values({
    ...receipt,
    rawOcrText: encryptedText
  });
};
```

**What to Encrypt**:
- Raw OCR text (may contain sensitive info)
- Merchant names (privacy)
- Notes fields (user comments)

**What NOT to Encrypt**:
- IDs, timestamps (needed for queries)
- Numeric amounts (needed for aggregations)
- Status fields

---

#### 6.2 Data in Transit

**Threat**: Man-in-the-middle attacks

**Mitigation**: HTTPS everywhere, HSTS

```nginx
# Nginx configuration
server {
  listen 443 ssl http2;
  server_name example.com;

  # TLS configuration
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  ssl_protocols TLSv1.3 TLSv1.2;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # HSTS (force HTTPS for 1 year)
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

  # Security headers
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name example.com;
  return 301 https://$host$request_uri;
}
```

---

### 7. Privacy & Data Retention

#### 7.1 Temporary Image Storage

**Threat**: Unnecessary data retention, privacy violation

**Mitigation**: Auto-expire images after 24 hours

```typescript
// When uploading image
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

await db.insert(receipts).values({
  ...receiptData,
  imageUrl,
  imageExpiresAt: expiresAt
});

// Background job (runs daily)
const cleanupExpiredImages = async () => {
  const expired = await db
    .select({ id: receipts.id, imageUrl: receipts.imageUrl })
    .from(receipts)
    .where(
      and(
        lt(receipts.imageExpiresAt, new Date()),
        isNotNull(receipts.imageUrl)
      )
    )
    .limit(100);

  for (const receipt of expired) {
    // Delete from storage
    await storageClient.from('receipts-temp').remove([receipt.imageUrl]);

    // Update database
    await db
      .update(receipts)
      .set({ imageUrl: null, imageExpiresAt: null })
      .where(eq(receipts.id, receipt.id));
  }

  logger.info(`Cleaned up ${expired.length} expired images`);
};
```

---

#### 7.2 GDPR Compliance

**Threat**: Legal liability, user trust loss

**Mitigation**: Implement data subject rights

```typescript
// Right to Access (export user data)
const exportUserData = async (userId: string): Promise<UserDataExport> => {
  const [userData, receipts, items] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(receipts).where(eq(receipts.userId, userId)),
    db.select().from(items).where(eq(items.userId, userId))
  ]);

  return {
    user: userData[0],
    receipts: receipts.map(r => ({
      ...r,
      rawOcrText: r.rawOcrText ? decrypt(r.rawOcrText) : null
    })),
    items
  };
};

// Right to Deletion (erase user data)
const deleteUserData = async (userId: string): Promise<void> => {
  await db.transaction(async (tx) => {
    // Delete images from storage
    const userReceipts = await tx
      .select({ imageUrl: receipts.imageUrl })
      .from(receipts)
      .where(eq(receipts.userId, userId));

    for (const receipt of userReceipts) {
      if (receipt.imageUrl) {
        await storageClient.from('receipts-temp').remove([receipt.imageUrl]);
      }
    }

    // Delete database records (cascade deletes extracted_items)
    await tx.delete(receipts).where(eq(receipts.userId, userId));
    await tx.delete(items).where(eq(items.userId, userId));
    await tx.delete(users).where(eq(users.id, userId));
  });

  logger.info(`Deleted all data for user ${userId}`);
};

// Right to Rectification (update incorrect data)
const updateUserData = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, userId));
};
```

---

## Logging & Monitoring

### 8. Security Event Logging

**Threat**: Undetected breaches, no audit trail

**Mitigation**: Comprehensive security logging

```typescript
enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_UPLOAD = 'SUSPICIOUS_UPLOAD',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETION = 'DATA_DELETION',
  ADMIN_ACTION = 'ADMIN_ACTION'
}

const logSecurityEvent = async (event: SecurityEvent) => {
  await db.insert(securityLogs).values({
    eventType: event.type,
    userId: event.userId,
    ipAddress: event.ip,
    userAgent: event.userAgent,
    details: event.details,
    timestamp: new Date()
  });

  // Alert on critical events
  if (isCritical(event)) {
    await sendAlert({
      severity: 'high',
      message: `Security event: ${event.type}`,
      details: event
    });
  }
};

// Example usage
if (loginFailed) {
  logSecurityEvent({
    type: SecurityEventType.LOGIN_FAILURE,
    userId: attemptedEmail,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    details: { reason: 'Invalid password' }
  });
}
```

**Alerts for**:
- Multiple failed login attempts (5+ in 5 minutes)
- Unauthorized access attempts
- Unusual data export volumes
- Suspected SQL injection attempts
- Rate limit violations (10+ in 1 hour)

---

## Security Testing

### 9. Automated Security Checks

```typescript
// npm test:security
import { runSecurityTests } from './tests/security';

describe('Security Tests', () => {
  it('prevents SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE receipts; --";
    const result = await api.createReceipt({ merchantName: maliciousInput });
    expect(result.merchantName).toBe(maliciousInput); // Escaped, not executed
  });

  it('prevents XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const receipt = await api.createReceipt({
      merchantName: xssPayload
    });
    expect(receipt.merchantName).not.toContain('<script>');
  });

  it('enforces rate limits', async () => {
    const requests = Array(20).fill(null).map(() => api.uploadImage(testImage));
    const results = await Promise.allSettled(requests);
    const rateLimited = results.filter(r => r.status === 'rejected');
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('blocks unauthorized access', async () => {
    const otherUserReceipt = 'other-user-receipt-id';
    await expect(
      api.getReceipt(otherUserReceipt)
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
```

---

## Security Checklist

- [ ] All user inputs validated and sanitized
- [ ] Parameterized queries used (no string concatenation)
- [ ] Row-level security enabled on all tables
- [ ] HTTPS enforced with HSTS
- [ ] CSRF tokens on all mutations
- [ ] Rate limiting on all endpoints
- [ ] File uploads validated (type, size, content)
- [ ] EXIF data stripped from images
- [ ] Sensitive data encrypted at rest
- [ ] Authentication required on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Security headers configured (CSP, X-Frame-Options)
- [ ] Session management secure (HTTP-only cookies)
- [ ] Automated security tests in CI/CD
- [ ] Security event logging enabled
- [ ] GDPR compliance (data export/deletion)
- [ ] Regular dependency updates (npm audit)
- [ ] Penetration testing conducted
- [ ] Incident response plan documented
- [ ] Security training for team
- [ ] Third-party security audit completed

# Environment Variables

Required and optional environment variables for deployment.

## Required Variables

### DATABASE_URL
Database connection string.

**Development (SQLite):**
\`\`\`
DATABASE_URL="file:./prisma/dev.db"
\`\`\`

**Production (PostgreSQL):**
\`\`\`
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
\`\`\`

### NODE_ENV
Environment mode.

\`\`\`
NODE_ENV="development"  # Development
NODE_ENV="production"   # Production
\`\`\`

## Optional Variables

### NEXT_PUBLIC_APP_URL
Public application URL.

\`\`\`
NEXT_PUBLIC_APP_URL="https://your-domain.com"
\`\`\`

### IMAGE_UPLOAD_URL
Image storage endpoint (if using external storage).

\`\`\`
IMAGE_UPLOAD_URL="https://storage.example.com/api/upload"
\`\`\`

### Feature Flags

\`\`\`
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_EXPORT="true"
\`\`\`

## Setting Variables

### Local Development

Create \`.env\`:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` with your values.

### Vercel

1. Go to project settings
2. Navigate to Environment Variables
3. Add variables:
   - Production
   - Preview
   - Development

### Docker

In \`docker-compose.yml\`:
\`\`\`yaml
environment:
  - DATABASE_URL=postgresql://...
  - NODE_ENV=production
\`\`\`

## Security

### Best Practices

1. **Never commit secrets** to version control
2. **Use strong passwords** for database
3. **Rotate credentials** periodically
4. **Limit access** to production variables
5. **Use different values** for dev/prod

### .gitignore

Ensure these are ignored:
\`\`\`
.env
.env.local
.env.production
\`\`\`

### Environment File Template

Create \`.env.example\`:
\`\`\`
# Database
DATABASE_URL="file:./prisma/dev.db"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional Features
NEXT_PUBLIC_ENABLE_AUTH="false"
\`\`\`

## Validation

Validate environment variables at startup:

\`\`\`typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
\`\`\`

See also:
- [Vercel Deployment](./vercel-deployment.md)
- [Database Setup](./database-setup.md)

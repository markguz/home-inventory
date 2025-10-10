# Database Setup

Configure and deploy your database for production.

## Development Database

### SQLite (Default)
\`\`\`bash
DATABASE_URL="file:./prisma/dev.db"
npx prisma migrate dev
\`\`\`

Advantages:
- No setup required
- Fast for development
- File-based

## Production Database

### Recommended: PostgreSQL

#### Option 1: Vercel Postgres
1. Create database in Vercel dashboard
2. Copy connection string
3. Update DATABASE_URL
4. Run migrations

#### Option 2: Railway
\`\`\`bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Get connection string
railway variables
\`\`\`

#### Option 3: Supabase
1. Create project at supabase.com
2. Go to Settings > Database
3. Copy connection string (pooler)
4. Use for DATABASE_URL

### Update Prisma Schema

Change provider to PostgreSQL:
\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
\`\`\`

## Migrations

### Initial Migration
\`\`\`bash
npx prisma migrate deploy
\`\`\`

### Seed Data
\`\`\`bash
npx prisma db seed
\`\`\`

### Create New Migration
\`\`\`bash
npx prisma migrate dev --name migration_name
\`\`\`

## Backup Strategy

### Automated Backups

Most providers offer automatic backups:
- **Vercel Postgres**: Daily backups
- **Railway**: Automatic backups
- **Supabase**: Point-in-time recovery

### Manual Backups

PostgreSQL:
\`\`\`bash
pg_dump $DATABASE_URL > backup.sql
\`\`\`

Restore:
\`\`\`bash
psql $DATABASE_URL < backup.sql
\`\`\`

SQLite:
\`\`\`bash
cp prisma/prod.db prisma/backup.db
\`\`\`

## Connection Pooling

For production, use connection pooling:

\`\`\`typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
\`\`\`

## Performance Optimization

### Indexes
Ensure indexes on frequently queried fields:
\`\`\`prisma
model Item {
  // ...
  @@index([categoryId])
  @@index([locationId])
  @@index([name])
}
\`\`\`

### Query Optimization
- Use \`select\` to limit fields
- Use \`include\` judiciously
- Implement pagination
- Cache frequent queries

## Monitoring

### Query Logging

Development:
\`\`\`typescript
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});
\`\`\`

Production:
\`\`\`typescript
const prisma = new PrismaClient({
  log: ['error']
});
\`\`\`

### Performance Monitoring

Tools:
- Prisma Studio
- Database dashboard
- Application Performance Monitoring (APM)

## Security

### Best Practices

1. **Use environment variables** for credentials
2. **Restrict database access** by IP
3. **Use SSL connections** in production
4. **Regular backups**
5. **Monitor for unusual activity**

### Connection String Security

Never expose in code:
\`\`\`typescript
// ❌ Bad
const url = "postgresql://user:pass@host/db";

// ✅ Good
const url = process.env.DATABASE_URL;
\`\`\`

## Troubleshooting

### Connection Issues
- Verify connection string
- Check network access
- Confirm database is running

### Migration Failures
- Review migration files
- Check database state
- Restore from backup if needed

### Performance Issues
- Add indexes
- Optimize queries
- Enable connection pooling
- Scale database resources

See also:
- [Environment Variables](./environment-variables.md)
- [Vercel Deployment](./vercel-deployment.md)

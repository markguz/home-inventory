# Vercel Deployment

Deploy Home Inventory System to Vercel in minutes.

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Repository pushed to GitHub

## Quick Deploy

### 1. Import Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js settings

### 2. Configure Environment Variables

Add these environment variables:

\`\`\`
DATABASE_URL="file:./prisma/prod.db"
NODE_ENV="production"
\`\`\`

For PostgreSQL (recommended for production):
\`\`\`
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
\`\`\`

### 3. Deploy

Click "Deploy" - Vercel will:
- Install dependencies
- Run build
- Deploy your application

## Database Options

### Option 1: Vercel Postgres

1. Go to Storage tab in Vercel dashboard
2. Create Postgres database
3. Copy connection string to \`DATABASE_URL\`
4. Update Prisma schema:
   \`\`\`prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   \`\`\`
5. Run migrations:
   \`\`\`bash
   npx prisma migrate deploy
   \`\`\`

### Option 2: External Database

Compatible with:
- **Railway**: railway.app
- **Supabase**: supabase.com
- **PlanetScale**: planetscale.com
- **Neon**: neon.tech

## Post-Deployment Setup

### Run Database Migrations

Using Vercel CLI:
\`\`\`bash
vercel env pull .env.local
npx prisma migrate deploy
\`\`\`

### Seed Database

\`\`\`bash
npx prisma db seed
\`\`\`

## Custom Domain

1. Go to Settings > Domains
2. Add your domain
3. Configure DNS records
4. Wait for SSL certificate

## Environment Variables

Required:
- \`DATABASE_URL\`: Database connection string
- \`NODE_ENV\`: "production"

Optional:
- \`NEXT_PUBLIC_APP_URL\`: Your app URL
- \`IMAGE_UPLOAD_URL\`: Image storage URL

## Continuous Deployment

Vercel automatically deploys on:
- Push to main branch (production)
- Push to other branches (preview)
- Pull requests (preview)

## Monitoring

### Analytics
Enable in Vercel dashboard:
- Web Analytics
- Speed Insights

### Logs
View logs in Vercel dashboard:
- Function logs
- Build logs
- Error tracking

## Troubleshooting

### Build Fails
- Check build logs
- Verify all dependencies installed
- Ensure environment variables set

### Database Connection Issues
- Verify DATABASE_URL correct
- Check database is accessible
- Run migrations

### Performance Issues
- Enable caching
- Optimize images
- Use CDN for static assets

## Best Practices

1. Use PostgreSQL for production
2. Enable automatic SSL
3. Configure custom domain
4. Enable Web Analytics
5. Set up error monitoring
6. Regular database backups
7. Use environment variables for secrets

See also:
- [Environment Variables](./environment-variables.md)
- [Troubleshooting](./troubleshooting.md)

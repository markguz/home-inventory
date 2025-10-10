# Troubleshooting

Common issues and solutions for deployment.

## Build Errors

### TypeScript Errors
**Problem**: Build fails with TypeScript errors

**Solution**:
\`\`\`bash
# Check types locally
npm run typecheck

# Fix type errors
# Update tsconfig.json if needed
\`\`\`

### Dependency Issues
**Problem**: Missing or incompatible dependencies

**Solution**:
\`\`\`bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for peer dependency warnings
npm ls
\`\`\`

## Database Issues

### Connection Failures
**Problem**: Cannot connect to database

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check database is accessible
3. Verify SSL requirements
4. Check firewall rules

### Migration Errors
**Problem**: Migrations fail to apply

**Solutions**:
\`\`\`bash
# Check migration status
npx prisma migrate status

# Reset and reapply (CAUTION: data loss)
npx prisma migrate reset

# Apply specific migration
npx prisma migrate deploy
\`\`\`

## Runtime Errors

### 500 Internal Server Error
**Problem**: Application crashes on load

**Diagnosis**:
1. Check server logs
2. Verify environment variables
3. Test database connection
4. Check API routes

### API Route Errors
**Problem**: API endpoints return errors

**Debug Steps**:
\`\`\`typescript
// Add logging
console.log('Request:', request);
console.log('Database query:', query);

// Check response
return NextResponse.json({ error: error.message });
\`\`\`

## Performance Issues

### Slow Page Loads
**Solutions**:
1. Enable caching
2. Optimize images
3. Add database indexes
4. Implement pagination

### High Memory Usage
**Solutions**:
1. Optimize database queries
2. Limit result set sizes
3. Implement lazy loading
4. Clear unused caches

## Vercel-Specific Issues

### Function Timeout
**Problem**: Serverless function times out

**Solutions**:
1. Optimize long-running operations
2. Upgrade Vercel plan for longer timeouts
3. Move heavy operations to background jobs
4. Implement caching

### Build Timeout
**Problem**: Build exceeds time limit

**Solutions**:
1. Optimize build process
2. Remove unnecessary dependencies
3. Use incremental builds
4. Upgrade Vercel plan

## Common Error Messages

### "Prisma Client not generated"
\`\`\`bash
npx prisma generate
\`\`\`

### "Port 3000 already in use"
\`\`\`bash
# Kill process
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
\`\`\`

### "Module not found"
\`\`\`bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
npm install
\`\`\`

## Getting Help

### Before Asking

1. Check error messages carefully
2. Search existing issues
3. Review documentation
4. Test in clean environment

### Where to Ask

- **GitHub Issues**: Bug reports
- **Discussions**: Questions
- **Stack Overflow**: Technical questions
- **Discord/Slack**: Community support

### Provide This Information

\`\`\`markdown
**Environment**
- OS: [e.g., macOS 13]
- Node version: [e.g., 20.10.0]
- npm version: [e.g., 10.2.0]
- Next.js version: [e.g., 15.5.4]

**Error Message**
[Full error with stack trace]

**Steps to Reproduce**
1. Step one
2. Step two
3. Error occurs

**Expected Behavior**
[What should happen]

**Actual Behavior**
[What actually happens]

**Additional Context**
[Environment variables used, recent changes, etc.]
\`\`\`

## Debug Mode

Enable verbose logging:

\`\`\`typescript
// lib/db.ts
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
\`\`\`

\`\`\`bash
# Enable Next.js debug
DEBUG=* npm run dev
\`\`\`

See also:
- [Vercel Deployment](./vercel-deployment.md)
- [Database Setup](./database-setup.md)
- [Environment Variables](./environment-variables.md)

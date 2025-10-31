# Quick Fix Guide - 500 Errors
## Emergency Response for Home Inventory Project

**⚠️ CRITICAL: All routes currently return 500 errors**

---

## 🚨 Emergency Fixes (5 minutes)

### 1. Fix Database Connection
```bash
cd /export/projects/homeinventory
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
echo 'NEXTAUTH_SECRET="'$(openssl rand -base64 32)'"' >> .env
echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
```

### 2. Install Missing Dependencies
```bash
npm install next-auth react-hook-form @hookform/resolvers lucide-react next-themes \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label \
  @radix-ui/react-select @radix-ui/react-separator
```

### 3. Create Missing Validation File
```bash
mkdir -p src/lib/validations
cat > src/lib/validations/auth.ts << 'EOF'
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
EOF
```

### 4. Test Database
```bash
npx prisma db push
npm run dev
```

---

## 📋 Complete Fix Checklist

- [ ] Update `.env` with correct DATABASE_URL
- [ ] Add NEXTAUTH_SECRET to `.env`
- [ ] Install 10 missing dependencies
- [ ] Create `/src/lib/validations/auth.ts`
- [ ] Create NextAuth route handler
- [ ] Create middleware.ts
- [ ] Add Tailwind config
- [ ] Remove old home-inventory/ directory
- [ ] Test build: `npm run build`
- [ ] Test dev server: `npm run dev`

---

## 🔍 Verify Fixes Work

```bash
# 1. Check database connects
npx prisma studio

# 2. Check build succeeds
npm run build

# 3. Check dev server starts
npm run dev

# 4. Test API endpoint
curl http://localhost:3000/api/items

# Expected: {"items": []} instead of 500 error
```

---

## 📊 Issues Fixed

| Issue | Severity | Status |
|-------|----------|--------|
| Database path | 🔴 Critical | ⏳ Pending |
| Missing dependencies | 🔴 Critical | ⏳ Pending |
| Auth validation file | 🔴 Critical | ⏳ Pending |
| Environment variables | 🔴 Critical | ⏳ Pending |
| NextAuth config | 🟡 High | ⏳ Pending |
| Middleware | 🟡 High | ⏳ Pending |

---

## 🆘 Still Getting Errors?

**Check:**
1. `.env` file exists in project root
2. `node_modules/next-auth` exists
3. `src/lib/validations/auth.ts` exists
4. Database file at `prisma/dev.db`
5. Run `npm install` again

**Get Detailed Report:**
See `/docs/RESEARCH_500_ERROR_ANALYSIS.md` for complete analysis

---

**Last Updated:** 2025-10-21
**Agent:** Research Specialist

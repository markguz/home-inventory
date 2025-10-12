# Admin Credentials

## Default Admin Account

The application has been seeded with a default administrator account for initial setup and testing.

### Login Credentials

```
Email: admin@homeinventory.local
Password: admin123
```

### Important Security Notes

⚠️ **CRITICAL**: These are default credentials for development and initial setup only.

**Before deploying to production or using in any non-local environment:**

1. **Change the admin password immediately** after first login
2. Consider creating a new admin account with your own email
3. Delete or disable the default admin account if not needed
4. Never commit credentials to version control
5. Use strong, unique passwords (minimum 12 characters, mixed case, numbers, symbols)

### Current Users in Database

As of the last check, the following users exist:

1. **Administrator** (ADMIN role)
   - Email: `admin@homeinventory.local`
   - Created: 2025-10-12
   - Purpose: System administration and category management

2. **Mark Guz** (USER role)
   - Email: `mark@markguz.com`
   - Created: 2025-10-12
   - Purpose: Regular user account

### Admin Capabilities

Users with ADMIN role can:
- ✅ Create, edit, and delete categories
- ✅ View all items (not restricted by ownership)
- ✅ Access admin-only routes (future: `/admin/*`)
- ✅ Manage system configuration (future feature)

### Regular User Capabilities

Users with USER role can:
- ✅ Register and login
- ✅ Create, view, edit, and delete their own items
- ✅ View categories (read-only)
- ❌ Cannot create or modify categories
- ❌ Cannot access admin routes

### Changing User Roles

To promote a user to admin or change roles, you can use Prisma Studio:

```bash
npm run db:studio
```

Or use a database script:

```typescript
// Update user role to ADMIN
await prisma.user.update({
  where: { email: 'user@example.com' },
  data: { role: 'ADMIN' }
});
```

### Password Reset

If you need to reset the admin password manually:

```bash
# Generate a new hash for your password
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourNewPassword', 10).then(console.log)"

# Then update in Prisma Studio or via SQL
```

### Re-running Seed Script

The seed script is idempotent and can be run multiple times safely:

```bash
npm run db:seed
```

It will skip creating the admin user if one already exists at `admin@homeinventory.local`.

---

**Last Updated**: 2025-10-12

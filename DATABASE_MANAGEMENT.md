# Database Management Guide

## Safe Database Reset

To avoid login issues when resetting the database, use these methods:

### Method 1: Using the Reset Script (Recommended)
```bash
npm run db:reset-safe
```

This script will:
- Clear all existing data safely
- Create admin user with proper password hash
- Ensure login credentials work correctly

### Method 2: Via API Endpoint (Admin only)
```bash
curl -X POST https://your-app.com/api/admin/reset-database \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "RESET_PRODUCTION_DATABASE"}'
```

### Method 3: Manual Database Reset
If you must manually clear data:

1. **Never delete the database itself** - only clear the data
2. **Always run the seed script** to recreate admin user
3. **Use proper password hashing** for any manual user creation

## Default Admin Credentials

After any database reset:
- **Email:** `admin@workflowpro.com`
- **Password:** `admin123`
- **Role:** `ADMIN`

## Password Hash Generation

If you need to manually create users with specific passwords:

```bash
# Generate bcrypt hash for a password
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 12))"
```

## Troubleshooting Login Issues

### "Password valid: false" errors:
1. Check if password hash was generated correctly
2. Ensure bcrypt is being used (not plain text)
3. Verify the user exists in the database

### Database connection issues:
1. Check DATABASE_URL environment variable
2. Verify database server is accessible
3. Confirm database name exists

### User not found errors:
1. Run the seed script to create admin user
2. Check if database has been properly initialized
3. Verify user table structure matches schema

## Best Practices

1. **Always use the reset script** instead of manual database operations
2. **Test login immediately** after any database changes
3. **Keep backup of working database** before major changes
4. **Use environment-specific credentials** for development vs production
5. **Never commit sensitive database URLs** to version control

## Environment Variables

Ensure these are properly configured:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
```
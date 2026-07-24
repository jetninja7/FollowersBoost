# Database Setup Guide

This guide walks through setting up the PostgreSQL database for FollowersBoost development.

## Prerequisites

- PostgreSQL 16 installed and running
- Database credentials ready (default: `postgres:postgres`)

## Quick Setup

### Option 1: Automated Setup Script

```bash
# Create database and run migrations
npm run db:setup
```

This script will:
1. Create the `followersboost` database
2. Run all Prisma migrations
3. Seed the database with test data
4. Display admin credentials

### Option 2: Manual Setup

#### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE followersboost;

# Exit psql
\q
```

#### Step 2: Configure Environment

Ensure your `.env.local` contains:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/followersboost"
```

Adjust username, password, host, and port as needed.

#### Step 3: Run Migrations

```bash
# Apply all migrations
npx prisma migrate deploy

# Or for development (creates migration history)
npx prisma migrate dev
```

#### Step 4: Seed Database

```bash
# Seed with test data
npx prisma db seed
```

This creates:
- Default admin user: `admin@followersboost.com` / `Admin123!`
- 10 social media platforms
- Service categories per platform
- Sample services with realistic pricing
- Test fulfillment providers

#### Step 5: Verify Setup

```bash
# Check migration status
npx prisma migrate status

# Open Prisma Studio to browse data
npx prisma studio
```

## Database Reset (Development Only)

**⚠️ WARNING: This deletes ALL data!**

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS followersboost;"
psql -U postgres -c "CREATE DATABASE followersboost;"

# Run migrations and seed
npx prisma migrate deploy
npx prisma db seed
```

Or use the Prisma command:

```bash
npx prisma migrate reset
```

## Testing Email Preferences

After database setup, test Phase 9 functionality:

```bash
# Run automated test suite
npx tsx test-email-preferences.ts
```

Expected output:
```
✅ Email preferences creation
✅ Email preferences retrieval
✅ Email preferences updates
✅ shouldSendEmail filtering logic
✅ Unsubscribe URL generation
✅ Token-based unsubscribe
✅ Unsubscribe from all functionality
✅ Resubscribe functionality
```

## Common Issues

### Issue: Database connection refused

**Symptom:** `Error: P1001: Can't reach database server at localhost:5432`

**Solutions:**
1. Check PostgreSQL is running: `pg_isready -h localhost -p 5432`
2. Start PostgreSQL:
   - macOS (Homebrew): `brew services start postgresql@16`
   - Linux: `sudo systemctl start postgresql`
   - Docker: `docker start postgres-container`

### Issue: Database exists but wrong user

**Symptom:** `Error: P1003: Database followersboost does not exist`

**Solution:** Check your connection string username matches your PostgreSQL user.

### Issue: Permission denied

**Symptom:** `Error: permission denied to create database`

**Solutions:**
1. Grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE followersboost TO postgres;
   ```
2. Or connect as superuser:
   ```bash
   psql -U postgres -h localhost
   ```

### Issue: Migration out of sync

**Symptom:** `Error: P3005: The migration history is inconsistent`

**Solution:**
```bash
# Resolve migration history
npx prisma migrate resolve --applied <migration-name>

# Or reset (deletes data)
npx prisma migrate reset
```

### Issue: Seed fails with unique constraint

**Symptom:** `Unique constraint failed on the fields: (email)`

**Solution:** Database already has seed data. Either:
1. Skip seeding (data already exists)
2. Reset database: `npx prisma migrate reset`
3. Manually delete conflicting records

## Production Setup

### Vercel Postgres

1. Create Vercel Postgres database in project dashboard
2. Copy `DATABASE_URL` from Vercel to environment variables
3. Run migrations via Vercel CLI:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

### Other Providers (Railway, Supabase, etc.)

1. Provision PostgreSQL 16 database
2. Get connection string from provider dashboard
3. Add to environment variables as `DATABASE_URL`
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. Optionally seed:
   ```bash
   npx prisma db seed
   ```

### Production Checklist

- [ ] Database created and accessible
- [ ] Connection string added to environment variables
- [ ] SSL mode configured (usually `?sslmode=require`)
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Admin password changed from default
- [ ] Database backups configured
- [ ] Connection pooling enabled (PgBouncer recommended)
- [ ] Monitoring alerts set up

## Database Maintenance

### Backups

```bash
# Export database
pg_dump -U postgres -h localhost followersboost > backup-$(date +%Y%m%d).sql

# Restore from backup
psql -U postgres -h localhost -d followersboost < backup-20260721.sql
```

### Monitoring

```bash
# Check active connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname='followersboost';"

# Check database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('followersboost'));"
```

### Performance

```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Next Steps

After successful database setup:

1. ✅ Run `npx tsx test-email-preferences.ts` to verify Phase 9
2. ✅ Start dev server: `npm run dev`
3. ✅ Login with admin credentials
4. ✅ Test email preference UI at `/settings/email-preferences`
5. ✅ Create test orders and verify email flow
6. ✅ Test unsubscribe functionality

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- Project-specific: `docs/migration-safety.md`, `docs/backup-procedures.md`

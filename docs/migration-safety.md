# Migration Safety Procedures

## Before Every Production Migration

### 1. Backup Database

- Verify recent backup exists (Vercel dashboard > Storage > Backups)
- Create manual backup if needed: Click "Create Backup" button
- Wait for backup to complete before proceeding

### 2. Test Migration on Staging

```bash
# Restore production backup to staging
# (Via Vercel dashboard or pg_restore)

# Run migration on staging
DATABASE_URL=<staging-url> npx prisma migrate deploy

# Verify app works on staging
npm run build
npm start

# Test critical flows
```

### 3. Review Migration SQL

```bash
# See SQL that will be executed
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource $DATABASE_URL \
  --script
```

Look for:
- DROP TABLE or DROP COLUMN (destructive)
- ALTER COLUMN TYPE (potential data loss)
- ADD COLUMN NOT NULL (requires default or backfill)

### 4. Plan Rollback

- Identify if migration is reversible
- Document rollback steps
- Have backup ready to restore

## Running Migration

### 1. Enable Maintenance Mode (Optional)

For large schema changes, consider brief downtime:
- Deploy maintenance page
- Communicate to users in advance
- Typical duration: 5-15 minutes

### 2. Execute Migration

```bash
npx prisma migrate deploy
```

### 3. Monitor Execution

- Watch command output for errors
- Check Vercel logs in real-time
- Monitor Sentry for exceptions
- Keep health check open: `watch curl https://yourdomain.com/api/health`

### 4. Verify Success

```bash
# Verify schema matches
npx prisma db pull

# Check for differences
git diff prisma/schema.prisma
```

Expected: No differences (schema is in sync)

## Migration Best Practices

### Safe Migrations ✅

- Add nullable columns
- Add new tables
- Add indexes (use CONCURRENTLY in Postgres)
- Rename columns (with application aliasing first)
- Add foreign keys (with validation)

### Dangerous Migrations ⚠️

- Drop tables (ensure no dependencies)
- Drop columns (ensure not in use)
- Change column types (data loss risk)
- Add NOT NULL constraints (requires backfill)
- Remove foreign keys (breaks referential integrity)

## Making Dangerous Migrations Safer

### Example 1: Add NOT NULL Column

**Wrong way (risky):**
```prisma
model User {
  email String  // was String?
}
```
This fails if any existing rows have NULL email.

**Right way (safe):**

Step 1: Add nullable column
```prisma
model User {
  email String?
}
```
Deploy, then backfill:
```sql
UPDATE "User" SET email = CONCAT('user_', id, '@placeholder.com') WHERE email IS NULL;
```

Step 2: Make NOT NULL
```prisma
model User {
  email String
}
```
Deploy.

### Example 2: Rename Column

**Wrong way (breaks app):**
```prisma
model User {
  fullName String  // was 'name'
}
```
Old code still uses 'name' → immediate breakage.

**Right way (zero-downtime):**

Step 1: Add new column
```prisma
model User {
  name     String
  fullName String?
}
```
Code writes to both. Deploy.

Step 2: Backfill
```sql
UPDATE "User" SET "fullName" = name WHERE "fullName" IS NULL;
```

Step 3: Switch reads to new column
Update code to read fullName. Deploy.

Step 4: Drop old column
```prisma
model User {
  fullName String
}
```
Deploy.

### Example 3: Change Column Type

**Wrong way:**
```prisma
model Order {
  quantity BigInt  // was Int
}
```
Data loss if values exceed Int range.

**Right way:**

Step 1: Add new column
```prisma
model Order {
  quantity    Int
  quantityNew BigInt?
}
```
Deploy.

Step 2: Backfill
```sql
UPDATE "Order" SET "quantityNew" = quantity;
```

Step 3: Switch code to use new column
Deploy.

Step 4: Drop old column, rename new
```prisma
model Order {
  quantity BigInt
}
```
Deploy.

## Rollback Migration

### If Migration Fails Mid-Execution

1. **Do NOT panic**
2. Check error message in terminal
3. Check database state:
   ```bash
   npx prisma db pull
   ```
4. If partially applied:
   - Restore from backup (see `backup-procedures.md`)
   - Fix migration script locally
   - Test on staging
   - Retry

### If Migration Succeeds But Breaks App

1. **Rollback deployment immediately:**
   ```bash
   vercel rollback
   ```
2. **Restore database from backup:**
   - Vercel dashboard > Storage > Backups
   - Select backup from before migration
   - Click "Restore"
3. **Verify rollback:**
   ```bash
   curl https://yourdomain.com/api/health
   ```
4. **Fix migration locally, test on staging, redeploy**

## Common Migration Issues

### Issue: Migration Timeout

**Cause:** Large table, adding index without CONCURRENTLY

**Solution:**
```sql
-- Instead of:
CREATE INDEX idx_user_email ON "User"(email);

-- Use:
CREATE INDEX CONCURRENTLY idx_user_email ON "User"(email);
```

### Issue: Lock Wait Timeout

**Cause:** Long-running queries blocking migration

**Solution:**
1. Check for long queries:
   ```sql
   SELECT pid, now() - query_start as duration, query 
   FROM pg_stat_activity 
   WHERE state != 'idle' 
   ORDER BY duration DESC;
   ```
2. Kill blocking queries (if safe):
   ```sql
   SELECT pg_terminate_backend(pid);
   ```
3. Retry migration

### Issue: Constraint Violation

**Cause:** Existing data doesn't meet new constraint

**Solution:**
1. Rollback migration
2. Clean data first:
   ```sql
   -- Example: remove rows that violate constraint
   DELETE FROM "User" WHERE email IS NULL;
   ```
3. Retry migration

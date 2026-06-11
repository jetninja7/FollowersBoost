# Database Backup Procedures

## Backup Strategy

### Vercel Postgres (Recommended)

Vercel Postgres includes:
- **Automated daily backups** (retained 7 days)
- **Point-in-time recovery**
- **Managed by Vercel** (no manual setup)

## Backup Verification

### Monthly Task (1st of each month)

1. **Check Backup Status:**
   - Log into Vercel dashboard
   - Navigate to Storage > Your Database
   - Click "Backups" tab
   - Verify daily backups exist for past 7 days
   - Verify backup sizes are reasonable (not 0 bytes)

2. **Document Status:**
   - Record last backup date
   - Record backup size
   - Note any anomalies

### Quarterly Task (Every 3 months)

**Test Restore:**

1. Create staging environment in Vercel
2. Restore latest backup to staging database
3. Verify data integrity:
   ```bash
   # Connect to staging database
   npx prisma studio
   
   # Check counts match production
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Order";
   SELECT COUNT(*) FROM "Service";
   ```
4. Test critical flows on staging:
   - Login works
   - Recent orders visible
   - Admin panel accessible
5. Document test results
6. Delete staging environment after verification

## Self-Hosted Database Backups

If NOT using Vercel Postgres, use this backup script:

### Backup Script

```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DATABASE_URL="postgresql://..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Cron Schedule

```bash
# Add to crontab: crontab -e
0 2 * * * /path/to/backup-db.sh >> /var/log/db-backup.log 2>&1
```

### Restore Procedure

```bash
# Decompress backup
gunzip backup_20260610_020000.sql.gz

# Restore to database
psql $DATABASE_URL < backup_20260610_020000.sql

# Or restore specific tables
pg_restore -d $DATABASE_URL -t User backup_20260610_020000.sql
```

## Emergency Restore (Vercel Postgres)

1. **Access Backups:**
   - Vercel dashboard > Storage > Your Database
   - Click "Backups" tab

2. **Select Backup:**
   - Choose backup from before the incident
   - Click "Restore"

3. **Confirm Restore:**
   - **WARNING:** This will overwrite current database
   - Confirm restore operation
   - Wait 5-10 minutes for completion

4. **Verify Data:**
   ```bash
   curl https://yourdomain.com/api/health
   ```
   - Check recent orders
   - Verify user accounts
   - Test critical flows

5. **Monitor:**
   - Watch Sentry for errors
   - Check Vercel logs
   - Monitor for 30 minutes

## Backup Retention Policy

- **Daily backups:** 7 days
- **Weekly backups:** 4 weeks (manual if needed)
- **Monthly backups:** 3 months (manual if needed)

For longer retention, export backups to external storage (S3, Google Cloud Storage).

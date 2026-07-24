#!/bin/bash
set -e

echo "🗄️  FollowersBoost Database Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep DATABASE_URL | xargs)
fi

# Check if PostgreSQL is running
echo "📡 Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo -e "${RED}❌ PostgreSQL is not running on localhost:5432${NC}"
  echo ""
  echo "Please start PostgreSQL:"
  echo "  macOS (Homebrew): brew services start postgresql@16"
  echo "  Linux: sudo systemctl start postgresql"
  echo "  Docker: docker start postgres-container"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Extract database name from DATABASE_URL
DB_NAME="followersboost"
DB_USER="postgres"
DB_HOST="localhost"

# Check if database exists
echo "🔍 Checking if database exists..."
DB_EXISTS=$(psql -U $DB_USER -h $DB_HOST -lqt | cut -d \| -f 1 | grep -w $DB_NAME | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
  echo -e "${YELLOW}📦 Database '$DB_NAME' not found. Creating...${NC}"
  psql -U $DB_USER -h $DB_HOST -c "CREATE DATABASE $DB_NAME;"
  echo -e "${GREEN}✅ Database created${NC}"
else
  echo -e "${GREEN}✅ Database '$DB_NAME' already exists${NC}"
fi
echo ""

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy
echo -e "${GREEN}✅ Migrations applied${NC}"
echo ""

# Generate Prisma Client
echo "⚙️  Generating Prisma Client..."
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Check if database is already seeded
echo "🌱 Checking if database needs seeding..."
USER_COUNT=$(psql -U $DB_USER -h $DB_HOST -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | xargs || echo "0")

if [ "$USER_COUNT" -eq 0 ]; then
  echo -e "${YELLOW}📦 Database is empty. Seeding with test data...${NC}"
  npx prisma db seed
  echo -e "${GREEN}✅ Database seeded${NC}"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}🎉 Default Admin Credentials${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Email:    admin@followersboost.com"
  echo "  Password: Admin123!"
  echo ""
  echo -e "${YELLOW}⚠️  Change this password in production!${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  echo -e "${GREEN}✅ Database already contains data (${USER_COUNT} users)${NC}"
fi
echo ""

# Verify setup
echo "🔍 Verifying database setup..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
  echo -e "${GREEN}✅ Database schema is up to date${NC}"
else
  echo -e "${RED}❌ Migration issues detected${NC}"
  echo "$MIGRATION_STATUS"
  exit 1
fi
echo ""

# Show table counts
echo "📊 Database Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "
SELECT
  'Users' as table_name, COUNT(*) as count FROM \"User\"
UNION ALL
SELECT 'Platforms', COUNT(*) FROM \"Platform\"
UNION ALL
SELECT 'Categories', COUNT(*) FROM \"ServiceCategory\"
UNION ALL
SELECT 'Services', COUNT(*) FROM \"Service\"
UNION ALL
SELECT 'Orders', COUNT(*) FROM \"Order\"
UNION ALL
SELECT 'Providers', COUNT(*) FROM \"Provider\";
"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run dev server: npm run dev"
echo "  2. Open browser: http://localhost:3000"
echo "  3. Login with admin credentials above"
echo "  4. Test email preferences: http://localhost:3000/settings/email-preferences"
echo ""
echo "To browse the database:"
echo "  npx prisma studio"
echo ""

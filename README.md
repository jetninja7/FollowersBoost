# FollowersBoost

Production-ready SaaS platform for social media growth services.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.5+
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS + shadcn/ui
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd followersboost
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- Google OAuth credentials (optional)

4. Set up the database:
```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

5. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Admin Account

- Email: `admin@followersboost.com`
- Password: `Admin123!`

**⚠️ Change this password in production!**

## Development

### Database Commands

- Run migrations: `pnpm prisma migrate dev`
- Seed database: `pnpm prisma db seed`
- Open Prisma Studio: `pnpm prisma studio`
- Generate Prisma Client: `pnpm prisma generate`

### Project Structure

```
app/                  # Next.js App Router
  (auth)/            # Authentication pages
  api/               # API routes
components/          # React components
  ui/               # shadcn/ui components
lib/                 # Business logic
  auth/             # Authentication utilities
  db/               # Database client
  validations/      # Zod schemas
prisma/             # Database schema & migrations
types/              # TypeScript type definitions
```

## Phase 1 Complete ✅

Foundation phase includes:
- ✅ Project setup with Next.js 15
- ✅ PostgreSQL database with Prisma
- ✅ Complete database schema (Users, Wallets, Services, Orders, etc.)
- ✅ NextAuth.js authentication (Email/Password + Google OAuth)
- ✅ Login and Signup pages
- ✅ Seed data (Admin user, 10 platforms, sample services)

### Next Phases

- **Phase 2**: Landing page and public pages
- **Phase 3**: User dashboard and service browsing
- **Phase 4**: Order and wallet system
- **Phase 5**: Payment integration (Stripe & PayPal)
- **Phase 6**: Order fulfillment system
- **Phase 7**: Admin panel
- **Phase 8**: Analytics and final polish

## License

MIT

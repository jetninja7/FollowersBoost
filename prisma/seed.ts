import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

async function main() {
  console.log('🌱 Starting database seed...\n')

  // 1. Create Admin User
  console.log('👤 Seeding admin user...')
  const hashedPassword = await bcrypt.hash('Admin123!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@followersboost.com' },
    update: {},
    create: {
      email: 'admin@followersboost.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // 2. Create Wallet for Admin
  console.log('\n💰 Seeding admin wallet...')
  const wallet = await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balance: 1000.00,
    },
  })
  console.log('✅ Wallet created with balance:', wallet.balance)

  // 3. Seed Platforms
  console.log('\n📱 Seeding platforms...')
  const platformsData = [
    { name: 'Instagram', slug: 'instagram', icon: 'instagram', isActive: true },
    { name: 'Facebook', slug: 'facebook', icon: 'facebook', isActive: true },
    { name: 'Twitter', slug: 'twitter', icon: 'twitter', isActive: true },
    { name: 'YouTube', slug: 'youtube', icon: 'youtube', isActive: true },
    { name: 'TikTok', slug: 'tiktok', icon: 'music', isActive: true },
    { name: 'LinkedIn', slug: 'linkedin', icon: 'linkedin', isActive: true },
    { name: 'Telegram', slug: 'telegram', icon: 'send', isActive: true },
    { name: 'Snapchat', slug: 'snapchat', icon: 'ghost', isActive: true },
    { name: 'Pinterest', slug: 'pinterest', icon: 'pinterest', isActive: true },
    { name: 'Twitch', slug: 'twitch', icon: 'twitch', isActive: true },
  ]

  const platforms = []
  for (const platformData of platformsData) {
    const platform = await prisma.platform.upsert({
      where: { slug: platformData.slug },
      update: {},
      create: platformData,
    })
    platforms.push(platform)
    console.log('  ✅', platform.name)
  }

  // 4. Seed Service Categories (Instagram only for now)
  console.log('\n📂 Seeding service categories...')
  const instagram = platforms.find(p => p.slug === 'instagram')
  if (!instagram) {
    throw new Error('Instagram platform not found')
  }

  const categoriesData = [
    { name: 'Followers', slug: 'instagram-followers', platformId: instagram.id },
    { name: 'Likes', slug: 'instagram-likes', platformId: instagram.id },
    { name: 'Views', slug: 'instagram-views', platformId: instagram.id },
    { name: 'Comments', slug: 'instagram-comments', platformId: instagram.id },
  ]

  const categories = []
  for (const categoryData of categoriesData) {
    const category = await prisma.serviceCategory.upsert({
      where: {
        slug: categoryData.slug
      },
      update: {},
      create: categoryData,
    })
    categories.push(category)
    console.log('  ✅', category.name, '(Instagram)')
  }

  // 5. Seed Sample Services (Instagram Followers)
  console.log('\n🎯 Seeding sample services...')
  const followersCategory = categories.find(c => c.slug === 'instagram-followers')
  if (!followersCategory) {
    throw new Error('Followers category not found')
  }

  const servicesData = [
    {
      name: 'Instagram Followers - Basic',
      slug: 'instagram-followers-basic',
      description: 'High-quality Instagram followers delivered gradually over 1-3 days. Real-looking accounts with profile pictures.',
      categoryId: followersCategory.id,
      price: 0.05,
      minQuantity: 100,
      maxQuantity: 5000,
      estimatedDeliveryTime: '1-3 days',
      isActive: true,
    },
    {
      name: 'Instagram Followers - Premium',
      slug: 'instagram-followers-premium',
      description: 'Premium Instagram followers from active accounts. Includes engagement and long-term retention guarantee.',
      categoryId: followersCategory.id,
      price: 0.10,
      minQuantity: 500,
      maxQuantity: 10000,
      estimatedDeliveryTime: '1-2 days',
      isActive: true,
    },
    {
      name: 'Instagram Followers - Express',
      slug: 'instagram-followers-express',
      description: 'Super-fast delivery of Instagram followers. Perfect for instant social proof. Delivered within hours.',
      categoryId: followersCategory.id,
      price: 0.08,
      minQuantity: 100,
      maxQuantity: 3000,
      estimatedDeliveryTime: '2-6 hours',
      isActive: true,
    },
  ]

  for (const serviceData of servicesData) {
    const service = await prisma.service.upsert({
      where: {
        slug: serviceData.slug
      },
      update: {},
      create: serviceData,
    })
    console.log(`  ✅ ${service.name} ($${service.price}/unit)`)
  }

  console.log('\n✨ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

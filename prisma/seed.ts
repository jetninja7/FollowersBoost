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

  // 4. Seed Service Categories (All platforms)
  console.log('\n📂 Seeding service categories...')

  const categoriesData = []

  // Instagram
  const instagram = platforms.find(p => p.slug === 'instagram')!
  categoriesData.push(
    { name: 'Followers', slug: 'instagram-followers', platformId: instagram.id, description: 'Grow your Instagram follower base' },
    { name: 'Likes', slug: 'instagram-likes', platformId: instagram.id, description: 'Boost your post likes' },
    { name: 'Views', slug: 'instagram-views', platformId: instagram.id, description: 'Increase video and story views' },
    { name: 'Comments', slug: 'instagram-comments', platformId: instagram.id, description: 'Get authentic comments' }
  )

  // TikTok
  const tiktok = platforms.find(p => p.slug === 'tiktok')!
  categoriesData.push(
    { name: 'Followers', slug: 'tiktok-followers', platformId: tiktok.id, description: 'Grow your TikTok following' },
    { name: 'Likes', slug: 'tiktok-likes', platformId: tiktok.id, description: 'Get more likes on your videos' },
    { name: 'Views', slug: 'tiktok-views', platformId: tiktok.id, description: 'Boost your video views' }
  )

  // YouTube
  const youtube = platforms.find(p => p.slug === 'youtube')!
  categoriesData.push(
    { name: 'Subscribers', slug: 'youtube-subscribers', platformId: youtube.id, description: 'Gain YouTube subscribers' },
    { name: 'Views', slug: 'youtube-views', platformId: youtube.id, description: 'Increase video views' },
    { name: 'Likes', slug: 'youtube-likes', platformId: youtube.id, description: 'Get more likes on videos' }
  )

  // Twitter
  const twitter = platforms.find(p => p.slug === 'twitter')!
  categoriesData.push(
    { name: 'Followers', slug: 'twitter-followers', platformId: twitter.id, description: 'Grow your Twitter following' },
    { name: 'Retweets', slug: 'twitter-retweets', platformId: twitter.id, description: 'Increase retweets' },
    { name: 'Likes', slug: 'twitter-likes', platformId: twitter.id, description: 'Boost tweet engagement' }
  )

  // Facebook
  const facebook = platforms.find(p => p.slug === 'facebook')!
  categoriesData.push(
    { name: 'Page Likes', slug: 'facebook-page-likes', platformId: facebook.id, description: 'Get more page likes' },
    { name: 'Followers', slug: 'facebook-followers', platformId: facebook.id, description: 'Grow your Facebook following' },
    { name: 'Post Engagement', slug: 'facebook-engagement', platformId: facebook.id, description: 'Increase post interactions' }
  )

  const categories = []
  for (const categoryData of categoriesData) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    })
    categories.push(category)
    console.log(`  ✅ ${category.name} (${platforms.find(p => p.id === category.platformId)?.name})`)
  }

  // 5. Seed Services (All platforms)
  console.log('\n🎯 Seeding services...')

  const servicesData = [
    // Instagram Services
    {
      name: 'Instagram Followers - Starter',
      slug: 'instagram-followers-starter',
      description: 'High-quality Instagram followers delivered gradually over 7-10 days. Perfect for organic growth.',
      categoryId: categories.find(c => c.slug === 'instagram-followers')!.id,
      price: 4.99,
      minQuantity: 100,
      maxQuantity: 1000,
      estimatedDeliveryTime: '7-10 days',
      isActive: true,
    },
    {
      name: 'Instagram Followers - Pro',
      slug: 'instagram-followers-pro',
      description: 'Premium Instagram followers with high engagement rate. Delivered over 10-14 days.',
      categoryId: categories.find(c => c.slug === 'instagram-followers')!.id,
      price: 19.99,
      minQuantity: 500,
      maxQuantity: 5000,
      estimatedDeliveryTime: '10-14 days',
      isActive: true,
    },
    {
      name: 'Instagram Likes - Instant',
      slug: 'instagram-likes-instant',
      description: 'Fast delivery of Instagram likes. Start within 1 hour.',
      categoryId: categories.find(c => c.slug === 'instagram-likes')!.id,
      price: 2.99,
      minQuantity: 50,
      maxQuantity: 5000,
      estimatedDeliveryTime: '1-6 hours',
      isActive: true,
    },
    {
      name: 'Instagram Views - Fast',
      slug: 'instagram-views-fast',
      description: 'Boost your video and reel views quickly.',
      categoryId: categories.find(c => c.slug === 'instagram-views')!.id,
      price: 1.99,
      minQuantity: 1000,
      maxQuantity: 100000,
      estimatedDeliveryTime: '1-3 hours',
      isActive: true,
    },

    // TikTok Services
    {
      name: 'TikTok Followers - Starter',
      slug: 'tiktok-followers-starter',
      description: 'Real TikTok followers delivered gradually.',
      categoryId: categories.find(c => c.slug === 'tiktok-followers')!.id,
      price: 5.99,
      minQuantity: 100,
      maxQuantity: 2000,
      estimatedDeliveryTime: '5-7 days',
      isActive: true,
    },
    {
      name: 'TikTok Likes - Instant',
      slug: 'tiktok-likes-instant',
      description: 'Fast TikTok likes delivered within hours.',
      categoryId: categories.find(c => c.slug === 'tiktok-likes')!.id,
      price: 3.99,
      minQuantity: 100,
      maxQuantity: 10000,
      estimatedDeliveryTime: '1-6 hours',
      isActive: true,
    },
    {
      name: 'TikTok Views - Boost',
      slug: 'tiktok-views-boost',
      description: 'Massive view boost for your TikTok videos.',
      categoryId: categories.find(c => c.slug === 'tiktok-views')!.id,
      price: 2.99,
      minQuantity: 1000,
      maxQuantity: 500000,
      estimatedDeliveryTime: '1-24 hours',
      isActive: true,
    },

    // YouTube Services
    {
      name: 'YouTube Subscribers - Starter',
      slug: 'youtube-subscribers-starter',
      description: 'Real YouTube subscribers with retention guarantee.',
      categoryId: categories.find(c => c.slug === 'youtube-subscribers')!.id,
      price: 9.99,
      minQuantity: 50,
      maxQuantity: 1000,
      estimatedDeliveryTime: '7-14 days',
      isActive: true,
    },
    {
      name: 'YouTube Views - Fast',
      slug: 'youtube-views-fast',
      description: 'High retention YouTube views from real users.',
      categoryId: categories.find(c => c.slug === 'youtube-views')!.id,
      price: 4.99,
      minQuantity: 1000,
      maxQuantity: 100000,
      estimatedDeliveryTime: '24-48 hours',
      isActive: true,
    },
    {
      name: 'YouTube Likes - Premium',
      slug: 'youtube-likes-premium',
      description: 'Authentic YouTube likes from active accounts.',
      categoryId: categories.find(c => c.slug === 'youtube-likes')!.id,
      price: 6.99,
      minQuantity: 50,
      maxQuantity: 5000,
      estimatedDeliveryTime: '12-24 hours',
      isActive: true,
    },

    // Twitter Services
    {
      name: 'Twitter Followers - Growth',
      slug: 'twitter-followers-growth',
      description: 'Real Twitter followers interested in your niche.',
      categoryId: categories.find(c => c.slug === 'twitter-followers')!.id,
      price: 7.99,
      minQuantity: 100,
      maxQuantity: 5000,
      estimatedDeliveryTime: '5-10 days',
      isActive: true,
    },
    {
      name: 'Twitter Retweets - Viral',
      slug: 'twitter-retweets-viral',
      description: 'Get your tweets retweeted for maximum reach.',
      categoryId: categories.find(c => c.slug === 'twitter-retweets')!.id,
      price: 4.99,
      minQuantity: 10,
      maxQuantity: 1000,
      estimatedDeliveryTime: '1-12 hours',
      isActive: true,
    },

    // Facebook Services
    {
      name: 'Facebook Page Likes - Starter',
      slug: 'facebook-page-likes-starter',
      description: 'Grow your Facebook page with real likes.',
      categoryId: categories.find(c => c.slug === 'facebook-page-likes')!.id,
      price: 8.99,
      minQuantity: 100,
      maxQuantity: 10000,
      estimatedDeliveryTime: '7-14 days',
      isActive: true,
    },
    {
      name: 'Facebook Followers - Pro',
      slug: 'facebook-followers-pro',
      description: 'Quality Facebook followers for your profile.',
      categoryId: categories.find(c => c.slug === 'facebook-followers')!.id,
      price: 6.99,
      minQuantity: 100,
      maxQuantity: 5000,
      estimatedDeliveryTime: '5-10 days',
      isActive: true,
    },
  ]

  for (const serviceData of servicesData) {
    const service = await prisma.service.upsert({
      where: { slug: serviceData.slug },
      update: {},
      create: serviceData,
    })
    console.log(`  ✅ ${service.name} ($${service.price})`)
  }

  // Summary
  const [platformCount, categoryCount, serviceCount] = await Promise.all([
    prisma.platform.count(),
    prisma.serviceCategory.count(),
    prisma.service.count(),
  ])

  console.log('\n✨ Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`   Platforms: ${platformCount}`)
  console.log(`   Categories: ${categoryCount}`)
  console.log(`   Services: ${serviceCount}`)
  console.log(`\n👤 Admin credentials:`)
  console.log(`   Email: admin@followersboost.com`)
  console.log(`   Password: Admin123!`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

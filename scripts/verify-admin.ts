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
  console.log('🔍 Verifying admin user in database...\n')

  // Find admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@followersboost.com' },
  })

  if (!admin) {
    console.log('❌ Admin user NOT FOUND in database')
    console.log('Run: npx prisma db seed')
    process.exit(1)
  }

  console.log('✅ Admin user found:')
  console.log('   ID:', admin.id)
  console.log('   Email:', admin.email)
  console.log('   Name:', admin.name)
  console.log('   Role:', admin.role)
  console.log('   Has password:', !!admin.password)
  console.log('   Password hash length:', admin.password?.length)

  // Test password verification
  if (admin.password) {
    const testPassword = 'Admin123!'
    const isValid = await bcrypt.compare(testPassword, admin.password)
    console.log('\n🔐 Password verification test:')
    console.log('   Test password:', testPassword)
    console.log('   Hash matches:', isValid ? '✅ YES' : '❌ NO')

    if (!isValid) {
      console.log('\n⚠️  Password hash does not match!')
      console.log('   Hash in DB:', admin.password.substring(0, 20) + '...')
      console.log('   Expected bcrypt format: $2a$ or $2b$')
      console.log('   Actual prefix:', admin.password.substring(0, 4))
    }
  }

  // Check wallet
  const wallet = await prisma.wallet.findUnique({
    where: { userId: admin.id },
  })

  console.log('\n💰 Admin wallet:')
  if (wallet) {
    console.log('   ✅ Found')
    console.log('   Balance:', wallet.balance)
  } else {
    console.log('   ❌ NOT FOUND')
  }

  // Count total users
  const userCount = await prisma.user.count()
  console.log('\n📊 Total users in database:', userCount)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

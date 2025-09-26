// Database Seed Script
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Add any seed data here if needed
  console.log('✅ Database seed completed')
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

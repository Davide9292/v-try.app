// Minimal debug script to test basic functionality
console.log('🔍 Debug script starting...')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', process.env.PORT)
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING')

try {
  console.log('📦 Testing basic imports...')
  const fastify = require('fastify')
  console.log('✅ Fastify imported successfully')
  
  const { PrismaClient } = require('@prisma/client')
  console.log('✅ Prisma imported successfully')
  
  console.log('🗃️ Testing Prisma client creation...')
  const prisma = new PrismaClient()
  console.log('✅ Prisma client created successfully')
  
  console.log('🚀 Testing Fastify server creation...')
  const server = fastify({ logger: true })
  console.log('✅ Fastify server created successfully')
  
  console.log('🎯 All basic tests passed!')
  
} catch (error) {
  console.error('❌ Error during testing:', error)
  console.error('Stack trace:', error.stack)
  process.exit(1)
}

console.log('✅ Debug script completed successfully')

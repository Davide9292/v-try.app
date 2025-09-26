// Minimal debug script to test basic functionality
console.log('🔍 Debug script starting...')
console.log('📋 Environment Variables:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', process.env.PORT)
console.log('HOST:', process.env.HOST)
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING')
console.log('REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'MISSING')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING')
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING')

console.log('🔧 System Info:')
console.log('Node.js version:', process.version)
console.log('Platform:', process.platform)
console.log('Architecture:', process.arch)
console.log('Working directory:', process.cwd())

console.log('📁 File System Check:')
const fs = require('fs')
console.log('Current directory contents:', fs.readdirSync('.'))
console.log('Package.json exists:', fs.existsSync('package.json'))
console.log('Node_modules exists:', fs.existsSync('node_modules'))
console.log('Src directory exists:', fs.existsSync('src'))

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

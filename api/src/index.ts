// V-Try.app API Server - Enterprise Grade with Fastify
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import redis from '@fastify/redis'
import websocket from '@fastify/websocket'
import { PrismaClient } from '@prisma/client'

// Routes
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import aiRoutes from './routes/ai'
import feedRoutes from './routes/feed'
import collectionsRoutes from './routes/collections'

// Middleware
import { authenticateToken, authPlugin } from './middleware/auth'
import { validateRequest } from './middleware/validation'
import { errorHandler, notFoundHandler } from './middleware/error'

// Services
import { RedisService } from './services/redis'
import { WebSocketService } from './services/websocket'

// Types
import type { FastifyInstance } from 'fastify'

// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '3001'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET!,
  corsOrigins: process.env.NODE_ENV === 'production' 
    ? ['https://v-try.app', 'https://www.v-try.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  kieApiKey: process.env.KIE_AI_API_KEY!,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!,
}

// Validate required environment variables
console.log('🔍 Validating environment variables...')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', process.env.PORT)
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING')

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
]

// Optional vars that don't crash the app
const optionalEnvVars = [
  'KIE_AI_API_KEY',
  'CLOUDINARY_CLOUD_NAME', 
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
]

const missingRequired = requiredEnvVars.filter(envVar => !process.env[envVar])
const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar])

if (missingRequired.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingRequired.join(', ')}`)
  process.exit(1)
}

if (missingOptional.length > 0) {
  console.warn(`⚠️  Missing optional environment variables: ${missingOptional.join(', ')}`)
  console.warn('   Some features may be disabled')
}

console.log('✅ Environment validation passed')

// Initialize Prisma client
console.log('🗃️  Initializing Prisma client...')
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
})
console.log('✅ Prisma client initialized')

// Build Fastify server
const buildServer = async (): Promise<FastifyInstance> => {
  console.log('🚀 Building Fastify server...')
  const server = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'warn' : 'info',
      transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
  })

  // Register plugins
  await server.register(helmet, {
    contentSecurityPolicy: config.nodeEnv === 'production',
  })

  await server.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  })

  // Register Redis first
  await server.register(redis, {
    url: config.redisUrl,
    family: 4,
  })

  // Register rate limit with in-memory store (fallback)
  await server.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
    skipOnError: true, // Skip rate limiting on errors
  })

  await server.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      algorithm: 'HS256',
      expiresIn: '15m',
    },
    verify: {
      algorithms: ['HS256'],
    },
  })

  await server.register(websocket)

  // Add global context
  server.decorate('prisma', prisma)
  server.decorate('config', config)

  // Initialize services
  const redisService = new RedisService(server.redis)
  const wsService = new WebSocketService(server)
  
  server.decorate('redisService', redisService)
  server.decorate('wsService', wsService)

  // Register auth plugin
  await server.register(authPlugin)

  // Add middleware
  server.addHook('onRequest', async (request, reply) => {
    await authenticateToken(request, reply, () => {})
  })
  server.setErrorHandler(errorHandler)

  // Health check endpoint
  server.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`
      await server.redis.ping()
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: config.nodeEnv,
      }
    } catch (error) {
      server.log.error('Health check failed:', error as any)
      throw new Error('Service unhealthy')
    }
  })

  // API routes
  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(userRoutes, { prefix: '/api/user' })
  await server.register(aiRoutes, { prefix: '/api/ai' })
  await server.register(feedRoutes, { prefix: '/api/feed' })
  await server.register(collectionsRoutes, { prefix: '/api/collections' })

  // WebSocket endpoint
  await server.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection: any, req: any) => {
      wsService.handleConnection(connection, req)
    })
  })

  // 404 handler
  server.setNotFoundHandler(notFoundHandler)

  return server
}

// Start server
const start = async () => {
  try {
    console.log('🚀 Starting V-Try.app API Server...')
    
    // Connect to database
    console.log('🔌 Connecting to database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Build and start server
    const server = await buildServer()
    
    await server.listen({ 
      port: config.port, 
      host: config.host 
    })

    console.log(`✅ Server running on http://${config.host}:${config.port}`)
    console.log(`📊 Environment: ${config.nodeEnv}`)
    console.log(`🔧 Health check: http://${config.host}:${config.port}/health`)
    
    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
      
      try {
        await server.close()
        await prisma.$disconnect()
        console.log('✅ Server shutdown complete')
        process.exit(0)
      } catch (error) {
        console.error('❌ Error during shutdown:', error)
        process.exit(1)
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Start if this file is run directly
if (require.main === module) {
  start()
}

export { buildServer, config }

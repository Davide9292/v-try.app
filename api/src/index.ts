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
import { authenticateToken } from './middleware/auth'
import { validateRequest } from './middleware/validation'
import { errorHandler } from './middleware/error'

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
  kieApiKey: process.env.KIE_AI_API_KEY!,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  awsS3Bucket: process.env.AWS_S3_BUCKET!,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET', 
  'KIE_AI_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'error'] : ['error'],
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
})

// Build Fastify server
const buildServer = async (): Promise<FastifyInstance> => {
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
    origin: config.nodeEnv === 'production' 
      ? ['https://v-try.app', 'https://www.v-try.app']
      : true,
    credentials: true,
  })

  await server.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
    redis: config.redisUrl,
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

  await server.register(redis, {
    url: config.redisUrl,
    family: 4,
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

  // Add middleware
  server.addHook('onRequest', authenticateToken)
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
      server.log.error('Health check failed:', error)
      throw server.httpErrors.serviceUnavailable('Service unhealthy')
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
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      wsService.handleConnection(connection, req)
    })
  })

  // 404 handler
  server.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    })
  })

  return server
}

// Start server
const start = async () => {
  try {
    console.log('🚀 Starting V-Try.app API Server...')
    
    // Connect to database
    await prisma.$connect()
    console.log('✅ Database connected')

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

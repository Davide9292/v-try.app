// Background Worker for Processing AI Generation Jobs
import Redis from 'ioredis'
import { BullQueueService } from './services/queue'

// Environment configuration
const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  nodeEnv: process.env.NODE_ENV || 'development',
  kieApiKey: process.env.KIE_AI_API_KEY!,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  awsS3Bucket: process.env.AWS_S3_BUCKET!,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  databaseUrl: process.env.DATABASE_URL!,
}

// Validate required environment variables
const requiredEnvVars = [
  'KIE_AI_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'DATABASE_URL'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

class Worker {
  private redis: Redis
  private queueService: BullQueueService

  constructor() {
    this.redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    })

    this.queueService = new BullQueueService(this.redis)
  }

  async start() {
    try {
      console.log('🚀 Starting V-Try.app Background Worker...')
      
      // Connect to Redis
      await this.redis.ping()
      console.log('✅ Redis connected')

      // Setup graceful shutdown
      this.setupGracefulShutdown()

      // Start monitoring
      this.startMonitoring()

      console.log('✅ Worker started successfully')
      console.log('📊 Monitoring queue for AI generation jobs...')

    } catch (error) {
      console.error('❌ Failed to start worker:', error)
      process.exit(1)
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
      
      try {
        // Close queue service
        await this.queueService.close()
        console.log('✅ Queue service closed')

        // Close Redis connection
        await this.redis.quit()
        console.log('✅ Redis connection closed')

        console.log('✅ Worker shutdown complete')
        process.exit(0)
      } catch (error) {
        console.error('❌ Error during shutdown:', error)
        process.exit(1)
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }

  private startMonitoring() {
    // Log queue statistics every 30 seconds
    setInterval(async () => {
      try {
        const stats = await this.queueService.getQueueStats()
        console.log('📊 Queue Stats:', {
          waiting: stats.waiting,
          active: stats.active,
          completed: stats.completed,
          failed: stats.failed,
          delayed: stats.delayed,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error('❌ Failed to get queue stats:', error)
      }
    }, 30000)

    // Clean old jobs every hour
    setInterval(async () => {
      try {
        await this.queueService.cleanOldJobs()
      } catch (error) {
        console.error('❌ Failed to clean old jobs:', error)
      }
    }, 60 * 60 * 1000)

    // Health check every 5 minutes
    setInterval(async () => {
      try {
        await this.redis.ping()
        console.log('💚 Health check: Redis connection OK')
      } catch (error) {
        console.error('❌ Health check failed: Redis connection error', error)
      }
    }, 5 * 60 * 1000)
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// Start worker if this file is run directly
if (require.main === module) {
  const worker = new Worker()
  worker.start()
}

export { Worker }

// Fastify Type Extensions
import { PrismaClient } from '@prisma/client'
import { RedisService } from '../services/redis'
import { CloudinaryService } from '../services/cloudinary'
import { GeminiAIService } from '../services/gemini-ai'
import { BullQueueService } from '../services/queue'
import { WebSocketService } from '../services/websocket'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    redis: RedisService
    cloudinary: CloudinaryService
    geminiAI: GeminiAIService
    queue: BullQueueService
    websocket: WebSocketService
    config: {
      port: number
      host: string
      nodeEnv: string
      databaseUrl: string
      redisUrl: string
      jwtSecret: string
      corsOrigins: string[]
      geminiApiKey: string
      cloudinaryCloudName: string
      cloudinaryApiKey: string
      cloudinaryApiSecret: string
    }
    authenticate: any
  }

  interface FastifyRequest {
    user?: {
      userId: string
      sessionId: string
      email: string
      username: string
      subscription: string
    }
  }
}

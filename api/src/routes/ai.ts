// AI Generation Routes - KIE AI Integration
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { checkDailyLimits } from '../middleware/auth'

// Validation schemas
const generateSchema = z.object({
  type: z.enum(['image', 'video']),
  targetImage: z.string().min(1, 'Target image is required'),
  style: z.enum(['realistic', 'artistic', 'fashion', 'lifestyle']).default('realistic'),
  productUrl: z.string().url('Valid product URL is required'),
  websiteInfo: z.object({
    domain: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    favicon: z.string().optional(),
  }),
  parameters: z.object({
    width: z.number().min(256).max(2048).optional(),
    height: z.number().min(256).max(2048).optional(),
    duration: z.number().min(1).max(10).optional(), // for video
    motionType: z.enum(['subtle', 'dynamic', 'showcase']).optional(),
  }).optional(),
})

// Types
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string
    sessionId: string
    email: string
    username: string
    subscription: string
  }
}

interface GenerateRequest extends AuthenticatedRequest {
  body: z.infer<typeof generateSchema>
}

interface StatusRequest extends AuthenticatedRequest {
  params: {
    jobId: string
  }
}

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Mock KIE AI service for development
  const mockKIEAI = {
    async generateImage(request: any): Promise<any> {
      const jobId = request.jobId // Use the jobId passed from the main function
      
      console.log(`🤖 Mock AI: Starting generation for job ${jobId}`)
      
      // Simulate processing time - use setImmediate to ensure it runs
      const completeJob = async () => {
        try {
          console.log(`🤖 Mock AI: Completing job ${jobId}`)
          
          // Update job status to completed
          await fastify.prisma.tryOnResult.update({
            where: { jobId },
            data: {
              status: 'COMPLETED',
              generatedImageUrl: `https://cdn.v-try.app/results/${jobId}.jpg`,
              processingTime: Math.floor(Math.random() * 30000) + 5000, // 5-35 seconds
              cost: request.type === 'video' ? 0.25 : 0.05,
              quality: Math.random() * 0.3 + 0.7, // 0.7-1.0
            },
          })
          
          console.log(`✅ Mock AI: Job ${jobId} completed successfully`)
          
          // Notify via WebSocket (if implemented)
          // wsService.notifyUser(request.userId, 'generation_complete', { jobId })
        } catch (error) {
          console.error(`❌ Mock AI: Generation failed for job ${jobId}:`, error)
        }
      }
      
      setTimeout(completeJob, 3000) // Fixed 3 seconds for testing
      
      return { jobId, status: 'queued' }
    },

    async getStatus(jobId: string): Promise<any> {
      const result = await fastify.prisma.tryOnResult.findUnique({
        where: { jobId },
        select: {
          status: true,
          generatedImageUrl: true,
          generatedVideoUrl: true,
          processingTime: true,
          cost: true,
          error: true,
        },
      })

      if (!result) {
        throw new Error('Job not found')
      }

      return {
        jobId,
        status: result.status.toLowerCase(),
        resultUrl: result.generatedImageUrl || result.generatedVideoUrl,
        processingTime: result.processingTime,
        cost: result.cost,
        error: result.error,
      }
    },

    async cancelGeneration(jobId: string): Promise<void> {
      await fastify.prisma.tryOnResult.update({
        where: { jobId },
        data: { status: 'CANCELLED' },
      })
    }
  }

  // Helper functions
  const extractProductInfo = (url: string, websiteInfo: any) => {
    // Mock product extraction - in production, use web scraping
    const domain = websiteInfo.domain
    
    return {
      url,
      title: websiteInfo.title || 'Product',
      description: websiteInfo.description,
      category: getCategoryFromDomain(domain),
      brand: getBrandFromDomain(domain),
    }
  }

  const getCategoryFromDomain = (domain: string): string => {
    const categoryMap: Record<string, string> = {
      'zara.com': 'Fashion',
      'hm.com': 'Fashion',
      'nike.com': 'Sportswear',
      'adidas.com': 'Sportswear',
      'amazon.com': 'General',
      'ebay.com': 'General',
    }
    
    return categoryMap[domain] || 'Unknown'
  }

  const getBrandFromDomain = (domain: string): string => {
    const parts = domain.split('.')
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  }

  const updateApiUsage = async (
    userId: string, 
    type: 'image' | 'video',
    cost: number
  ) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await fastify.prisma.apiUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        imagesGenerated: type === 'image' ? { increment: 1 } : undefined,
        videosGenerated: type === 'video' ? { increment: 1 } : undefined,
        totalCost: { increment: cost },
        apiCalls: { increment: 1 },
      },
      create: {
        userId,
        date: today,
        imagesGenerated: type === 'image' ? 1 : 0,
        videosGenerated: type === 'video' ? 1 : 0,
        totalCost: cost,
        apiCalls: 1,
      },
    })
  }

  // POST /api/ai/generate
  fastify.post('/generate', {
    preHandler: [fastify.authenticate]
  }, async (request: GenerateRequest, reply: FastifyReply) => {
    try {
      // Validate input
      const generateData = generateSchema.parse(request.body)

      // Check daily limits
      const limits = await checkDailyLimits(
        fastify.prisma,
        request.user.userId,
        request.user.subscription,
        generateData.type
      )

      if (!limits.allowed) {
        return reply.code(429).send({
          success: false,
          error: {
            code: 'DAILY_LIMIT_EXCEEDED',
            message: `Daily ${generateData.type} generation limit exceeded`,
          },
          data: {
            remaining: limits.remaining,
            resetAt: limits.resetAt,
          },
        })
      }

      // Get user images
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          faceImageUrl: true,
          bodyImageUrl: true,
        },
      })

      if (!user?.faceImageUrl || !user?.bodyImageUrl) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'MISSING_USER_IMAGES',
            message: 'Please upload your face and body images first',
          },
        })
      }

      // Extract product info
      const productInfo = extractProductInfo(generateData.productUrl, generateData.websiteInfo)

      // Validate and potentially truncate base64 image data
      const targetImageData = generateData.targetImage
      if (targetImageData.length > 16777215) { // MySQL TEXT field limit
        console.warn('⚠️ Target image data is very large:', targetImageData.length, 'bytes')
      }

      // Create job record
      const jobId = nanoid()
      const tryOnResult = await fastify.prisma.tryOnResult.create({
        data: {
          id: nanoid(),
          userId: request.user.userId,
          jobId,
          originalImageUrl: user.faceImageUrl || user.bodyImageUrl, // User's image
          targetImageUrl: generateData.targetImage, // Product image from website
          generationType: generateData.type.toUpperCase() as any,
          productUrl: generateData.productUrl,
          productTitle: productInfo.title,
          productDescription: productInfo.description,
          websiteDomain: generateData.websiteInfo.domain,
          websiteTitle: generateData.websiteInfo.title,
          websiteDescription: generateData.websiteInfo.description,
          aiModel: generateData.type === 'video' ? 'veo3' : 'nano_banana',
          aiPrompt: `Create a ${generateData.style} virtual try-on of the person wearing the product from the image`,
          aiStyle: generateData.style.toUpperCase() as any,
          aiParameters: generateData.parameters || {},
          faceImageUsed: user.faceImageUrl,
          bodyImageUsed: user.bodyImageUrl,
          deviceInfo: {
            userAgent: request.headers['user-agent'] || '',
            platform: 'web',
            viewport: 'unknown',
          },
          status: 'QUEUED',
          isPublic: false,
          tags: [generateData.style, productInfo.category].filter(Boolean),
        } as any,
      })

      // Start AI generation (mock for now)
      const aiResponse = await mockKIEAI.generateImage({
        type: generateData.type,
        userFaceImage: user.faceImageUrl,
        userBodyImage: user.bodyImageUrl,
        targetImage: generateData.targetImage,
        style: generateData.style,
        parameters: generateData.parameters,
        userId: request.user.userId,
        jobId: jobId, // Pass the actual jobId from database
      })

      // Update usage statistics
      const estimatedCost = generateData.type === 'video' ? 0.25 : 0.05
      await updateApiUsage(request.user.userId, generateData.type, estimatedCost)

      reply.send({
        success: true,
        data: {
          jobId: tryOnResult.jobId,
          status: 'queued',
          estimatedTime: generateData.type === 'video' ? 120 : 30, // seconds
          cost: estimatedCost,
        },
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        })
      }

      // Enhanced error logging
      console.error('🔥 AI Generation Error Details:', {
        message: (error as any)?.message || 'Unknown error',
        stack: (error as any)?.stack || 'No stack trace',
        name: (error as any)?.name || 'Unknown error type',
        code: (error as any)?.code || 'No error code',
        error: error
      })
      
      fastify.log.error('Generate error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: (error as any)?.message || 'Failed to start generation',
        },
      })
    }
  })

  // GET /api/ai/status/:jobId
  fastify.get('/status/:jobId', {
    preHandler: [fastify.authenticate]
  }, async (request: StatusRequest, reply: FastifyReply) => {
    try {
      const { jobId } = request.params
      console.log(`📊 Status check for job: ${jobId} by user: ${request.user.userId}`)

      // Verify job belongs to user
      const tryOnResult = await fastify.prisma.tryOnResult.findFirst({
        where: {
          jobId,
          userId: request.user.userId,
        },
      })

      if (!tryOnResult) {
        console.log(`❌ Job ${jobId} not found for user ${request.user.userId}`)
        return reply.code(404).send({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND',
            message: 'Generation job not found',
          },
        })
      }

      console.log(`✅ Job ${jobId} found, current status: ${tryOnResult.status}`)

      // Get status from AI service
      const status = await mockKIEAI.getStatus(jobId)
      console.log(`📊 Returning status for job ${jobId}:`, status)

      reply.send({
        success: true,
        data: status,
      })

    } catch (error) {
      fastify.log.error('Get status error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get generation status',
        },
      })
    }
  })

  // DELETE /api/ai/cancel/:jobId
  fastify.delete('/cancel/:jobId', {
    preHandler: [fastify.authenticate]
  }, async (request: StatusRequest, reply: FastifyReply) => {
    try {
      const { jobId } = request.params

      // Verify job belongs to user and is cancellable
      const tryOnResult = await fastify.prisma.tryOnResult.findFirst({
        where: {
          jobId,
          userId: request.user.userId,
          status: { in: ['QUEUED', 'PROCESSING'] },
        },
      })

      if (!tryOnResult) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'JOB_NOT_FOUND_OR_NOT_CANCELLABLE',
            message: 'Generation job not found or cannot be cancelled',
          },
        })
      }

      // Cancel with AI service
      await mockKIEAI.cancelGeneration(jobId)

      reply.send({
        success: true,
        message: 'Generation cancelled successfully',
      })

    } catch (error) {
      fastify.log.error('Cancel generation error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel generation',
        },
      })
    }
  })

  // GET /api/ai/models
  fastify.get('/models', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const models = [
        {
          id: 'nano_banana',
          name: 'Nano Banana',
          type: 'image',
          description: 'High-quality image generation optimized for fashion',
          cost: 0.05,
          averageTime: 15,
          maxResolution: '1024x1024',
        },
        {
          id: 'veo3',
          name: 'Veo3',
          type: 'video',
          description: 'Advanced video generation for dynamic try-on experiences',
          cost: 0.25,
          averageTime: 90,
          maxDuration: 10,
        },
      ]

      reply.send({
        success: true,
        data: { models },
      })

    } catch (error) {
      fastify.log.error('Get models error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get available models',
        },
      })
    }
  })

  // GET /api/ai/queue-status
  fastify.get('/queue-status', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      // Get queue statistics
      const queueStats = await fastify.prisma.tryOnResult.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      })

      const stats = queueStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count.status
        return acc
      }, {} as Record<string, number>)

      reply.send({
        success: true,
        data: {
          queue: stats,
          estimatedWaitTime: {
            image: Math.max(5, (stats.queued || 0) * 2), // 2 seconds per queued job
            video: Math.max(30, (stats.queued || 0) * 10), // 10 seconds per queued job
          },
        },
      })

    } catch (error) {
      fastify.log.error('Get queue status error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get queue status',
        },
      })
    }
  })
}

export default aiRoutes

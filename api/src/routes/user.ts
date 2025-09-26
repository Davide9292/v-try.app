// User Management Routes - Enterprise Grade
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import sharp from 'sharp'
import { nanoid } from 'nanoid'

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  preferences: z.object({
    defaultGenerationType: z.enum(['image', 'video']).optional(),
    defaultStyle: z.enum(['realistic', 'artistic', 'fashion', 'lifestyle']).optional(),
    autoSaveToFeed: z.boolean().optional(),
    publicProfile: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    qualityPreference: z.enum(['fast', 'balanced', 'high']).optional(),
  }).optional(),
})

const uploadImagesSchema = z.object({
  faceImage: z.string().min(1, 'Face image is required'),
  bodyImage: z.string().min(1, 'Body image is required'),
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

interface UpdateProfileRequest extends AuthenticatedRequest {
  body: z.infer<typeof updateProfileSchema>
}

interface UploadImagesRequest extends AuthenticatedRequest {
  body: z.infer<typeof uploadImagesSchema>
}

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper functions
  const processAndUploadImage = async (
    base64Image: string, 
    type: 'face' | 'body',
    userId: string
  ): Promise<string> => {
    try {
      // Extract base64 data
      const base64Data = base64Image.includes(',') 
        ? base64Image.split(',')[1] 
        : base64Image
      
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      // Process image with Sharp
      const processedBuffer = await sharp(imageBuffer)
        .resize(512, 512, { 
          fit: 'cover',
          withoutEnlargement: false 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer()
      
      // Generate filename
      const filename = `${userId}/${type}_${nanoid()}.jpg`
      
      // In production, upload to S3
      // For now, return a mock URL
      const mockUrl = `https://cdn.v-try.app/users/${filename}`
      
      fastify.log.info(`Processed ${type} image for user ${userId}: ${mockUrl}`)
      
      return mockUrl
    } catch (error) {
      fastify.log.error(`Image processing failed for ${type}:`, error)
      throw new Error(`Failed to process ${type} image`)
    }
  }

  const validateImageData = (base64Image: string): boolean => {
    try {
      if (!base64Image.startsWith('data:image/')) {
        return false
      }
      
      const base64Data = base64Image.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Check file size (max 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        return false
      }
      
      return true
    } catch {
      return false
    }
  }

  // GET /api/user/profile
  fastify.get('/profile', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          faceImageUrl: true,
          bodyImageUrl: true,
          emailVerified: true,
          subscription: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      })

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        })
      }

      reply.send({
        success: true,
        data: user,
      })

    } catch (error) {
      fastify.log.error('Get profile error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user profile',
        },
      })
    }
  })

  // PUT /api/user/profile
  fastify.put('/profile', {
    preHandler: [fastify.authenticate]
  }, async (request: UpdateProfileRequest, reply: FastifyReply) => {
    try {
      // Validate input
      const updateData = updateProfileSchema.parse(request.body)

      // Check if username is already taken (if updating username)
      if (updateData.username) {
        const existingUser = await fastify.prisma.user.findFirst({
          where: {
            username: updateData.username,
            NOT: { id: request.user.userId }
          }
        })

        if (existingUser) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'USERNAME_TAKEN',
              message: 'Username is already taken',
            },
          })
        }
      }

      // Update user
      const updatedUser = await fastify.prisma.user.update({
        where: { id: request.user.userId },
        data: {
          ...updateData,
          preferences: updateData.preferences ? {
            ...updateData.preferences
          } : undefined,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          faceImageUrl: true,
          bodyImageUrl: true,
          emailVerified: true,
          subscription: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      })

      reply.send({
        success: true,
        data: updatedUser,
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

      fastify.log.error('Update profile error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        },
      })
    }
  })

  // POST /api/user/upload-images
  fastify.post('/upload-images', {
    preHandler: [fastify.authenticate]
  }, async (request: UploadImagesRequest, reply: FastifyReply) => {
    try {
      // Validate input
      const { faceImage, bodyImage } = uploadImagesSchema.parse(request.body)

      // Validate image data
      if (!validateImageData(faceImage)) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_FACE_IMAGE',
            message: 'Invalid face image format or size',
          },
        })
      }

      if (!validateImageData(bodyImage)) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_BODY_IMAGE',
            message: 'Invalid body image format or size',
          },
        })
      }

      // Process and upload images
      const [faceImageUrl, bodyImageUrl] = await Promise.all([
        processAndUploadImage(faceImage, 'face', request.user.userId),
        processAndUploadImage(bodyImage, 'body', request.user.userId),
      ])

      // Update user with image URLs
      const updatedUser = await fastify.prisma.user.update({
        where: { id: request.user.userId },
        data: {
          faceImageUrl,
          bodyImageUrl,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          faceImageUrl: true,
          bodyImageUrl: true,
          emailVerified: true,
          subscription: true,
          preferences: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      })

      reply.send({
        success: true,
        data: updatedUser,
        message: 'Images uploaded successfully',
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

      fastify.log.error('Upload images error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload images',
        },
      })
    }
  })

  // GET /api/user/usage
  fastify.get('/usage', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const usage = await fastify.prisma.apiUsage.findUnique({
        where: {
          userId_date: {
            userId: request.user.userId,
            date: today,
          },
        },
      })

      // Define limits based on subscription
      const limits = {
        FREE: { images: 10, videos: 2, apiCalls: 100 },
        PRO: { images: 100, videos: 20, apiCalls: 1000 },
        ENTERPRISE: { images: 1000, videos: 200, apiCalls: 10000 },
      }

      const userLimits = limits[request.user.subscription as keyof typeof limits] || limits.FREE
      const currentUsage = usage || {
        imagesGenerated: 0,
        videosGenerated: 0,
        apiCalls: 0,
        totalCost: 0,
      }

      reply.send({
        success: true,
        data: {
          usage: currentUsage,
          limits: userLimits,
          remaining: {
            images: Math.max(0, userLimits.images - currentUsage.imagesGenerated),
            videos: Math.max(0, userLimits.videos - currentUsage.videosGenerated),
            apiCalls: Math.max(0, userLimits.apiCalls - currentUsage.apiCalls),
          },
          resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      })

    } catch (error) {
      fastify.log.error('Get usage error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get usage data',
        },
      })
    }
  })

  // DELETE /api/user/account
  fastify.delete('/account', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      // Delete user and all related data (CASCADE will handle relations)
      await fastify.prisma.user.delete({
        where: { id: request.user.userId },
      })

      reply.send({
        success: true,
        message: 'Account deleted successfully',
      })

    } catch (error) {
      fastify.log.error('Delete account error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account',
        },
      })
    }
  })

  // GET /api/user/sessions
  fastify.get('/sessions', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const sessions = await fastify.prisma.session.findMany({
        where: { userId: request.user.userId },
        select: {
          id: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true,
        },
        orderBy: { lastUsedAt: 'desc' },
      })

      reply.send({
        success: true,
        data: {
          sessions: sessions.map(session => ({
            ...session,
            isCurrent: session.id === request.user.sessionId,
          })),
        },
      })

    } catch (error) {
      fastify.log.error('Get sessions error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get sessions',
        },
      })
    }
  })

  // DELETE /api/user/sessions/:sessionId
  fastify.delete('/sessions/:sessionId', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest & { params: { sessionId: string } }, reply: FastifyReply) => {
    try {
      const { sessionId } = request.params

      // Don't allow deleting current session
      if (sessionId === request.user.sessionId) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'CANNOT_DELETE_CURRENT_SESSION',
            message: 'Cannot delete current session',
          },
        })
      }

      await fastify.prisma.session.delete({
        where: {
          id: sessionId,
          userId: request.user.userId, // Ensure user can only delete their own sessions
        },
      })

      reply.send({
        success: true,
        message: 'Session deleted successfully',
      })

    } catch (error) {
      if (error.code === 'P2025') { // Prisma not found error
        return reply.code(404).send({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Session not found',
          },
        })
      }

      fastify.log.error('Delete session error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete session',
        },
      })
    }
  })
}

export default userRoutes

// Feed Routes - User's Try-On History
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

// Validation schemas
const getFeedSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['newest', 'oldest', 'most_liked', 'most_viewed']).default('newest'),
  generationType: z.enum(['image', 'video', 'all']).default('all'),
  style: z.array(z.enum(['REALISTIC', 'ARTISTIC', 'FASHION', 'LIFESTYLE'])).optional(),
  websites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

const searchFeedSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

const updateResultSchema = z.object({
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
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

interface GetFeedRequest extends AuthenticatedRequest {
  query: z.infer<typeof getFeedSchema>
}

interface SearchFeedRequest extends AuthenticatedRequest {
  query: z.infer<typeof searchFeedSchema>
}

interface UpdateResultRequest extends AuthenticatedRequest {
  params: {
    resultId: string
  }
  body: z.infer<typeof updateResultSchema>
}

interface DeleteResultRequest extends AuthenticatedRequest {
  params: {
    resultId: string
  }
}

const feedRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper functions
  const buildFeedQuery = (userId: string, filters: any) => {
    const where: any = { userId }

    if (filters.generationType !== 'all') {
      where.generationType = filters.generationType.toUpperCase()
    }

    if (filters.style && filters.style.length > 0) {
      where.aiStyle = { in: filters.style }
    }

    if (filters.websites && filters.websites.length > 0) {
      where.websiteDomain = { in: filters.websites }
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo
      }
    }

    return where
  }

  const buildOrderBy = (sortBy: string) => {
    switch (sortBy) {
      case 'oldest':
        return { createdAt: 'asc' as const }
      case 'most_liked':
        return { likes: 'desc' as const }
      case 'most_viewed':
        return { views: 'desc' as const }
      case 'newest':
      default:
        return { createdAt: 'desc' as const }
    }
  }

  // GET /api/feed
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request: GetFeedRequest, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const filters = getFeedSchema.parse(request.query)

      // Build query
      const where = buildFeedQuery(request.user.userId, filters)
      const orderBy = buildOrderBy(filters.sortBy)

      // Get total count
      const total = await fastify.prisma.tryOnResult.count({ where })

      // Get paginated results
      const results = await fastify.prisma.tryOnResult.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          jobId: true,
          generationType: true,
          status: true,
          originalImageUrl: true,
          targetImageUrl: true,
          generatedImageUrl: true,
          generatedVideoUrl: true,
          thumbnailUrl: true,
          productUrl: true,
          productTitle: true,
          productDescription: true,
          productBrand: true,
          websiteDomain: true,
          websiteTitle: true,
          aiModel: true,
          aiStyle: true,
          processingTime: true,
          cost: true,
          quality: true,
          isPublic: true,
          views: true,
          likes: true,
          shares: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Calculate pagination info
      const totalPages = Math.ceil(total / filters.limit)
      const hasNextPage = filters.page < totalPages
      const hasPrevPage = filters.page > 1

      reply.send({
        success: true,
        data: {
          results,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
        },
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        })
      }

      fastify.log.error('Get feed error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get feed',
        },
      })
    }
  })

  // GET /api/feed/search
  fastify.get('/search', {
    preHandler: [fastify.authenticate]
  }, async (request: SearchFeedRequest, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const searchParams = searchFeedSchema.parse(request.query)

      // Build search query
      const where = {
        userId: request.user.userId,
        OR: [
          { productTitle: { contains: searchParams.query, mode: 'insensitive' as const } },
          { productDescription: { contains: searchParams.query, mode: 'insensitive' as const } },
          { productBrand: { contains: searchParams.query, mode: 'insensitive' as const } },
          { websiteTitle: { contains: searchParams.query, mode: 'insensitive' as const } },
          { websiteDomain: { contains: searchParams.query, mode: 'insensitive' as const } },
          { tags: { hasSome: [searchParams.query] } },
        ],
      }

      // Get total count
      const total = await fastify.prisma.tryOnResult.count({ where })

      // Get paginated results
      const results = await fastify.prisma.tryOnResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (searchParams.page - 1) * searchParams.limit,
        take: searchParams.limit,
        select: {
          id: true,
          jobId: true,
          generationType: true,
          status: true,
          originalImageUrl: true,
          targetImageUrl: true,
          generatedImageUrl: true,
          generatedVideoUrl: true,
          thumbnailUrl: true,
          productUrl: true,
          productTitle: true,
          productDescription: true,
          productBrand: true,
          websiteDomain: true,
          websiteTitle: true,
          aiModel: true,
          aiStyle: true,
          processingTime: true,
          cost: true,
          quality: true,
          isPublic: true,
          views: true,
          likes: true,
          shares: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Calculate pagination info
      const totalPages = Math.ceil(total / searchParams.limit)
      const hasNextPage = searchParams.page < totalPages
      const hasPrevPage = searchParams.page > 1

      reply.send({
        success: true,
        data: {
          results,
          pagination: {
            page: searchParams.page,
            limit: searchParams.limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
          query: searchParams.query,
        },
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: error.errors,
          },
        })
      }

      fastify.log.error('Search feed error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search feed',
        },
      })
    }
  })

  // GET /api/feed/:resultId
  fastify.get('/:resultId', {
    preHandler: [fastify.authenticate]
  }, async (request: DeleteResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      // Get result details
      const result = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          userId: request.user.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          collectionItems: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      if (!result) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'RESULT_NOT_FOUND',
            message: 'Try-on result not found',
          },
        })
      }

      // Increment view count
      await fastify.prisma.tryOnResult.update({
        where: { id: resultId },
        data: { views: { increment: 1 } },
      })

      reply.send({
        success: true,
        data: {
          ...result,
          views: result.views + 1, // Return updated view count
        },
      })

    } catch (error) {
      fastify.log.error('Get result error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get result details',
        },
      })
    }
  })

  // PUT /api/feed/:resultId
  fastify.put('/:resultId', {
    preHandler: [fastify.authenticate]
  }, async (request: UpdateResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params
      const updateData = updateResultSchema.parse(request.body)

      // Verify result belongs to user
      const existingResult = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          userId: request.user.userId,
        },
      })

      if (!existingResult) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'RESULT_NOT_FOUND',
            message: 'Try-on result not found',
          },
        })
      }

      // Update result
      const updatedResult = await fastify.prisma.tryOnResult.update({
        where: { id: resultId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          jobId: true,
          generationType: true,
          status: true,
          originalImageUrl: true,
          targetImageUrl: true,
          generatedImageUrl: true,
          generatedVideoUrl: true,
          thumbnailUrl: true,
          productUrl: true,
          productTitle: true,
          productDescription: true,
          productBrand: true,
          websiteDomain: true,
          websiteTitle: true,
          aiModel: true,
          aiStyle: true,
          processingTime: true,
          cost: true,
          quality: true,
          isPublic: true,
          views: true,
          likes: true,
          shares: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      reply.send({
        success: true,
        data: updatedResult,
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

      fastify.log.error('Update result error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update result',
        },
      })
    }
  })

  // DELETE /api/feed/:resultId
  fastify.delete('/:resultId', {
    preHandler: [fastify.authenticate]
  }, async (request: DeleteResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      // Verify result belongs to user
      const existingResult = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          userId: request.user.userId,
        },
      })

      if (!existingResult) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'RESULT_NOT_FOUND',
            message: 'Try-on result not found',
          },
        })
      }

      // Delete result (this will cascade to collection items and likes)
      await fastify.prisma.tryOnResult.delete({
        where: { id: resultId },
      })

      reply.send({
        success: true,
        message: 'Try-on result deleted successfully',
      })

    } catch (error) {
      fastify.log.error('Delete result error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete result',
        },
      })
    }
  })

  // POST /api/feed/:resultId/like
  fastify.post('/:resultId/like', {
    preHandler: [fastify.authenticate]
  }, async (request: DeleteResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      // Check if result exists and is public or belongs to user
      const result = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          OR: [
            { isPublic: true },
            { userId: request.user.userId },
          ],
        },
      })

      if (!result) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'RESULT_NOT_FOUND',
            message: 'Try-on result not found or not accessible',
          },
        })
      }

      // Check if already liked
      const existingLike = await fastify.prisma.like.findUnique({
        where: {
          userId_tryOnResultId: {
            userId: request.user.userId,
            tryOnResultId: resultId,
          },
        },
      })

      if (existingLike) {
        return reply.code(409).send({
          success: false,
          error: {
            code: 'ALREADY_LIKED',
            message: 'You have already liked this result',
          },
        })
      }

      // Create like and increment counter
      await fastify.prisma.$transaction([
        fastify.prisma.like.create({
          data: {
            userId: request.user.userId,
            tryOnResultId: resultId,
          },
        }),
        fastify.prisma.tryOnResult.update({
          where: { id: resultId },
          data: { likes: { increment: 1 } },
        }),
      ])

      reply.send({
        success: true,
        message: 'Result liked successfully',
      })

    } catch (error) {
      fastify.log.error('Like result error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to like result',
        },
      })
    }
  })

  // DELETE /api/feed/:resultId/like
  fastify.delete('/:resultId/like', {
    preHandler: [fastify.authenticate]
  }, async (request: DeleteResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      // Check if like exists
      const existingLike = await fastify.prisma.like.findUnique({
        where: {
          userId_tryOnResultId: {
            userId: request.user.userId,
            tryOnResultId: resultId,
          },
        },
      })

      if (!existingLike) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'LIKE_NOT_FOUND',
            message: 'You have not liked this result',
          },
        })
      }

      // Remove like and decrement counter
      await fastify.prisma.$transaction([
        fastify.prisma.like.delete({
          where: {
            userId_tryOnResultId: {
              userId: request.user.userId,
              tryOnResultId: resultId,
            },
          },
        }),
        fastify.prisma.tryOnResult.update({
          where: { id: resultId },
          data: { likes: { decrement: 1 } },
        }),
      ])

      reply.send({
        success: true,
        message: 'Like removed successfully',
      })

    } catch (error) {
      fastify.log.error('Unlike result error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove like',
        },
      })
    }
  })

  // GET /api/feed/stats
  fastify.get('/stats', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      // Get user's feed statistics
      const stats = await fastify.prisma.tryOnResult.aggregate({
        where: { userId: request.user.userId },
        _count: {
          id: true,
        },
        _sum: {
          views: true,
          likes: true,
          shares: true,
          cost: true,
        },
      })

      // Get generation type breakdown
      const typeBreakdown = await fastify.prisma.tryOnResult.groupBy({
        by: ['generationType'],
        where: { userId: request.user.userId },
        _count: {
          generationType: true,
        },
      })

      // Get style breakdown
      const styleBreakdown = await fastify.prisma.tryOnResult.groupBy({
        by: ['aiStyle'],
        where: { userId: request.user.userId },
        _count: {
          aiStyle: true,
        },
      })

      reply.send({
        success: true,
        data: {
          totalResults: stats._count.id,
          totalViews: stats._sum.views || 0,
          totalLikes: stats._sum.likes || 0,
          totalShares: stats._sum.shares || 0,
          totalCost: stats._sum.cost || 0,
          typeBreakdown: typeBreakdown.reduce((acc, item) => {
            acc[item.generationType.toLowerCase()] = item._count.generationType
            return acc
          }, {} as Record<string, number>),
          styleBreakdown: styleBreakdown.reduce((acc, item) => {
            acc[item.aiStyle.toLowerCase()] = item._count.aiStyle
            return acc
          }, {} as Record<string, number>),
        },
      })

    } catch (error) {
      fastify.log.error('Get feed stats error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get feed statistics',
        },
      })
    }
  })
}

export default feedRoutes
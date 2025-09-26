// Feed Management Routes - User Try-On History
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

// Validation schemas
const getFeedSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['newest', 'oldest', 'most_liked', 'most_viewed']).default('newest'),
  generationType: z.enum(['image', 'video', 'all']).default('all'),
  style: z.array(z.enum(['realistic', 'artistic', 'fashion', 'lifestyle'])).optional(),
  websites: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  collections: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

const searchFeedSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
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
  params: { resultId: string }
  body: z.infer<typeof updateResultSchema>
}

interface ResultRequest extends AuthenticatedRequest {
  params: { resultId: string }
}

const feedRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper functions
  const buildSortOrder = (sortBy: string) => {
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

  const buildWhereClause = (userId: string, filters: any) => {
    const where: any = { userId }

    if (filters.generationType && filters.generationType !== 'all') {
      where.generationType = filters.generationType.toUpperCase()
    }

    if (filters.style && filters.style.length > 0) {
      where.aiStyle = { in: filters.style.map((s: string) => s.toUpperCase()) }
    }

    if (filters.websites && filters.websites.length > 0) {
      where.websiteDomain = { in: filters.websites }
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    return where
  }

  const incrementViews = async (resultId: string) => {
    try {
      await fastify.prisma.tryOnResult.update({
        where: { id: resultId },
        data: { views: { increment: 1 } },
      })
    } catch (error) {
      // Ignore errors - views are not critical
      fastify.log.warn('Failed to increment views:', error)
    }
  }

  // GET /api/feed
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request: GetFeedRequest, reply: FastifyReply) => {
    try {
      // Validate and parse query parameters
      const filters = getFeedSchema.parse(request.query)

      const where = buildWhereClause(request.user.userId, filters)
      const orderBy = buildSortOrder(filters.sortBy)

      // Get total count for pagination
      const total = await fastify.prisma.tryOnResult.count({ where })

      // Get results
      const results = await fastify.prisma.tryOnResult.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          originalImageUrl: true,
          generatedImageUrl: true,
          generatedVideoUrl: true,
          generationType: true,
          productUrl: true,
          productTitle: true,
          productDescription: true,
          productCategory: true,
          productBrand: true,
          websiteDomain: true,
          websiteTitle: true,
          aiStyle: true,
          status: true,
          isPublic: true,
          tags: true,
          views: true,
          likes: true,
          shares: true,
          clicks: true,
          saves: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      const hasMore = total > filters.page * filters.limit

      reply.send({
        success: true,
        data: {
          results,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            hasMore,
          },
          filters: {
            sortBy: filters.sortBy,
            generationType: filters.generationType,
            style: filters.style,
            websites: filters.websites,
            tags: filters.tags,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
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

      fastify.log.error('Get feed error:', error)
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
      const searchParams = searchFeedSchema.parse(request.query)

      // Build search conditions
      const searchConditions = {
        userId: request.user.userId,
        OR: [
          { productTitle: { contains: searchParams.query, mode: 'insensitive' as const } },
          { productDescription: { contains: searchParams.query, mode: 'insensitive' as const } },
          { productBrand: { contains: searchParams.query, mode: 'insensitive' as const } },
          { productCategory: { contains: searchParams.query, mode: 'insensitive' as const } },
          { websiteDomain: { contains: searchParams.query, mode: 'insensitive' as const } },
          { websiteTitle: { contains: searchParams.query, mode: 'insensitive' as const } },
          { tags: { hasSome: [searchParams.query] } },
        ],
      }

      // Get total count
      const total = await fastify.prisma.tryOnResult.count({
        where: searchConditions,
      })

      // Get results
      const results = await fastify.prisma.tryOnResult.findMany({
        where: searchConditions,
        orderBy: { createdAt: 'desc' },
        skip: (searchParams.page - 1) * searchParams.limit,
        take: searchParams.limit,
        select: {
          id: true,
          originalImageUrl: true,
          generatedImageUrl: true,
          generatedVideoUrl: true,
          generationType: true,
          productUrl: true,
          productTitle: true,
          productDescription: true,
          productCategory: true,
          productBrand: true,
          websiteDomain: true,
          websiteTitle: true,
          aiStyle: true,
          status: true,
          isPublic: true,
          tags: true,
          views: true,
          likes: true,
          shares: true,
          clicks: true,
          saves: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      const hasMore = total > searchParams.page * searchParams.limit

      reply.send({
        success: true,
        data: {
          results,
          pagination: {
            page: searchParams.page,
            limit: searchParams.limit,
            total,
            hasMore,
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

      fastify.log.error('Search feed error:', error)
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
  }, async (request: ResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      const result = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          userId: request.user.userId,
        },
        include: {
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

      // Increment view count asynchronously
      incrementViews(resultId)

      reply.send({
        success: true,
        data: {
          ...result,
          collections: result.collectionItems.map(item => ({
            id: item.collection.id,
            name: item.collection.name,
          })),
          collectionItems: undefined, // Remove the raw collection items
        },
      })

    } catch (error) {
      fastify.log.error('Get result error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get result',
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

      // Verify ownership
      const existing = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          userId: request.user.userId,
        },
      })

      if (!existing) {
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
            message: 'Invalid update data',
            details: error.errors,
          },
        })
      }

      fastify.log.error('Update result error:', error)
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
  }, async (request: ResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      // Verify ownership and delete
      const deletedResult = await fastify.prisma.tryOnResult.deleteMany({
        where: {
          id: resultId,
          userId: request.user.userId,
        },
      })

      if (deletedResult.count === 0) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'RESULT_NOT_FOUND',
            message: 'Try-on result not found',
          },
        })
      }

      reply.send({
        success: true,
        message: 'Result deleted successfully',
      })

    } catch (error) {
      fastify.log.error('Delete result error:', error)
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
  }, async (request: ResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      // Verify ownership
      const result = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          userId: request.user.userId,
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

      // Toggle like (for simplicity, we'll just increment)
      const updatedResult = await fastify.prisma.tryOnResult.update({
        where: { id: resultId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      })

      reply.send({
        success: true,
        data: {
          liked: true,
          likeCount: updatedResult.likes,
        },
      })

    } catch (error) {
      fastify.log.error('Like result error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to like result',
        },
      })
    }
  })

  // POST /api/feed/:resultId/share
  fastify.post('/:resultId/share', {
    preHandler: [fastify.authenticate]
  }, async (request: ResultRequest, reply: FastifyReply) => {
    try {
      const { resultId } = request.params

      // Verify ownership
      const result = await fastify.prisma.tryOnResult.findFirst({
        where: {
          id: resultId,
          userId: request.user.userId,
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

      // Increment share count
      await fastify.prisma.tryOnResult.update({
        where: { id: resultId },
        data: { shares: { increment: 1 } },
      })

      // Generate share URL
      const shareUrl = `https://v-try.app/shared/${resultId}`

      reply.send({
        success: true,
        data: { shareUrl },
      })

    } catch (error) {
      fastify.log.error('Share result error:', error)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to share result',
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
        _count: { id: true },
        _sum: {
          views: true,
          likes: true,
          shares: true,
          clicks: true,
        },
      })

      // Get breakdown by type
      const typeBreakdown = await fastify.prisma.tryOnResult.groupBy({
        by: ['generationType'],
        where: { userId: request.user.userId },
        _count: { id: true },
      })

      // Get breakdown by style
      const styleBreakdown = await fastify.prisma.tryOnResult.groupBy({
        by: ['aiStyle'],
        where: { userId: request.user.userId },
        _count: { id: true },
      })

      // Get top websites
      const topWebsites = await fastify.prisma.tryOnResult.groupBy({
        by: ['websiteDomain'],
        where: { userId: request.user.userId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      })

      reply.send({
        success: true,
        data: {
          total: stats._count.id || 0,
          totalViews: stats._sum.views || 0,
          totalLikes: stats._sum.likes || 0,
          totalShares: stats._sum.shares || 0,
          totalClicks: stats._sum.clicks || 0,
          breakdown: {
            byType: typeBreakdown.reduce((acc, item) => {
              acc[item.generationType.toLowerCase()] = item._count.id
              return acc
            }, {} as Record<string, number>),
            byStyle: styleBreakdown.reduce((acc, item) => {
              acc[item.aiStyle.toLowerCase()] = item._count.id
              return acc
            }, {} as Record<string, number>),
          },
          topWebsites: topWebsites.map(item => ({
            domain: item.websiteDomain,
            count: item._count.id,
          })),
        },
      })

    } catch (error) {
      fastify.log.error('Get feed stats error:', error)
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

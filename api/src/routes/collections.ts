// Collections Routes - User's Try-On Collections
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().default(false),
})

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
})

const addToCollectionSchema = z.object({
  resultId: z.string().min(1, 'Result ID is required'),
})

const getCollectionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['newest', 'oldest', 'name', 'updated']).default('newest'),
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

interface CreateCollectionRequest extends AuthenticatedRequest {
  body: z.infer<typeof createCollectionSchema>
}

interface UpdateCollectionRequest extends AuthenticatedRequest {
  params: {
    collectionId: string
  }
  body: z.infer<typeof updateCollectionSchema>
}

interface CollectionParamsRequest extends AuthenticatedRequest {
  params: {
    collectionId: string
  }
}

interface AddToCollectionRequest extends AuthenticatedRequest {
  params: {
    collectionId: string
  }
  body: z.infer<typeof addToCollectionSchema>
}

interface RemoveFromCollectionRequest extends AuthenticatedRequest {
  params: {
    collectionId: string
    resultId: string
  }
}

interface GetCollectionsRequest extends AuthenticatedRequest {
  query: z.infer<typeof getCollectionsSchema>
}

const collectionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper functions
  const buildCollectionQuery = (userId: string, filters: any) => {
    const where: any = { userId }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic
    }

    return where
  }

  const buildOrderBy = (sortBy: string) => {
    switch (sortBy) {
      case 'oldest':
        return { createdAt: 'asc' as const }
      case 'name':
        return { name: 'asc' as const }
      case 'updated':
        return { updatedAt: 'desc' as const }
      case 'newest':
      default:
        return { createdAt: 'desc' as const }
    }
  }

  // GET /api/collections
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request: GetCollectionsRequest, reply: FastifyReply) => {
    try {
      // Validate query parameters
      const filters = getCollectionsSchema.parse(request.query)

      // Build query
      const where = buildCollectionQuery(request.user.userId, filters)
      const orderBy = buildOrderBy(filters.sortBy)

      // Get total count
      const total = await fastify.prisma.collection.count({ where })

      // Get paginated collections
      const collections = await fastify.prisma.collection.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: {
          id: true,
          name: true,
          description: true,
          coverImageUrl: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      // Calculate pagination info
      const totalPages = Math.ceil(total / filters.limit)
      const hasNextPage = filters.page < totalPages
      const hasPrevPage = filters.page > 1

      reply.send({
        success: true,
        data: {
          collections: collections.map(collection => ({
            ...collection,
            itemCount: collection._count.items,
            _count: undefined, // Remove the _count field from response
          })),
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

      fastify.log.error('Get collections error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get collections',
        },
      })
    }
  })

  // POST /api/collections
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request: CreateCollectionRequest, reply: FastifyReply) => {
    try {
      // Validate input
      const collectionData = createCollectionSchema.parse(request.body)

      // Check if collection name already exists for this user
      const existingCollection = await fastify.prisma.collection.findFirst({
        where: {
          userId: request.user.userId,
          name: collectionData.name,
        },
      })

      if (existingCollection) {
        return reply.code(409).send({
          success: false,
          error: {
            code: 'COLLECTION_NAME_TAKEN',
            message: 'A collection with this name already exists',
          },
        })
      }

      // Create collection
      const collection = await fastify.prisma.collection.create({
        data: {
          id: nanoid(),
          userId: request.user.userId,
          name: collectionData.name,
          description: collectionData.description,
          isPublic: collectionData.isPublic,
        },
        select: {
          id: true,
          name: true,
          description: true,
          coverImageUrl: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      reply.code(201).send({
        success: true,
        data: collection,
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

      fastify.log.error('Create collection error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create collection',
        },
      })
    }
  })

  // GET /api/collections/:collectionId
  fastify.get('/:collectionId', {
    preHandler: [fastify.authenticate]
  }, async (request: CollectionParamsRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params

      // Get collection with items
      const collection = await fastify.prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: request.user.userId,
        },
        include: {
          items: {
            include: {
              tryOnResult: {
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
                  productBrand: true,
                  websiteDomain: true,
                  websiteTitle: true,
                  aiModel: true,
                  aiStyle: true,
                  processingTime: true,
                  cost: true,
                  quality: true,
                  views: true,
                  likes: true,
                  tags: true,
                  createdAt: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      if (!collection) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      // Format response
      const formattedCollection = {
        ...collection,
        items: collection.items.map(item => ({
          id: item.id,
          addedAt: item.createdAt,
          result: item.tryOnResult,
        })),
        itemCount: collection.items.length,
      }

      reply.send({
        success: true,
        data: formattedCollection,
      })

    } catch (error) {
      fastify.log.error('Get collection error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get collection',
        },
      })
    }
  })

  // PUT /api/collections/:collectionId
  fastify.put('/:collectionId', {
    preHandler: [fastify.authenticate]
  }, async (request: UpdateCollectionRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params
      const updateData = updateCollectionSchema.parse(request.body)

      // Verify collection belongs to user
      const existingCollection = await fastify.prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: request.user.userId,
        },
      })

      if (!existingCollection) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      // Check if new name conflicts (if updating name)
      if (updateData.name && updateData.name !== existingCollection.name) {
        const nameConflict = await fastify.prisma.collection.findFirst({
          where: {
            userId: request.user.userId,
            name: updateData.name,
            NOT: { id: collectionId },
          },
        })

        if (nameConflict) {
          return reply.code(409).send({
            success: false,
            error: {
              code: 'COLLECTION_NAME_TAKEN',
              message: 'A collection with this name already exists',
            },
          })
        }
      }

      // Update collection
      const updatedCollection = await fastify.prisma.collection.update({
        where: { id: collectionId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          description: true,
          coverImageUrl: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      })

      reply.send({
        success: true,
        data: {
          ...updatedCollection,
          itemCount: updatedCollection._count.items,
          _count: undefined,
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

      fastify.log.error('Update collection error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update collection',
        },
      })
    }
  })

  // DELETE /api/collections/:collectionId
  fastify.delete('/:collectionId', {
    preHandler: [fastify.authenticate]
  }, async (request: CollectionParamsRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params

      // Verify collection belongs to user
      const existingCollection = await fastify.prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: request.user.userId,
        },
      })

      if (!existingCollection) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      // Delete collection (this will cascade to collection items)
      await fastify.prisma.collection.delete({
        where: { id: collectionId },
      })

      reply.send({
        success: true,
        message: 'Collection deleted successfully',
      })

    } catch (error) {
      fastify.log.error('Delete collection error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete collection',
        },
      })
    }
  })

  // POST /api/collections/:collectionId/items
  fastify.post('/:collectionId/items', {
    preHandler: [fastify.authenticate]
  }, async (request: AddToCollectionRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params
      const { resultId } = addToCollectionSchema.parse(request.body)

      // Verify collection belongs to user
      const collection = await fastify.prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: request.user.userId,
        },
      })

      if (!collection) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      // Verify result belongs to user
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

      // Check if item already exists in collection
      const existingItem = await fastify.prisma.collectionItem.findFirst({
        where: {
          collectionId,
          tryOnResultId: resultId,
        },
      })

      if (existingItem) {
        return reply.code(409).send({
          success: false,
          error: {
            code: 'ITEM_ALREADY_IN_COLLECTION',
            message: 'This item is already in the collection',
          },
        })
      }

      // Add item to collection
      const collectionItem = await fastify.prisma.collectionItem.create({
        data: {
          id: nanoid(),
          collectionId,
          tryOnResultId: resultId,
        },
        include: {
          tryOnResult: {
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
              productBrand: true,
              websiteDomain: true,
              websiteTitle: true,
              aiModel: true,
              aiStyle: true,
              processingTime: true,
              cost: true,
              quality: true,
              views: true,
              likes: true,
              tags: true,
              createdAt: true,
            },
          },
        },
      })

      // Update collection's updated timestamp
      await fastify.prisma.collection.update({
        where: { id: collectionId },
        data: { updatedAt: new Date() },
      })

      reply.code(201).send({
        success: true,
        data: {
          id: collectionItem.id,
          addedAt: collectionItem.createdAt,
          result: collectionItem.tryOnResult,
        },
        message: 'Item added to collection successfully',
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

      fastify.log.error('Add to collection error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add item to collection',
        },
      })
    }
  })

  // DELETE /api/collections/:collectionId/items/:resultId
  fastify.delete('/:collectionId/items/:resultId', {
    preHandler: [fastify.authenticate]
  }, async (request: RemoveFromCollectionRequest, reply: FastifyReply) => {
    try {
      const { collectionId, resultId } = request.params

      // Verify collection belongs to user
      const collection = await fastify.prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: request.user.userId,
        },
      })

      if (!collection) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      // Find and remove collection item
      const collectionItem = await fastify.prisma.collectionItem.findFirst({
        where: {
          collectionId,
          tryOnResultId: resultId,
        },
      })

      if (!collectionItem) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'ITEM_NOT_IN_COLLECTION',
            message: 'Item not found in collection',
          },
        })
      }

      // Remove item from collection
      await fastify.prisma.collectionItem.delete({
        where: { id: collectionItem.id },
      })

      // Update collection's updated timestamp
      await fastify.prisma.collection.update({
        where: { id: collectionId },
        data: { updatedAt: new Date() },
      })

      reply.send({
        success: true,
        message: 'Item removed from collection successfully',
      })

    } catch (error) {
      fastify.log.error('Remove from collection error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove item from collection',
        },
      })
    }
  })

  // GET /api/collections/:collectionId/items
  fastify.get('/:collectionId/items', {
    preHandler: [fastify.authenticate]
  }, async (request: CollectionParamsRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params

      // Verify collection belongs to user
      const collection = await fastify.prisma.collection.findFirst({
        where: {
          id: collectionId,
          userId: request.user.userId,
        },
      })

      if (!collection) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      // Get collection items
      const items = await fastify.prisma.collectionItem.findMany({
        where: { collectionId },
        include: {
          tryOnResult: {
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
              productBrand: true,
              websiteDomain: true,
              websiteTitle: true,
              aiModel: true,
              aiStyle: true,
              processingTime: true,
              cost: true,
              quality: true,
              views: true,
              likes: true,
              tags: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      reply.send({
        success: true,
        data: {
          collection: {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            isPublic: collection.isPublic,
          },
          items: items.map(item => ({
            id: item.id,
            addedAt: item.createdAt,
            result: item.tryOnResult,
          })),
          itemCount: items.length,
        },
      })

    } catch (error) {
      fastify.log.error('Get collection items error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get collection items',
        },
      })
    }
  })
}

export default collectionsRoutes
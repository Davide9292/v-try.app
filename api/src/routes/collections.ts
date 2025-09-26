// Collections Routes - User Collections Management
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
  params: { collectionId: string }
  body: z.infer<typeof updateCollectionSchema>
}

interface CollectionRequest extends AuthenticatedRequest {
  params: { collectionId: string }
}

interface AddToCollectionRequest extends AuthenticatedRequest {
  params: { collectionId: string }
  body: z.infer<typeof addToCollectionSchema>
}

interface RemoveFromCollectionRequest extends AuthenticatedRequest {
  params: { collectionId: string; resultId: string }
}

const collectionsRoutes: FastifyPluginAsync = async (fastify) => {
  // Helper functions
  const getCollectionWithItems = async (collectionId: string, userId: string) => {
    return await fastify.prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
      include: {
        items: {
          include: {
            tryOnResult: {
              select: {
                id: true,
                originalImageUrl: true,
                generatedImageUrl: true,
                generatedVideoUrl: true,
                generationType: true,
                productTitle: true,
                productUrl: true,
                websiteDomain: true,
                aiStyle: true,
                status: true,
                views: true,
                likes: true,
                createdAt: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
    })
  }

  const updateCollectionCover = async (collectionId: string) => {
    // Get the most recent item in the collection to use as cover
    const latestItem = await fastify.prisma.collectionItem.findFirst({
      where: { collectionId },
      include: {
        tryOnResult: {
          select: { generatedImageUrl: true },
        },
      },
      orderBy: { addedAt: 'desc' },
    })

    if (latestItem?.tryOnResult?.generatedImageUrl) {
      await fastify.prisma.collection.update({
        where: { id: collectionId },
        data: { coverImageUrl: latestItem.tryOnResult.generatedImageUrl },
      })
    }
  }

  // GET /api/collections
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const collections = await fastify.prisma.collection.findMany({
        where: { userId: request.user.userId },
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      reply.send({
        success: true,
        data: {
          collections: collections.map(collection => ({
            ...collection,
            itemCount: collection._count.items,
            _count: undefined,
          })),
        },
      })

    } catch (error) {
      fastify.log.error('Get collections error:', error)
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
            code: 'COLLECTION_NAME_EXISTS',
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
        include: {
          _count: {
            select: { items: true },
          },
        },
      })

      reply.code(201).send({
        success: true,
        data: {
          ...collection,
          itemCount: collection._count.items,
          _count: undefined,
        },
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid collection data',
            details: error.errors,
          },
        })
      }

      fastify.log.error('Create collection error:', error)
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
  }, async (request: CollectionRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params

      const collection = await getCollectionWithItems(collectionId, request.user.userId)

      if (!collection) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      reply.send({
        success: true,
        data: {
          ...collection,
          itemCount: collection._count.items,
          results: collection.items.map(item => item.tryOnResult),
          items: undefined,
          _count: undefined,
        },
      })

    } catch (error) {
      fastify.log.error('Get collection error:', error)
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

      // Check if collection exists and belongs to user
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

      // Check if new name conflicts with existing collection
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
              code: 'COLLECTION_NAME_EXISTS',
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
        include: {
          _count: {
            select: { items: true },
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
            message: 'Invalid update data',
            details: error.errors,
          },
        })
      }

      fastify.log.error('Update collection error:', error)
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
  }, async (request: CollectionRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params

      // Verify ownership and delete
      const deletedCollection = await fastify.prisma.collection.deleteMany({
        where: {
          id: collectionId,
          userId: request.user.userId,
        },
      })

      if (deletedCollection.count === 0) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'COLLECTION_NOT_FOUND',
            message: 'Collection not found',
          },
        })
      }

      reply.send({
        success: true,
        message: 'Collection deleted successfully',
      })

    } catch (error) {
      fastify.log.error('Delete collection error:', error)
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

      // Verify collection ownership
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

      // Verify result ownership
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

      // Check if item is already in collection
      const existingItem = await fastify.prisma.collectionItem.findUnique({
        where: {
          collectionId_tryOnResultId: {
            collectionId,
            tryOnResultId: resultId,
          },
        },
      })

      if (existingItem) {
        return reply.code(409).send({
          success: false,
          error: {
            code: 'ITEM_ALREADY_IN_COLLECTION',
            message: 'Item is already in this collection',
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
              originalImageUrl: true,
              generatedImageUrl: true,
              generatedVideoUrl: true,
              generationType: true,
              productTitle: true,
              productUrl: true,
              websiteDomain: true,
              aiStyle: true,
              status: true,
              views: true,
              likes: true,
              createdAt: true,
            },
          },
        },
      })

      // Update collection's updated timestamp and cover image
      await Promise.all([
        fastify.prisma.collection.update({
          where: { id: collectionId },
          data: { updatedAt: new Date() },
        }),
        updateCollectionCover(collectionId),
      ])

      reply.code(201).send({
        success: true,
        data: collectionItem,
        message: 'Item added to collection successfully',
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        })
      }

      fastify.log.error('Add to collection error:', error)
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

      // Verify collection ownership
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

      // Remove item from collection
      const deletedItem = await fastify.prisma.collectionItem.deleteMany({
        where: {
          collectionId,
          tryOnResultId: resultId,
        },
      })

      if (deletedItem.count === 0) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'ITEM_NOT_IN_COLLECTION',
            message: 'Item not found in collection',
          },
        })
      }

      // Update collection's updated timestamp and cover image
      await Promise.all([
        fastify.prisma.collection.update({
          where: { id: collectionId },
          data: { updatedAt: new Date() },
        }),
        updateCollectionCover(collectionId),
      ])

      reply.send({
        success: true,
        message: 'Item removed from collection successfully',
      })

    } catch (error) {
      fastify.log.error('Remove from collection error:', error)
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
  }, async (request: CollectionRequest, reply: FastifyReply) => {
    try {
      const { collectionId } = request.params

      // Verify collection ownership
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
              originalImageUrl: true,
              generatedImageUrl: true,
              generatedVideoUrl: true,
              generationType: true,
              productTitle: true,
              productUrl: true,
              websiteDomain: true,
              aiStyle: true,
              status: true,
              views: true,
              likes: true,
              createdAt: true,
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      })

      reply.send({
        success: true,
        data: {
          collection: {
            id: collection.id,
            name: collection.name,
            description: collection.description,
          },
          items: items.map(item => ({
            ...item.tryOnResult,
            addedAt: item.addedAt,
          })),
        },
      })

    } catch (error) {
      fastify.log.error('Get collection items error:', error)
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

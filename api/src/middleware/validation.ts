// Request Validation Middleware - Enterprise Grade
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify'
import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),

  // Sorting
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Date range
  dateRange: z.object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  }).refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return data.dateFrom <= data.dateTo
      }
      return true
    },
    {
      message: 'dateFrom must be before or equal to dateTo',
      path: ['dateRange'],
    }
  ),

  // MongoDB-style ObjectId
  objectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId format'),

  // Nanoid format
  nanoid: z.string().regex(/^[A-Za-z0-9_-]{21}$/, 'Invalid ID format'),

  // URL validation
  url: z.string().url('Invalid URL format'),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/^(?=.*\d)/, 'Password must contain at least one number'),

  // Username validation
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),

  // Base64 image validation
  base64Image: z.string()
    .regex(/^data:image\/(png|jpg|jpeg|webp);base64,/, 'Invalid image format')
    .refine(
      (data) => {
        try {
          const base64Data = data.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          return buffer.length <= 10 * 1024 * 1024 // 10MB max
        } catch {
          return false
        }
      },
      'Image too large (max 10MB)'
    ),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1),
    mimetype: z.string().regex(/^image\/(png|jpg|jpeg|webp)$/, 'Invalid file type'),
    size: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)'),
  }),

  // AI generation types
  generationType: z.enum(['image', 'video']),
  aiStyle: z.enum(['realistic', 'artistic', 'fashion', 'lifestyle']),
  subscriptionTier: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
}

// Validation middleware factory
export const validateRequest = (schema: {
  query?: z.ZodSchema
  body?: z.ZodSchema
  params?: z.ZodSchema
  headers?: z.ZodSchema
}) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    try {
      // Validate query parameters
      if (schema.query) {
        const validatedQuery = schema.query.parse(request.query)
        request.query = validatedQuery
      }

      // Validate request body
      if (schema.body) {
        const validatedBody = schema.body.parse(request.body)
        request.body = validatedBody
      }

      // Validate URL parameters
      if (schema.params) {
        const validatedParams = schema.params.parse(request.params)
        request.params = validatedParams
      }

      // Validate headers
      if (schema.headers) {
        const validatedHeaders = schema.headers.parse(request.headers)
        // Don't replace headers, just validate
      }

      done()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
              received: err.received,
            })),
          },
        })
      }

      // Re-throw other errors
      throw error
    }
  }
}

// Specific validation schemas for common use cases
export const validationSchemas = {
  // Authentication
  login: {
    body: z.object({
      email: commonSchemas.email,
      password: z.string().min(1, 'Password is required'),
    }),
  },

  signup: {
    body: z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      username: commonSchemas.username,
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
    }),
  },

  refreshToken: {
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
  },

  // User management
  updateProfile: {
    body: z.object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      username: commonSchemas.username.optional(),
      preferences: z.object({
        defaultGenerationType: commonSchemas.generationType.optional(),
        defaultStyle: commonSchemas.aiStyle.optional(),
        autoSaveToFeed: z.boolean().optional(),
        publicProfile: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        qualityPreference: z.enum(['fast', 'balanced', 'high']).optional(),
      }).optional(),
    }),
  },

  uploadImages: {
    body: z.object({
      faceImage: commonSchemas.base64Image,
      bodyImage: commonSchemas.base64Image,
    }),
  },

  // AI generation
  generateAI: {
    body: z.object({
      type: commonSchemas.generationType,
      targetImage: z.string().min(1, 'Target image is required'),
      style: commonSchemas.aiStyle.default('realistic'),
      productUrl: commonSchemas.url,
      websiteInfo: z.object({
        domain: z.string().min(1),
        title: z.string().min(1),
        description: z.string().optional(),
        favicon: z.string().optional(),
      }),
      parameters: z.object({
        width: z.number().min(256).max(2048).optional(),
        height: z.number().min(256).max(2048).optional(),
        duration: z.number().min(1).max(10).optional(),
        motionType: z.enum(['subtle', 'dynamic', 'showcase']).optional(),
      }).optional(),
    }),
  },

  jobId: {
    params: z.object({
      jobId: commonSchemas.nanoid,
    }),
  },

  // Feed management
  getFeed: {
    query: commonSchemas.pagination.extend({
      sortBy: z.enum(['newest', 'oldest', 'most_liked', 'most_viewed']).default('newest'),
      generationType: z.enum(['image', 'video', 'all']).default('all'),
      style: z.array(commonSchemas.aiStyle).optional(),
      websites: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      collections: z.array(commonSchemas.nanoid).optional(),
    }).merge(commonSchemas.dateRange),
  },

  searchFeed: {
    query: commonSchemas.pagination.extend({
      query: z.string().min(1, 'Search query is required'),
    }),
  },

  updateResult: {
    params: z.object({
      resultId: commonSchemas.nanoid,
    }),
    body: z.object({
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
    }),
  },

  resultId: {
    params: z.object({
      resultId: commonSchemas.nanoid,
    }),
  },

  // Collections
  createCollection: {
    body: z.object({
      name: z.string().min(1, 'Collection name is required').max(100, 'Name too long'),
      description: z.string().max(500, 'Description too long').optional(),
      isPublic: z.boolean().default(false),
    }),
  },

  updateCollection: {
    params: z.object({
      collectionId: commonSchemas.nanoid,
    }),
    body: z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      isPublic: z.boolean().optional(),
    }),
  },

  collectionId: {
    params: z.object({
      collectionId: commonSchemas.nanoid,
    }),
  },

  addToCollection: {
    params: z.object({
      collectionId: commonSchemas.nanoid,
    }),
    body: z.object({
      resultId: commonSchemas.nanoid,
    }),
  },

  removeFromCollection: {
    params: z.object({
      collectionId: commonSchemas.nanoid,
      resultId: commonSchemas.nanoid,
    }),
  },
}

// Content type validation
export const validateContentType = (allowedTypes: string[]) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    const contentType = request.headers['content-type']
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return reply.code(415).send({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
        },
      })
    }

    done()
  }
}

// Rate limiting validation
export const validateRateLimit = (limits: {
  windowMs: number
  max: number
  message?: string
}) => {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    const key = request.ip + (request.user ? `:${(request as any).user.userId}` : '')
    const now = Date.now()
    const resetTime = now + limits.windowMs

    const current = requests.get(key)

    if (!current || current.resetTime < now) {
      requests.set(key, { count: 1, resetTime })
      done()
      return
    }

    if (current.count >= limits.max) {
      return reply.code(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: limits.message || 'Too many requests',
        },
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      })
    }

    current.count++
    done()
  }
}

// File size validation
export const validateFileSize = (maxSize: number) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    const contentLength = request.headers['content-length']
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return reply.code(413).send({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum allowed size of ${maxSize} bytes`,
        },
      })
    }

    done()
  }
}

// Custom validation helpers
export const createCustomValidator = (
  validationFn: (value: any) => boolean | Promise<boolean>,
  errorMessage: string,
  errorCode: string = 'CUSTOM_VALIDATION_ERROR'
) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    try {
      const isValid = await validationFn(request)
      
      if (!isValid) {
        return reply.code(400).send({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
          },
        })
      }

      done()
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation check failed',
        },
      })
    }
  }
}

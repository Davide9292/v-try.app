// Authentication Middleware - Enterprise Grade
import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  'GET:/health',
  'POST:/api/auth/login',
  'POST:/api/auth/signup', 
  'POST:/api/auth/refresh',
  'GET:/api/auth/verify-email',
  'POST:/api/auth/forgot-password',
  'POST:/api/auth/reset-password',
]

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/user',
  '/api/ai',
  '/api/feed',
  '/api/collections',
]

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string
      sessionId: string
      email: string
      username: string
      subscription: string
    }
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export const authenticateToken = async (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  const route = `${request.method}:${request.url.split('?')[0]}`
  
  // Skip authentication for public routes
  if (PUBLIC_ROUTES.includes(route)) {
    return done()
  }

  // Skip authentication for routes that don't require it
  const requiresAuth = PROTECTED_ROUTES.some(protectedRoute => 
    request.url.startsWith(protectedRoute)
  )

  if (!requiresAuth) {
    return done()
  }

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required',
        },
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = await request.server.jwt.verify(token) as any

    if (decoded.type !== 'access') {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
        },
      })
    }

    // Check if session exists and is valid
    const session = await request.server.prisma.session.findUnique({
      where: { 
        id: decoded.sessionId,
        token: token,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            subscription: true,
            emailVerified: true,
          },
        },
      },
    })

    if (!session) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Session not found or expired',
        },
      })
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await request.server.prisma.session.delete({
        where: { id: session.id },
      })

      return reply.code(401).send({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired',
        },
      })
    }

    // Check if user's email is verified
    if (!session.user.emailVerified) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification is required',
        },
      })
    }

    // Update session last used time
    await request.server.prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    })

    // Add user info to request
    request.user = {
      userId: session.user.id,
      sessionId: session.id,
      email: session.user.email,
      username: session.user.username,
      subscription: session.user.subscription,
    }

    done()

  } catch (error) {
    request.log.error('Authentication error:', error)

    if (error.name === 'JsonWebTokenError') {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      })
    }

    if (error.name === 'TokenExpiredError') {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      })
    }

    return reply.code(500).send({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication failed',
      },
    })
  }
}

// Fastify plugin to add authenticate decorator
export const authPlugin = async (fastify: any) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    return new Promise<void>((resolve, reject) => {
      authenticateToken(request, reply, (err?: Error) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })
}

// Rate limiting based on user subscription
export const getUserRateLimit = (subscription: string): { max: number; timeWindow: string } => {
  switch (subscription) {
    case 'ENTERPRISE':
      return { max: 10000, timeWindow: '1 hour' }
    case 'PRO':
      return { max: 1000, timeWindow: '1 hour' }
    case 'FREE':
    default:
      return { max: 100, timeWindow: '1 hour' }
  }
}

// Check if user has exceeded their daily limits
export const checkDailyLimits = async (
  prisma: any,
  userId: string,
  subscription: string,
  type: 'image' | 'video'
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get today's usage
  const usage = await prisma.apiUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  })

  const currentUsage = usage ? 
    (type === 'image' ? usage.imagesGenerated : usage.videosGenerated) : 0

  // Define limits based on subscription
  const limits = {
    FREE: { image: 10, video: 2 },
    PRO: { image: 100, video: 20 },
    ENTERPRISE: { image: 1000, video: 200 },
  }

  const limit = limits[subscription as keyof typeof limits]?.[type] || limits.FREE[type]
  const remaining = Math.max(0, limit - currentUsage)
  const allowed = currentUsage < limit

  return {
    allowed,
    remaining,
    resetAt: tomorrow,
  }
}

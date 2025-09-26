// Authentication Routes - Enterprise Grade
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import rateLimit from '@fastify/rate-limit'

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase and number'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

// Types
interface AuthRequest extends FastifyRequest {
  body: {
    email: string
    password: string
    username?: string
    firstName?: string
    lastName?: string
  }
}

interface RefreshRequest extends FastifyRequest {
  body: {
    refreshToken: string
  }
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Rate limiting for auth endpoints
  await fastify.register(rateLimit, {
    max: 5,
    timeWindow: '15 minutes',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again later.',
      },
    }),
  })

  // Helper functions
  const generateTokens = async (userId: string, sessionId: string) => {
    const accessToken = await fastify.jwt.sign(
      { 
        userId, 
        sessionId,
        type: 'access' 
      },
      { expiresIn: '30d' } // 30 days for long-term sessions
    )

    const refreshToken = await fastify.jwt.sign(
      { 
        userId, 
        sessionId,
        type: 'refresh' 
      },
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
  }

  const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 12)
  }

  const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash)
  }

  // POST /api/auth/login
  fastify.post('/login', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      // Validate input
      const { email, password } = loginSchema.parse(request.body)

      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          passwordHash: true,
          emailVerified: true,
          faceImageUrl: true,
          bodyImageUrl: true,
          subscription: true,
          preferences: true,
        },
      })

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        })
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash)
      if (!isValidPassword) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        })
      }

      // Email verification disabled for light authentication
      // if (!user.emailVerified) {
      //   return reply.code(403).send({
      //     success: false,
      //     error: {
      //       code: 'EMAIL_NOT_VERIFIED',
      //       message: 'Please verify your email address before logging in',
      //     },
      //   })
      // }

      // Create session
      const sessionId = nanoid()
      const { accessToken, refreshToken } = await generateTokens(user.id, sessionId)
      
      await fastify.prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })

      // Update last login
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      // Remove sensitive data
      const { passwordHash, ...userWithoutPassword } = user

      reply.send({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            tokenType: 'Bearer',
          },
          isNewUser: false,
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
      console.error('🔥 Login error details:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        name: error?.name || 'Unknown error type',
        error: error
      })
      
      fastify.log.error('Login error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'An unexpected error occurred',
        },
      })
    }
  })

  // POST /api/auth/signup
  fastify.post('/signup', async (request: AuthRequest, reply: FastifyReply) => {
    try {
      // Validate input
      const { email, password, username, firstName, lastName } = signupSchema.parse(request.body)

      // Check if user already exists
      const existingUser = await fastify.prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username },
          ],
        },
      })

      if (existingUser) {
        const field = existingUser.email === email.toLowerCase() ? 'email' : 'username'
        return reply.code(409).send({
          success: false,
          error: {
            code: field === 'email' ? 'EMAIL_TAKEN' : 'USERNAME_TAKEN',
            message: `This ${field} is already registered`,
          },
        })
      }

      // Hash password
      const passwordHash = await hashPassword(password)

      // Create user
      const user = await fastify.prisma.user.create({
        data: {
          id: nanoid(),
          email: email.toLowerCase(),
          username,
          firstName,
          lastName,
          passwordHash,
          emailVerified: true, // Auto-verify for light authentication
          subscription: 'FREE',
          preferences: {
            defaultGenerationType: 'image',
            defaultStyle: 'realistic',
            autoSaveToFeed: true,
            publicProfile: false,
            emailNotifications: true,
            qualityPreference: 'balanced',
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          emailVerified: true,
          faceImageUrl: true,
          bodyImageUrl: true,
          subscription: true,
          preferences: true,
        },
      })

      // Create session
      const sessionId = nanoid()
      const { accessToken, refreshToken } = await generateTokens(user.id, sessionId)
      
      await fastify.prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })

      // Initialize API usage tracking
      await fastify.prisma.apiUsage.create({
        data: {
          userId: user.id,
          date: new Date(),
          imagesGenerated: 0,
          videosGenerated: 0,
          totalCost: 0,
          apiCalls: 0,
        },
      })

      reply.code(201).send({
        success: true,
        data: {
          user,
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            tokenType: 'Bearer',
          },
          isNewUser: true,
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

      fastify.log.error('Signup error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      })
    }
  })

  // POST /api/auth/refresh
  fastify.post('/refresh', async (request: RefreshRequest, reply: FastifyReply) => {
    try {
      // Validate input
      const { refreshToken } = refreshSchema.parse(request.body)

      // Verify refresh token
      const decoded = await fastify.jwt.verify(refreshToken) as any
      
      if (decoded.type !== 'refresh') {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid refresh token',
          },
        })
      }

      // Find session
      const session = await fastify.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      })

      if (!session) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Refresh token not found',
          },
        })
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
        session.userId, 
        session.id
      )

      // Update session
      await fastify.prisma.session.update({
        where: { id: session.id },
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          lastUsedAt: new Date(),
        },
      })

      reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          tokenType: 'Bearer',
        },
      })

    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired refresh token',
          },
        })
      }

      fastify.log.error('Token refresh error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      })
    }
  })

  // POST /api/auth/logout
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request: any, reply: FastifyReply) => {
    try {
      // Delete session
      await fastify.prisma.session.delete({
        where: { id: request.user.sessionId },
      })

      reply.send({
        success: true,
        message: 'Logged out successfully',
      })

    } catch (error) {
      fastify.log.error('Logout error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      })
    }
  })

  // POST /api/auth/logout-all
  fastify.post('/logout-all', {
    preHandler: [fastify.authenticate]
  }, async (request: any, reply: FastifyReply) => {
    try {
      // Delete all user sessions
      await fastify.prisma.session.deleteMany({
        where: { userId: request.user.userId },
      })

      reply.send({
        success: true,
        message: 'Logged out from all devices successfully',
      })

    } catch (error) {
      fastify.log.error('Logout all error:', error as any)
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      })
    }
  })
}

export default authRoutes

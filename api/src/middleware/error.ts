// Error Handling Middleware - Enterprise Grade
import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify'

// Custom error types
export class AppError extends Error {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

// Error response interface
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    path: string
    requestId?: string
  }
}

// Main error handler
export const errorHandler = async (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const startTime = Date.now()
  
  // Generate request ID for tracking
  const requestId = request.headers['x-request-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Log error details
  const logContext = {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    userId: (request as any).user?.userId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    },
  }

  // Determine error type and response
  let statusCode = 500
  let errorCode = 'INTERNAL_SERVER_ERROR'
  let errorMessage = 'An unexpected error occurred'
  let errorDetails: any = undefined

  if (error instanceof AppError) {
    // Our custom application errors
    statusCode = error.statusCode
    errorCode = error.code
    errorMessage = error.message
    
    // Log at appropriate level
    if (error.statusCode >= 500) {
      request.log.error(logContext, 'Application error')
    } else if (error.statusCode >= 400) {
      request.log.warn(logContext, 'Client error')
    }
  } else if (error.name === 'ValidationError' || error.code === 'FST_ERR_VALIDATION') {
    // Fastify validation errors
    statusCode = 400
    errorCode = 'VALIDATION_ERROR'
    errorMessage = 'Invalid request data'
    errorDetails = error.validation || error.validationContext
    
    request.log.warn(logContext, 'Validation error')
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401
    errorCode = 'INVALID_TOKEN'
    errorMessage = 'Invalid authentication token'
    
    request.log.warn(logContext, 'JWT error')
  } else if (error.name === 'TokenExpiredError') {
    // JWT expiration
    statusCode = 401
    errorCode = 'TOKEN_EXPIRED'
    errorMessage = 'Authentication token has expired'
    
    request.log.warn(logContext, 'JWT expired')
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    // Network/connection errors
    statusCode = 503
    errorCode = 'SERVICE_UNAVAILABLE'
    errorMessage = 'External service temporarily unavailable'
    
    request.log.error(logContext, 'Network error')
  } else if (error.code?.startsWith('P')) {
    // Prisma database errors
    statusCode = handlePrismaError(error)
    errorCode = getPrismaErrorCode(error)
    errorMessage = getPrismaErrorMessage(error)
    
    request.log.error(logContext, 'Database error')
  } else if (error.statusCode) {
    // HTTP errors with status codes
    statusCode = error.statusCode
    errorCode = getHttpErrorCode(statusCode)
    errorMessage = error.message || getHttpErrorMessage(statusCode)
    
    if (statusCode >= 500) {
      request.log.error(logContext, 'HTTP server error')
    } else {
      request.log.warn(logContext, 'HTTP client error')
    }
  } else {
    // Unknown errors
    request.log.error(logContext, 'Unknown error')
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: requestId as string,
    },
  }

  // Add details in development mode or for validation errors
  if (process.env.NODE_ENV === 'development' || errorDetails) {
    errorResponse.error.details = errorDetails || {
      stack: error.stack,
      originalError: error.name,
    }
  }

  // Set security headers
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('X-XSS-Protection', '1; mode=block')

  // Send error response
  reply.code(statusCode).send(errorResponse)

  // Log response time
  const responseTime = Date.now() - startTime
  request.log.info({
    requestId,
    method: request.method,
    url: request.url,
    statusCode,
    responseTime,
  }, 'Error response sent')
}

// Prisma error handling
const handlePrismaError = (error: any): number => {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      return 409
    case 'P2025': // Record not found
      return 404
    case 'P2003': // Foreign key constraint violation
      return 400
    case 'P2004': // Constraint violation
      return 400
    case 'P2005': // Invalid value for field type
      return 400
    case 'P2006': // Invalid value provided
      return 400
    case 'P2007': // Data validation error
      return 400
    case 'P2008': // Query parsing error
      return 400
    case 'P2009': // Query validation error
      return 400
    case 'P2010': // Raw query failed
      return 400
    case 'P2011': // Null constraint violation
      return 400
    case 'P2012': // Missing required value
      return 400
    case 'P2013': // Missing required argument
      return 400
    case 'P2014': // Relation violation
      return 400
    case 'P2015': // Related record not found
      return 404
    case 'P2016': // Query interpretation error
      return 400
    case 'P2017': // Records not connected
      return 400
    case 'P2018': // Required connected records not found
      return 404
    case 'P2019': // Input error
      return 400
    case 'P2020': // Value out of range
      return 400
    case 'P2021': // Table does not exist
      return 500
    case 'P2022': // Column does not exist
      return 500
    case 'P2023': // Inconsistent column data
      return 500
    case 'P2024': // Connection timeout
      return 503
    case 'P2027': // Multiple errors
      return 400
    default:
      return 500
  }
}

const getPrismaErrorCode = (error: any): string => {
  switch (error.code) {
    case 'P2002':
      return 'DUPLICATE_ENTRY'
    case 'P2025':
      return 'RECORD_NOT_FOUND'
    case 'P2003':
    case 'P2004':
      return 'CONSTRAINT_VIOLATION'
    case 'P2024':
      return 'DATABASE_TIMEOUT'
    default:
      return 'DATABASE_ERROR'
  }
}

const getPrismaErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'P2002':
      return 'A record with this data already exists'
    case 'P2025':
      return 'The requested record was not found'
    case 'P2003':
      return 'Invalid reference to related record'
    case 'P2004':
      return 'Database constraint violation'
    case 'P2024':
      return 'Database connection timeout'
    default:
      return 'Database operation failed'
  }
}

// HTTP error codes
const getHttpErrorCode = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 405:
      return 'METHOD_NOT_ALLOWED'
    case 409:
      return 'CONFLICT'
    case 422:
      return 'UNPROCESSABLE_ENTITY'
    case 429:
      return 'RATE_LIMIT_EXCEEDED'
    case 500:
      return 'INTERNAL_SERVER_ERROR'
    case 502:
      return 'BAD_GATEWAY'
    case 503:
      return 'SERVICE_UNAVAILABLE'
    case 504:
      return 'GATEWAY_TIMEOUT'
    default:
      return 'HTTP_ERROR'
  }
}

const getHttpErrorMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'Bad request'
    case 401:
      return 'Authentication required'
    case 403:
      return 'Access forbidden'
    case 404:
      return 'Resource not found'
    case 405:
      return 'Method not allowed'
    case 409:
      return 'Resource conflict'
    case 422:
      return 'Unprocessable entity'
    case 429:
      return 'Too many requests'
    case 500:
      return 'Internal server error'
    case 502:
      return 'Bad gateway'
    case 503:
      return 'Service unavailable'
    case 504:
      return 'Gateway timeout'
    default:
      return 'HTTP error occurred'
  }
}

// Not found handler for undefined routes
export const notFoundHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
      timestamp: new Date().toISOString(),
      path: request.url,
    },
  }

  reply.code(404).send(errorResponse)
}

// V-Try.app Shared Types - Enterprise Grade
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  faceImageUrl?: string
  bodyImageUrl?: string
  emailVerified: boolean
  subscription: SubscriptionPlan
  preferences: UserPreferences
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface UserPreferences {
  defaultGenerationType: 'image' | 'video'
  defaultStyle: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
  autoSaveToFeed: boolean
  publicProfile: boolean
  emailNotifications: boolean
  qualityPreference: 'fast' | 'balanced' | 'high'
}

export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
  tokenType: 'Bearer'
}

export interface TryOnResult {
  id: string
  userId: string
  jobId?: string
  generationType: GenerationType
  status: GenerationStatus
  
  // Images & Videos
  originalImageUrl: string
  targetImageUrl: string
  generatedImageUrl?: string
  generatedVideoUrl?: string
  thumbnailUrl?: string
  
  // Product Information
  productUrl: string
  productTitle?: string
  productDescription?: string
  productPrice?: string
  productBrand?: string
  
  // Website Information
  websiteDomain: string
  websiteTitle: string
  websiteDescription?: string
  
  // AI Generation Details
  aiModel: string
  aiPrompt: string
  aiStyle: AIStyle
  aiParameters: Record<string, any>
  
  // Processing Information
  processingTime?: number
  cost: number
  quality?: number
  
  // User Images Used
  faceImageUsed: string
  bodyImageUsed: string
  
  // Metadata
  deviceInfo: Record<string, any>
  location?: Record<string, any>
  error?: string
  
  // Social Features
  isPublic: boolean
  views: number
  likes: number
  shares: number
  tags: string[]
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export type GenerationType = 'IMAGE' | 'VIDEO'
export type GenerationStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type AIStyle = 'REALISTIC' | 'ARTISTIC' | 'FASHION' | 'LIFESTYLE'

export interface Collection {
  id: string
  userId: string
  name: string
  description?: string
  coverImageUrl?: string
  isPublic: boolean
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface CollectionItem {
  id: string
  collectionId: string
  tryOnResultId: string
  createdAt: string
}

export interface Like {
  id: string
  userId: string
  tryOnResultId: string
  createdAt: string
}

export interface ApiUsage {
  id: string
  userId: string
  date: string
  imagesGenerated: number
  videosGenerated: number
  totalCost: number
  apiCalls: number
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: string
  createdAt: string
  lastUsedAt: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: any[]
}

export interface PaginatedResponse<T> {
  results: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

// Generation Request Types
export interface ImageGenerationRequest {
  type: 'image'
  targetImage: string
  prompt?: string
  style: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
  productUrl?: string
  websiteInfo?: WebsiteInfo
  parameters?: ImageGenerationParameters
}

export interface VideoGenerationRequest {
  type: 'video'
  targetImage: string
  prompt?: string
  style: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
  productUrl?: string
  websiteInfo?: WebsiteInfo
  parameters?: VideoGenerationParameters
}

export interface ImageGenerationParameters {
  width?: number
  height?: number
}

export interface VideoGenerationParameters {
  width?: number
  height?: number
  duration?: number
  motionType?: 'subtle' | 'dynamic' | 'showcase'
}

export interface WebsiteInfo {
  domain: string
  title: string
  description?: string
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: Date
}

export interface GenerationProgressMessage extends WebSocketMessage {
  type: 'generation_progress'
  data: {
    jobId: string
    status: GenerationStatus
    progress?: number
    resultUrl?: string
    error?: string
  }
}

export interface FeedUpdateMessage extends WebSocketMessage {
  type: 'feed_updated'
  data: TryOnResult
}

export interface UserNotificationMessage extends WebSocketMessage {
  type: 'user_notification'
  data: {
    title: string
    message: string
    type: 'info' | 'success' | 'error'
  }
}

// Extension Types
export interface ExtensionMessage {
  type: string
  data?: any
  tabId?: number
}

export interface ImageDetectionMessage extends ExtensionMessage {
  type: 'IMAGE_DETECTED'
  data: {
    imageUrl: string
    productUrl: string
    websiteInfo: WebsiteInfo
  }
}

export interface GenerationStartMessage extends ExtensionMessage {
  type: 'GENERATION_STARTED'
  data: {
    jobId: string
    generationType: 'image' | 'video'
  }
}

export interface GenerationProgressMessage extends ExtensionMessage {
  type: 'GENERATION_PROGRESS'
  data: {
    jobId: string
    progress: number
    status: GenerationStatus
  }
}

export interface GenerationCompleteMessage extends ExtensionMessage {
  type: 'GENERATION_COMPLETE'
  data: {
    jobId: string
    resultUrl: string
    thumbnailUrl?: string
  }
}

export interface GenerationFailedMessage extends ExtensionMessage {
  type: 'GENERATION_FAILED'
  data: {
    jobId: string
    error: string
  }
}

// KIE AI Service Types
export interface KIEAIConfig {
  apiKey: string
  baseUrl: string
  timeout: number
  retries: number
}

export interface KIEAIGenerationRequest {
  type: 'image' | 'video'
  userFaceImage: string
  userBodyImage: string
  targetImage: string
  prompt?: string
  style: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
  parameters?: ImageGenerationParameters | VideoGenerationParameters
}

export interface KIEAIGenerationResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  thumbnailUrl?: string
  error?: string
  processingTime?: number
  cost?: number
  quality?: number
}

// Feed Types
export interface FeedFilters {
  type?: GenerationType
  style?: AIStyle
  sortBy: 'newest' | 'oldest' | 'most_liked' | 'most_viewed'
  dateRange?: {
    from: string
    to: string
  }
  tags?: string[]
}

export interface FeedSearchQuery {
  q: string
  page?: number
  limit?: number
  filters?: FeedFilters
}

// Statistics Types
export interface UserStats {
  totalGenerations: number
  imagesGenerated: number
  videosGenerated: number
  totalCost: number
  averageQuality: number
  favoriteStyle: AIStyle
  dailyUsage: {
    date: string
    images: number
    videos: number
    cost: number
  }[]
  monthlyUsage: {
    month: string
    images: number
    videos: number
    cost: number
  }[]
}

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

// Validation Types
export interface ValidationError {
  field: string
  message: string
  code: string
}

// File Upload Types
export interface FileUpload {
  name: string
  type: string
  size: number
  data: string // base64
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimeType: string
}

// Error Types
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// Success Types
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

// Union Types
export type GenerationRequest = ImageGenerationRequest | VideoGenerationRequest
export type GenerationParameters = ImageGenerationParameters | VideoGenerationParameters
export type ApiResponseType<T> = SuccessResponse<T> | ErrorResponse

// Utility Types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Partial<T> = {
  [P in keyof T]?: T[P]
}

export type CreateUserRequest = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'emailVerified' | 'lastLoginAt'>
export type UpdateUserRequest = Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt'>>

export type CreateCollectionRequest = Omit<Collection, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'itemCount'>
export type UpdateCollectionRequest = Partial<Omit<Collection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>

// Environment Types
export interface Config {
  port: number
  host: string
  nodeEnv: string
  databaseUrl: string
  redisUrl: string
  jwtSecret: string
  kieApiKey: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
  awsS3Bucket: string
  awsRegion: string
}
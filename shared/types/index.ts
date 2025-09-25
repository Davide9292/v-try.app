// V-Try.app Shared TypeScript Definitions

export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  faceImageUrl: string // Required for AI generation
  bodyImageUrl: string // Required for AI generation
  isVerified: boolean
  subscription: SubscriptionTier
  createdAt: Date
  updatedAt: Date
  preferences: UserPreferences
}

export interface UserPreferences {
  defaultGenerationType: 'image' | 'video'
  defaultStyle: AIGenerationStyle
  autoSaveToFeed: boolean
  publicProfile: boolean
  emailNotifications: boolean
  qualityPreference: 'fast' | 'balanced' | 'high'
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export type AIGenerationStyle = 'realistic' | 'artistic' | 'fashion' | 'lifestyle'

export interface TryOnResult {
  id: string
  userId: string
  originalImageUrl: string
  generatedImageUrl: string
  generatedVideoUrl?: string
  generationType: 'image' | 'video'
  productInfo: ProductInfo
  websiteInfo: WebsiteInfo
  aiMetadata: AIGenerationMetadata
  userMetadata: UserGenerationMetadata
  createdAt: Date
  updatedAt: Date
  status: GenerationStatus
  isPublic: boolean
  tags: string[]
  collections: string[]
  analytics: TryOnAnalytics
}

export interface ProductInfo {
  url: string
  title?: string
  description?: string
  price?: string
  currency?: string
  brand?: string
  category?: string
  imageUrl: string
  availability?: 'in_stock' | 'out_of_stock' | 'pre_order'
}

export interface WebsiteInfo {
  domain: string
  title: string
  description?: string
  favicon?: string
  ogImage?: string
}

export interface AIGenerationMetadata {
  model: 'nano_banana' | 'veo3'
  prompt: string
  style: AIGenerationStyle
  parameters: {
    strength?: number
    guidance_scale?: number
    steps?: number
    seed?: number
  }
  processingTime: number
  cost: number
  quality: number // 0-1 score
  jobId: string
}

export interface UserGenerationMetadata {
  faceImageUsed: string
  bodyImageUsed: string
  deviceInfo: {
    userAgent: string
    platform: string
    viewport: string
  }
  location?: {
    country: string
    city?: string
  }
}

export type GenerationStatus = 
  | 'queued' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled'

export interface TryOnAnalytics {
  views: number
  likes: number
  shares: number
  clicks: number // clicks to product URL
  saves: number
  reportCount: number
}

export interface KIEAIRequest {
  type: 'image' | 'video'
  userFaceImage: string
  userBodyImage: string
  targetImage: string
  prompt: string
  style: AIGenerationStyle
  parameters?: {
    width?: number
    height?: number
    duration?: number // for video
    motionType?: 'subtle' | 'dynamic' | 'showcase'
  }
}

export interface KIEAIResponse {
  jobId: string
  status: GenerationStatus
  resultUrl?: string
  thumbnailUrl?: string
  processingTime?: number
  cost?: number
  error?: string
  metadata?: {
    model: string
    version: string
    parameters: Record<string, any>
  }
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  tokenType: 'Bearer'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  username: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
  isNewUser: boolean
}

export interface UserFeed {
  results: TryOnResult[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters?: FeedFilters
}

export interface FeedFilters {
  dateRange?: {
    from: Date
    to: Date
  }
  generationType?: 'image' | 'video' | 'all'
  style?: AIGenerationStyle[]
  websites?: string[]
  tags?: string[]
  collections?: string[]
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_viewed'
}

export interface Collection {
  id: string
  userId: string
  name: string
  description?: string
  coverImageUrl?: string
  isPublic: boolean
  tryOnCount: number
  createdAt: Date
  updatedAt: Date
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number
}

export interface WebSocketMessage {
  type: 'generation_update' | 'feed_update' | 'notification'
  data: any
  timestamp: Date
}

// Extension-specific types
export interface ExtensionMessage {
  action: 'auth_check' | 'generate_tryon' | 'get_feed' | 'save_result'
  data?: any
}

export interface ExtensionResponse {
  success: boolean
  data?: any
  error?: string
}

// Chrome Extension Storage
export interface ExtensionStorage {
  authTokens?: AuthTokens
  user?: User
  preferences?: UserPreferences
  cache?: {
    recentResults: TryOnResult[]
    lastSync: Date
  }
}

// V-Try.app Shared Constants - Enterprise Grade
export const API_ENDPOINTS = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.v-try.app' 
    : 'http://localhost:3001',
  
  // Authentication
  AUTH_LOGIN: '/api/auth/login',
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_LOGOUT_ALL: '/api/auth/logout-all',
  
  // User
  USER_PROFILE: '/api/user/profile',
  USER_UPLOAD_IMAGES: '/api/user/upload-images',
  USER_DELETE_ACCOUNT: '/api/user/account',
  
  // AI Generation
  AI_GENERATE: '/api/ai/generate',
  AI_STATUS: '/api/ai/status',
  AI_CANCEL: '/api/ai/cancel',
  
  // Feed
  FEED_LIST: '/api/feed',
  FEED_SAVE: '/api/feed',
  FEED_SEARCH: '/api/feed/search',
  FEED_RESULT: '/api/feed/result',
  FEED_LIKE: '/api/feed/like',
  FEED_SHARE: '/api/feed/share',
  
  // Collections
  COLLECTIONS_LIST: '/api/collections',
  COLLECTIONS_CREATE: '/api/collections',
  COLLECTIONS_UPDATE: '/api/collections',
  COLLECTIONS_DELETE: '/api/collections',
  COLLECTIONS_ADD_ITEM: '/api/collections/:id/add',
  COLLECTIONS_REMOVE_ITEM: '/api/collections/:id/remove',
  
  // WebSocket
  WEBSOCKET: '/ws',
} as const

export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKENS: 'vtry_auth_tokens',
  USER_PROFILE: 'vtry_user_profile',
  
  // Extension Settings
  API_KEY: 'vtry_api_key',
  USER_IMAGE: 'vtry_user_image',
  GENERATION_SETTINGS: 'vtry_generation_settings',
  
  // UI State
  LAST_TAB: 'vtry_last_tab',
  FEED_FILTERS: 'vtry_feed_filters',
  COLLECTIONS_VIEW: 'vtry_collections_view',
  
  // Cache
  FEED_CACHE: 'vtry_feed_cache',
  USER_STATS_CACHE: 'vtry_user_stats_cache',
} as const

export const WEBSOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // AI Generation
  GENERATION_PROGRESS: 'generation_progress',
  GENERATION_COMPLETE: 'generation_complete',
  GENERATION_FAILED: 'generation_failed',
  
  // Feed Updates
  FEED_UPDATED: 'feed_updated',
  FEED_ITEM_LIKED: 'feed_item_liked',
  FEED_ITEM_SHARED: 'feed_item_shared',
  
  // User Notifications
  USER_NOTIFICATION: 'user_notification',
  USAGE_LIMIT_WARNING: 'usage_limit_warning',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  
  // Real-time Updates
  REAL_TIME_STATS: 'real_time_stats',
  QUEUE_STATUS: 'queue_status',
} as const

export const AI_MODELS = {
  NANO_BANANA: {
    id: 'nano-banana',
    name: 'Nano Banana',
    type: 'image',
    description: 'High-quality image generation optimized for fashion try-ons',
    cost: 0.05,
    avgProcessingTime: 15000, // 15 seconds
    maxWidth: 2048,
    maxHeight: 2048,
  },
  VEO3: {
    id: 'veo3',
    name: 'Veo3',
    type: 'video',
    description: 'Advanced video generation for dynamic try-on experiences',
    cost: 0.25,
    avgProcessingTime: 60000, // 60 seconds
    maxWidth: 1024,
    maxHeight: 1024,
    maxDuration: 10,
  },
} as const

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: 0,
    currency: 'USD',
    limits: {
      imagesPerDay: 10,
      videosPerDay: 2,
      collectionsMax: 3,
      storageGB: 1,
    },
    features: [
      'Basic AI try-ons',
      'Personal feed',
      'Limited collections',
      'Standard quality',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 19.99,
    currency: 'USD',
    limits: {
      imagesPerDay: 100,
      videosPerDay: 20,
      collectionsMax: 50,
      storageGB: 10,
    },
    features: [
      'Unlimited AI try-ons',
      'HD quality generation',
      'Advanced collections',
      'Priority processing',
      'Export options',
      'Analytics dashboard',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 99.99,
    currency: 'USD',
    limits: {
      imagesPerDay: 1000,
      videosPerDay: 200,
      collectionsMax: -1, // Unlimited
      storageGB: 100,
    },
    features: [
      'Everything in Pro',
      'API access',
      'Custom branding',
      'Dedicated support',
      'SLA guarantee',
      'Advanced analytics',
      'Team collaboration',
    ],
  },
} as const

export const AI_STYLES = {
  REALISTIC: {
    id: 'realistic',
    name: 'Realistic',
    description: 'Natural, photorealistic results',
    prompt: 'photorealistic, natural lighting, high detail',
  },
  ARTISTIC: {
    id: 'artistic',
    name: 'Artistic',
    description: 'Creative, stylized interpretation',
    prompt: 'artistic style, creative interpretation, enhanced colors',
  },
  FASHION: {
    id: 'fashion',
    name: 'Fashion',
    description: 'Professional fashion photography style',
    prompt: 'fashion photography, studio lighting, professional',
  },
  LIFESTYLE: {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Casual, everyday setting',
    prompt: 'lifestyle photography, natural setting, casual',
  },
} as const

export const GENERATION_STATUS = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

export const ERROR_CODES = {
  // Authentication
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',
  
  // Resources
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESULT_NOT_FOUND: 'RESULT_NOT_FOUND',
  COLLECTION_NOT_FOUND: 'COLLECTION_NOT_FOUND',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  
  // Profile
  PROFILE_IMAGES_MISSING: 'PROFILE_IMAGES_MISSING',
  
  // AI Generation
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  KIE_AI_ERROR: 'KIE_AI_ERROR',
  
  // Generic
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
} as const

export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  MIN_WIDTH: 256,
  MIN_HEIGHT: 256,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
} as const

export const VIDEO_CONSTRAINTS = {
  MAX_DURATION: 10, // seconds
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_WIDTH: 1024,
  MAX_HEIGHT: 1024,
  SUPPORTED_FORMATS: ['video/mp4', 'video/webm'],
  FPS: 24,
} as const

export const CACHE_DURATIONS = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  FEED_DATA: 2 * 60 * 1000, // 2 minutes
  USAGE_STATS: 1 * 60 * 1000, // 1 minute
  COLLECTIONS: 10 * 60 * 1000, // 10 minutes
} as const

export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const

export const EXTENSION_MESSAGES = {
  // Content Script to Popup
  IMAGE_DETECTED: 'IMAGE_DETECTED',
  GENERATION_STARTED: 'GENERATION_STARTED',
  GENERATION_PROGRESS: 'GENERATION_PROGRESS',
  GENERATION_COMPLETE: 'GENERATION_COMPLETE',
  GENERATION_FAILED: 'GENERATION_FAILED',
  
  // Popup to Content Script
  START_GENERATION: 'START_GENERATION',
  CANCEL_GENERATION: 'CANCEL_GENERATION',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  
  // Background Script
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  TOKEN_REFRESH_NEEDED: 'TOKEN_REFRESH_NEEDED',
} as const
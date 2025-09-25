// V-Try.app Shared Constants

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    VERIFY_EMAIL: '/api/auth/verify-email',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    UPLOAD_IMAGES: '/api/user/upload-images',
    DELETE_ACCOUNT: '/api/user/delete',
  },
  AI: {
    GENERATE: '/api/ai/generate',
    STATUS: '/api/ai/status',
    CANCEL: '/api/ai/cancel',
    MODELS: '/api/ai/models',
  },
  FEED: {
    GET_FEED: '/api/feed',
    GET_RESULT: '/api/feed/result',
    DELETE_RESULT: '/api/feed/result',
    LIKE_RESULT: '/api/feed/like',
    SHARE_RESULT: '/api/feed/share',
    REPORT_RESULT: '/api/feed/report',
  },
  COLLECTIONS: {
    LIST: '/api/collections',
    CREATE: '/api/collections',
    UPDATE: '/api/collections',
    DELETE: '/api/collections',
    ADD_ITEM: '/api/collections/add',
    REMOVE_ITEM: '/api/collections/remove',
  },
} as const

export const KIE_AI_CONFIG = {
  BASE_URL: 'https://api.kie.ai/v1',
  MODELS: {
    NANO_BANANA: 'nano-banana-v2',
    VEO3: 'veo3-preview',
  },
  MAX_IMAGE_SIZE: 4 * 1024 * 1024, // 4MB
  MAX_VIDEO_DURATION: 30, // seconds
  SUPPORTED_FORMATS: {
    IMAGE: ['jpg', 'jpeg', 'png', 'webp'],
    VIDEO: ['mp4', 'webm'],
  },
} as const

export const RATE_LIMITS = {
  FREE_TIER: {
    IMAGES_PER_DAY: 10,
    VIDEOS_PER_DAY: 2,
    CONCURRENT_GENERATIONS: 1,
  },
  PRO_TIER: {
    IMAGES_PER_DAY: 100,
    VIDEOS_PER_DAY: 20,
    CONCURRENT_GENERATIONS: 3,
  },
  ENTERPRISE_TIER: {
    IMAGES_PER_DAY: 1000,
    VIDEOS_PER_DAY: 200,
    CONCURRENT_GENERATIONS: 10,
  },
} as const

export const SUBSCRIPTION_PRICES = {
  PRO: {
    MONTHLY: 9.99,
    YEARLY: 99.99,
  },
  ENTERPRISE: {
    MONTHLY: 49.99,
    YEARLY: 499.99,
  },
} as const

export const IMAGE_REQUIREMENTS = {
  FACE_IMAGE: {
    MIN_WIDTH: 256,
    MIN_HEIGHT: 256,
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    REQUIRED_FEATURES: ['face_detected', 'eyes_visible', 'good_lighting'],
  },
  BODY_IMAGE: {
    MIN_WIDTH: 512,
    MIN_HEIGHT: 768,
    MAX_SIZE: 4 * 1024 * 1024, // 4MB
    REQUIRED_FEATURES: ['full_body_visible', 'standing_pose', 'good_lighting'],
  },
} as const

export const GENERATION_STYLES = {
  REALISTIC: {
    name: 'Realistic',
    description: 'Photorealistic results with natural lighting',
    prompt_suffix: 'photorealistic, natural lighting, high quality',
  },
  ARTISTIC: {
    name: 'Artistic',
    description: 'Creative and stylized interpretations',
    prompt_suffix: 'artistic style, creative interpretation, stylized',
  },
  FASHION: {
    name: 'Fashion',
    description: 'Fashion photography style with professional lighting',
    prompt_suffix: 'fashion photography, professional lighting, editorial style',
  },
  LIFESTYLE: {
    name: 'Lifestyle',
    description: 'Casual, everyday lifestyle photography',
    prompt_suffix: 'lifestyle photography, natural setting, casual style',
  },
} as const

export const VIDEO_MOTION_TYPES = {
  SUBTLE: {
    name: 'Subtle',
    description: 'Gentle movements and natural breathing',
    parameters: { motion_intensity: 0.3 },
  },
  DYNAMIC: {
    name: 'Dynamic',
    description: 'More pronounced movements and pose changes',
    parameters: { motion_intensity: 0.7 },
  },
  SHOWCASE: {
    name: 'Showcase',
    description: 'Fashion runway style presentation',
    parameters: { motion_intensity: 0.9 },
  },
} as const

export const WEBSOCKET_EVENTS = {
  GENERATION_STARTED: 'generation:started',
  GENERATION_PROGRESS: 'generation:progress',
  GENERATION_COMPLETED: 'generation:completed',
  GENERATION_FAILED: 'generation:failed',
  FEED_UPDATED: 'feed:updated',
  USER_NOTIFICATION: 'user:notification',
} as const

export const STORAGE_KEYS = {
  EXTENSION: {
    AUTH_TOKENS: 'vtry_auth_tokens',
    USER_DATA: 'vtry_user_data',
    PREFERENCES: 'vtry_preferences',
    CACHE: 'vtry_cache',
  },
  WEBSITE: {
    AUTH_STATE: 'vtry_auth_state',
    THEME: 'vtry_theme',
    FEED_FILTERS: 'vtry_feed_filters',
  },
} as const

export const ERROR_CODES = {
  AUTH: {
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
    EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  },
  USER: {
    NOT_FOUND: 'USER_NOT_FOUND',
    EMAIL_TAKEN: 'USER_EMAIL_TAKEN',
    USERNAME_TAKEN: 'USER_USERNAME_TAKEN',
    INVALID_IMAGE: 'USER_INVALID_IMAGE',
  },
  AI: {
    GENERATION_FAILED: 'AI_GENERATION_FAILED',
    INVALID_INPUT: 'AI_INVALID_INPUT',
    QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
    MODEL_UNAVAILABLE: 'AI_MODEL_UNAVAILABLE',
  },
  RATE_LIMIT: {
    EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    CONCURRENT_LIMIT: 'RATE_LIMIT_CONCURRENT',
  },
  VALIDATION: {
    INVALID_INPUT: 'VALIDATION_INVALID_INPUT',
    MISSING_FIELD: 'VALIDATION_MISSING_FIELD',
    INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  },
} as const

export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Successfully logged in',
    SIGNUP_SUCCESS: 'Account created successfully',
    EMAIL_VERIFIED: 'Email verified successfully',
    PASSWORD_RESET: 'Password reset successfully',
  },
  USER: {
    PROFILE_UPDATED: 'Profile updated successfully',
    IMAGES_UPLOADED: 'Images uploaded successfully',
    ACCOUNT_DELETED: 'Account deleted successfully',
  },
  AI: {
    GENERATION_STARTED: 'AI generation started',
    GENERATION_COMPLETED: 'Generation completed successfully',
  },
  FEED: {
    RESULT_SAVED: 'Result saved to your feed',
    RESULT_DELETED: 'Result deleted from your feed',
    COLLECTION_CREATED: 'Collection created successfully',
  },
} as const

export const FEATURE_FLAGS = {
  VIDEO_GENERATION: true,
  SOCIAL_FEATURES: false,
  ADVANCED_ANALYTICS: false,
  THIRD_PARTY_API: false,
  MOBILE_APP: false,
} as const

// Chrome Extension specific
export const EXTENSION_CONFIG = {
  POPUP_WIDTH: 400,
  POPUP_HEIGHT: 600,
  BADGE_FADE_DELAY: 200,
  GENERATION_TIMEOUT: 60000, // 1 minute
  SYNC_INTERVAL: 30000, // 30 seconds
} as const

// Website specific
export const WEBSITE_CONFIG = {
  ITEMS_PER_PAGE: 20,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_LANGUAGES: ['en', 'it', 'es', 'fr', 'de'],
  DEFAULT_LANGUAGE: 'en',
} as const

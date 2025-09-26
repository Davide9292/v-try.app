// V-Try.app Shared Constants
window.VTRY_CONSTANTS = {
  // API Configuration
  API_BASE_URL: 'https://vtry-app-backend-production.up.railway.app', // Update this with your actual Railway URL
  API_BASE_URL_LOCAL: 'http://localhost:3001',
  WEBSITE_URL: 'https://v-try.app',
  WEBSITE_URL_LOCAL: 'http://localhost:3000',
  
  // Development mode detection
  IS_DEVELOPMENT: false, // Set to false for production testing
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKENS: 'vtry_auth_tokens',
    USER_PROFILE: 'vtry_user_profile',
    PREFERENCES: 'vtry_preferences',
    TEMP_IMAGES: 'vtry_temp_images'
  },
  
  // Generation Types
  GENERATION_TYPES: {
    IMAGE: 'image',
    VIDEO: 'video'
  },
  
  // AI Styles
  AI_STYLES: {
    REALISTIC: 'realistic',
    FASHION: 'fashion',
    ARTISTIC: 'artistic',
    LIFESTYLE: 'lifestyle'
  },
  
  // Subscription Plans
  SUBSCRIPTION_PLANS: {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE'
  },
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      SIGNUP: '/api/auth/signup',
      REFRESH: '/api/auth/refresh',
      LOGOUT: '/api/auth/logout'
    },
    USER: {
      PROFILE: '/api/user/profile',
      UPLOAD_IMAGES: '/api/user/upload-images',
      USAGE: '/api/user/usage'
    },
    AI: {
      GENERATE: '/api/ai/generate',
      STATUS: '/api/ai/status',
      CANCEL: '/api/ai/cancel'
    },
    FEED: {
      GET: '/api/feed',
      SEARCH: '/api/feed/search',
      UPDATE: '/api/feed',
      DELETE: '/api/feed'
    },
    COLLECTIONS: {
      GET: '/api/collections',
      CREATE: '/api/collections',
      UPDATE: '/api/collections',
      DELETE: '/api/collections',
      ADD_ITEM: '/api/collections',
      REMOVE_ITEM: '/api/collections'
    }
  },
  
  // File Constraints
  FILE_CONSTRAINTS: {
    MAX_IMAGE_SIZE: 4 * 1024 * 1024, // 4MB
    ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
    MIN_IMAGE_DIMENSIONS: { width: 256, height: 256 },
    MAX_IMAGE_DIMENSIONS: { width: 2048, height: 2048 }
  },
  
  // Generation Costs (in USD)
  GENERATION_COSTS: {
    IMAGE: 0.05,
    VIDEO: 0.25
  },
  
  // Daily Limits by Plan
  DAILY_LIMITS: {
    FREE: { images: 10, videos: 2 },
    PRO: { images: 100, videos: 20 },
    ENTERPRISE: { images: 1000, videos: 200 }
  },
  
  // WebSocket Events
  WS_EVENTS: {
    GENERATION_UPDATE: 'generation_update',
    FEED_UPDATE: 'feed_update',
    NOTIFICATION: 'notification'
  },
  
  // Generation Status
  GENERATION_STATUS: {
    QUEUED: 'queued',
    PROCESSING: 'processing', 
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  
  // UI Constants
  UI: {
    BADGE_SHOW_DELAY: 200,
    BADGE_HIDE_DELAY: 100,
    MIN_IMAGE_SIZE_FOR_BADGE: { width: 100, height: 100 },
    ANIMATION_DURATION: 200
  },
  
  // Error Codes
  ERROR_CODES: {
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
    DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',
    INVALID_IMAGE: 'INVALID_IMAGE',
    GENERATION_FAILED: 'GENERATION_FAILED',
    NETWORK_ERROR: 'NETWORK_ERROR'
  }
}

// Helper function to get the correct API URL based on environment
window.VTRY_CONSTANTS.getApiUrl = function() {
  return this.IS_DEVELOPMENT ? this.API_BASE_URL_LOCAL : this.API_BASE_URL
}

// Helper function to get the correct website URL
window.VTRY_CONSTANTS.getWebsiteUrl = function() {
  return this.IS_DEVELOPMENT ? this.WEBSITE_URL_LOCAL : this.WEBSITE_URL
}

console.log('🔧 V-Try.app Constants loaded')

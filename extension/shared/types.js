// V-Try.app Shared Types and Interfaces

// Type definitions for TypeScript-like structure validation in JavaScript
window.VTRY_TYPES = {
  
  // Validate User object
  validateUser: function(user) {
    if (!user || typeof user !== 'object') return false
    
    const required = ['id', 'email', 'username', 'subscription']
    return required.every(field => user.hasOwnProperty(field) && user[field] != null)
  },
  
  // Validate Auth Tokens
  validateAuthTokens: function(tokens) {
    if (!tokens || typeof tokens !== 'object') return false
    
    return tokens.hasOwnProperty('accessToken') && 
           tokens.hasOwnProperty('refreshToken') &&
           typeof tokens.accessToken === 'string' &&
           typeof tokens.refreshToken === 'string'
  },
  
  // Validate Generation Request
  validateGenerationRequest: function(request) {
    if (!request || typeof request !== 'object') return false
    
    const required = ['type', 'targetImage', 'style']
    if (!required.every(field => request.hasOwnProperty(field))) return false
    
    // Validate type
    const validTypes = Object.values(window.VTRY_CONSTANTS.GENERATION_TYPES)
    if (!validTypes.includes(request.type)) return false
    
    // Validate style
    const validStyles = Object.values(window.VTRY_CONSTANTS.AI_STYLES)
    if (!validStyles.includes(request.style)) return false
    
    return true
  },
  
  // Validate Try-On Result
  validateTryOnResult: function(result) {
    if (!result || typeof result !== 'object') return false
    
    const required = ['id', 'userId', 'type', 'status', 'createdAt']
    return required.every(field => result.hasOwnProperty(field))
  },
  
  // Validate Collection
  validateCollection: function(collection) {
    if (!collection || typeof collection !== 'object') return false
    
    const required = ['id', 'userId', 'name', 'createdAt']
    return required.every(field => collection.hasOwnProperty(field))
  },
  
  // Validate Image File
  validateImageFile: function(file) {
    if (!file || !(file instanceof File)) return { valid: false, error: 'Invalid file object' }
    
    // Check file type
    const allowedTypes = window.VTRY_CONSTANTS.FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please use PNG, JPEG, or WebP.' }
    }
    
    // Check file size
    const maxSize = window.VTRY_CONSTANTS.FILE_CONSTRAINTS.MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large. Maximum size is 4MB.' }
    }
    
    return { valid: true }
  },
  
  // Validate Base64 Image
  validateBase64Image: function(base64String) {
    if (!base64String || typeof base64String !== 'string') {
      return { valid: false, error: 'Invalid base64 string' }
    }
    
    // Check if it's a valid data URL
    const dataUrlPattern = /^data:image\/(png|jpeg|jpg|webp);base64,/
    if (!dataUrlPattern.test(base64String)) {
      return { valid: false, error: 'Invalid image format' }
    }
    
    // Check size (approximate)
    const base64Data = base64String.split(',')[1]
    const sizeInBytes = (base64Data.length * 3) / 4
    const maxSize = window.VTRY_CONSTANTS.FILE_CONSTRAINTS.MAX_IMAGE_SIZE
    
    if (sizeInBytes > maxSize) {
      return { valid: false, error: 'Image too large' }
    }
    
    return { valid: true }
  },
  
  // Create standardized API response structure
  createApiResponse: function(success, data, error) {
    return {
      success: Boolean(success),
      data: success ? data : undefined,
      error: success ? undefined : error,
      timestamp: new Date().toISOString()
    }
  },
  
  // Create standardized error object
  createError: function(code, message, details) {
    return {
      code: code || 'UNKNOWN_ERROR',
      message: message || 'An unknown error occurred',
      details: details || null,
      timestamp: new Date().toISOString()
    }
  },
  
  // Sanitize user input
  sanitizeInput: function(input) {
    if (typeof input !== 'string') return input
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, 1000) // Limit length
  },
  
  // Format file size for display
  formatFileSize: function(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },
  
  // Format date for display
  formatDate: function(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    // Less than 1 minute
    if (diff < 60000) {
      return 'Just now'
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }
    
    // Older than 7 days
    return date.toLocaleDateString()
  },
  
  // Deep clone object
  deepClone: function(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    
    const cloned = {}
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  },
  
  // Generate unique ID
  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  },
  
  // Check if running in extension context
  isExtensionContext: function() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id
  },
  
  // Check if running in popup context
  isPopupContext: function() {
    return this.isExtensionContext() && window.location.protocol === 'chrome-extension:'
  },
  
  // Check if running in content script context
  isContentScriptContext: function() {
    return this.isExtensionContext() && window.location.protocol !== 'chrome-extension:'
  }
}

console.log('📝 V-Try.app Types loaded')

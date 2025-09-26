// V-Try.app Authentication Service
window.VTryAuthService = class {
  constructor() {
    this.apiUrl = window.VTRY_CONSTANTS.getApiUrl()
    this.currentUser = null
    this.tokens = null
    this.refreshTimeout = null
    
    console.log('🔐 V-Try.app Auth Service initialized')
  }
  
  // Initialize and check existing authentication
  async init() {
    try {
      this.tokens = await this.getStoredTokens()
      
      if (this.tokens) {
        // Verify tokens and get user profile
        const user = await this.getCurrentUser()
        if (user) {
          this.currentUser = user
          this.scheduleTokenRefresh()
          return true
        } else {
          // Invalid tokens, clear them
          await this.clearTokens()
        }
      }
      
      return false
    } catch (error) {
      console.error('Auth initialization failed:', error)
      return false
    }
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null && this.tokens !== null
  }
  
  // Check if user profile is complete
  isProfileComplete() {
    if (!this.currentUser) return false
    return this.currentUser.faceImageUrl && this.currentUser.bodyImageUrl
  }
  
  // Get current user
  getCurrentUser() {
    return this.currentUser
  }
  
  // Login with email and password
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        this.tokens = result.data.tokens
        this.currentUser = result.data.user
        
        await this.storeTokens(this.tokens)
        this.scheduleTokenRefresh()
        
        return { success: true, user: this.currentUser }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Network error occurred' } }
    }
  }
  
  // Signup with user details
  async signup(userData) {
    try {
      const response = await fetch(`${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.AUTH.SIGNUP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      
      const result = await response.json()
      
      if (result.success) {
        this.tokens = result.data.tokens
        this.currentUser = result.data.user
        
        await this.storeTokens(this.tokens)
        this.scheduleTokenRefresh()
        
        return { success: true, user: this.currentUser }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Signup failed:', error)
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Network error occurred' } }
    }
  }
  
  // Logout
  async logout() {
    try {
      if (this.tokens?.accessToken) {
        await fetch(`${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens.accessToken}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      await this.clearTokens()
      this.currentUser = null
      this.tokens = null
      
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout)
        this.refreshTimeout = null
      }
    }
  }
  
  // Refresh access token
  async refreshAccessToken() {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }
    
    try {
      const response = await fetch(`${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        this.tokens = result.data
        await this.storeTokens(this.tokens)
        this.scheduleTokenRefresh()
        return this.tokens.accessToken
      } else {
        // Refresh failed, need to re-authenticate
        await this.clearTokens()
        this.currentUser = null
        this.tokens = null
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }
  
  // Get current user profile from API
  async getCurrentUserProfile() {
    if (!this.tokens?.accessToken) {
      throw new Error('No access token available')
    }
    
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.USER.PROFILE}`,
        { method: 'GET' }
      )
      
      if (response.success) {
        this.currentUser = response.data
        return this.currentUser
      } else {
        throw new Error(response.error?.message || 'Failed to get user profile')
      }
    } catch (error) {
      console.error('Get user profile failed:', error)
      throw error
    }
  }
  
  // Upload user images (face and body)
  async uploadImages(faceImage, bodyImage) {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.USER.UPLOAD_IMAGES}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            faceImage,
            bodyImage,
          }),
        }
      )
      
      if (response.success) {
        this.currentUser = response.data
        return { success: true, user: this.currentUser }
      } else {
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      return { success: false, error: { code: 'NETWORK_ERROR', message: 'Upload failed' } }
    }
  }
  
  // Make authenticated API request with automatic token refresh
  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.tokens?.accessToken) {
      throw new Error('No access token available')
    }
    
    // Add authorization header
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.tokens.accessToken}`,
    }
    
    try {
      const response = await fetch(url, options)
      const result = await response.json()
      
      // If token expired, try to refresh and retry
      if (response.status === 401 && result.error?.code === 'TOKEN_EXPIRED') {
        try {
          await this.refreshAccessToken()
          
          // Retry with new token
          options.headers['Authorization'] = `Bearer ${this.tokens.accessToken}`
          const retryResponse = await fetch(url, options)
          return await retryResponse.json()
        } catch (refreshError) {
          // Refresh failed, user needs to re-authenticate
          await this.logout()
          throw new Error('Authentication expired. Please login again.')
        }
      }
      
      return result
    } catch (error) {
      if (error.message.includes('Authentication expired')) {
        throw error
      }
      
      console.error('Authenticated request failed:', error)
      throw new Error('Network error occurred')
    }
  }
  
  // Schedule automatic token refresh
  scheduleTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }
    
    if (!this.tokens?.expiresAt) return
    
    const expiresAt = new Date(this.tokens.expiresAt)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    
    // Refresh 2 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - 2 * 60 * 1000)
    
    this.refreshTimeout = setTimeout(async () => {
      try {
        await this.refreshAccessToken()
      } catch (error) {
        console.error('Scheduled token refresh failed:', error)
      }
    }, refreshTime)
  }
  
  // Storage methods
  async storeTokens(tokens) {
    const key = window.VTRY_CONSTANTS.STORAGE_KEYS.AUTH_TOKENS
    
    if (window.VTRY_TYPES.isExtensionContext()) {
      await chrome.storage.local.set({ [key]: tokens })
    } else {
      localStorage.setItem(key, JSON.stringify(tokens))
    }
  }
  
  async getStoredTokens() {
    const key = window.VTRY_CONSTANTS.STORAGE_KEYS.AUTH_TOKENS
    
    try {
      if (window.VTRY_TYPES.isExtensionContext()) {
        const result = await chrome.storage.local.get([key])
        return result[key] || null
      } else {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : null
      }
    } catch (error) {
      console.error('Failed to get stored tokens:', error)
      return null
    }
  }
  
  async clearTokens() {
    const key = window.VTRY_CONSTANTS.STORAGE_KEYS.AUTH_TOKENS
    
    if (window.VTRY_TYPES.isExtensionContext()) {
      await chrome.storage.local.remove([key])
    } else {
      localStorage.removeItem(key)
    }
  }
}

// Create global instance
window.vtryAuth = new window.VTryAuthService()

console.log('🔐 V-Try.app Auth Service ready')

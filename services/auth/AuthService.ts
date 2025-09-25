// V-Try.app Authentication Service

import { User, AuthTokens, LoginRequest, SignupRequest, AuthResponse } from '../../shared/types'
import { API_ENDPOINTS, ERROR_CODES, SUCCESS_MESSAGES } from '../../shared/constants'

export class AuthService {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const data = await response.json()
      
      // Store tokens securely
      await this.storeTokens(data.tokens)
      
      return {
        user: data.user,
        tokens: data.tokens,
        isNewUser: false,
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Create new user account
   */
  async signup(userData: SignupRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.SIGNUP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const data = await response.json()
      
      // Store tokens securely
      await this.storeTokens(data.tokens)
      
      return {
        user: data.user,
        tokens: data.tokens,
        isNewUser: true,
      }
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(): Promise<AuthTokens> {
    try {
      const currentTokens = await this.getStoredTokens()
      if (!currentTokens?.refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentTokens.refreshToken}`,
          'X-API-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const tokens = await response.json()
      await this.storeTokens(tokens)
      
      return tokens
    } catch (error) {
      console.error('Token refresh failed:', error)
      await this.logout() // Clear invalid tokens
      throw error
    }
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      const tokens = await this.getStoredTokens()
      
      if (tokens?.accessToken) {
        await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
        })
      }
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      await this.clearStoredTokens()
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens()
      if (!tokens?.accessToken) return false

      // Check if token is expired
      if (new Date() >= new Date(tokens.expiresAt)) {
        try {
          await this.refreshTokens()
          return true
        } catch {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const tokens = await this.getStoredTokens()
      if (!tokens?.accessToken) return null

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.USER.PROFILE}`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'X-API-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshTokens()
          return this.getCurrentUser() // Retry with new token
        }
        throw new Error(await this.handleErrorResponse(response))
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * Store authentication tokens securely
   */
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Chrome Extension storage
      await chrome.storage.local.set({
        'vtry_auth_tokens': tokens
      })
    } else if (typeof localStorage !== 'undefined') {
      // Web storage (with encryption in production)
      localStorage.setItem('vtry_auth_tokens', JSON.stringify(tokens))
    }
  }

  /**
   * Retrieve stored authentication tokens
   */
  private async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome Extension storage
        const result = await chrome.storage.local.get(['vtry_auth_tokens'])
        return result.vtry_auth_tokens || null
      } else if (typeof localStorage !== 'undefined') {
        // Web storage
        const stored = localStorage.getItem('vtry_auth_tokens')
        return stored ? JSON.parse(stored) : null
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Clear stored authentication tokens
   */
  private async clearStoredTokens(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Chrome Extension storage
      await chrome.storage.local.remove(['vtry_auth_tokens', 'vtry_user_data'])
    } else if (typeof localStorage !== 'undefined') {
      // Web storage
      localStorage.removeItem('vtry_auth_tokens')
      localStorage.removeItem('vtry_user_data')
    }
  }

  /**
   * Handle API error responses
   */
  private async handleErrorResponse(response: Response): Promise<string> {
    try {
      const errorData = await response.json()
      return errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
    } catch {
      return `HTTP ${response.status}: ${response.statusText}`
    }
  }

  /**
   * Open authentication popup for Chrome Extension
   */
  async openAuthPopup(type: 'login' | 'signup' = 'login'): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.windows) {
        reject(new Error('Not running in Chrome Extension context'))
        return
      }

      const authUrl = `${this.baseUrl}/auth/popup?type=${type}&extension=true`
      
      chrome.windows.create({
        url: authUrl,
        type: 'popup',
        width: 500,
        height: 700,
        focused: true,
      }, (window) => {
        if (!window) {
          reject(new Error('Failed to open auth popup'))
          return
        }

        // Listen for auth completion
        const handleMessage = (message: any) => {
          if (message.type === 'AUTH_SUCCESS') {
            chrome.runtime.onMessage.removeListener(handleMessage)
            chrome.windows.remove(window.id!)
            resolve(message.data)
          } else if (message.type === 'AUTH_ERROR') {
            chrome.runtime.onMessage.removeListener(handleMessage)
            chrome.windows.remove(window.id!)
            reject(new Error(message.error))
          }
        }

        chrome.runtime.onMessage.addListener(handleMessage)

        // Handle popup closed without auth
        chrome.windows.onRemoved.addListener((closedWindowId) => {
          if (closedWindowId === window.id) {
            chrome.runtime.onMessage.removeListener(handleMessage)
            reject(new Error('Authentication cancelled'))
          }
        })
      })
    })
  }
}

// Singleton instance
export const authService = new AuthService(
  process.env.NEXT_PUBLIC_API_URL || 'https://api.v-try.app',
  process.env.NEXT_PUBLIC_API_KEY || ''
)

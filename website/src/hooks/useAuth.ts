'use client'

import { useState, useEffect, useContext, createContext } from 'react'

// Types
interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  faceImageUrl?: string
  bodyImageUrl?: string
  subscription: 'FREE' | 'PRO' | 'ENTERPRISE'
  emailVerified: boolean
  createdAt: string
  preferences?: {
    defaultGenerationType: 'image' | 'video'
    defaultStyle: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
    autoSaveToFeed: boolean
    publicProfile: boolean
    emailNotifications: boolean
    qualityPreference: 'fast' | 'balanced' | 'high'
  }
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
  tokenType: string
}

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
}

interface SignupData {
  email: string
  password: string
  username: string
  firstName?: string
  lastName?: string
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'v-try-access-token',
  REFRESH_TOKEN: 'v-try-refresh-token',
  USER: 'v-try-user',
} as const

// Auth service
class AuthService {
  private static instance: AuthService
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed')
    }

    return data
  }

  async login(email: string, password: string) {
    const data = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    return {
      user: data.data.user,
      tokens: data.data.tokens,
    }
  }

  async signup(signupData: SignupData) {
    const data = await this.makeRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(signupData),
    })

    return {
      user: data.data.user,
      tokens: data.data.tokens,
    }
  }

  async refreshToken(refreshToken: string) {
    const data = await this.makeRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    return data.data
  }

  async logout(accessToken: string) {
    try {
      await this.makeRequest('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    } catch (error) {
      // Ignore errors during logout - we'll clear local storage anyway
      console.warn('Logout request failed:', error)
    }
  }

  async getProfile(accessToken: string) {
    const data = await this.makeRequest('/api/user/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return data.data
  }

  async updateProfile(accessToken: string, updates: Partial<User>) {
    const data = await this.makeRequest('/api/user/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    })

    return data.data
  }
}

// Storage utilities
const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  },
  
  clear: () => {
    if (typeof window === 'undefined') return
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  },
}

// Custom hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const authService = AuthService.getInstance()

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = storage.get(STORAGE_KEYS.USER)
        const storedAccessToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN)
        const storedRefreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN)

        if (storedUser && storedAccessToken && storedRefreshToken) {
          const tokens = {
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
            expiresAt: '', // We'll update this when refreshing
            tokenType: 'Bearer',
          }

          // Try to refresh the token to validate it
          try {
            const refreshedTokens = await authService.refreshToken(storedRefreshToken)
            
            // Update stored tokens
            storage.set(STORAGE_KEYS.ACCESS_TOKEN, refreshedTokens.accessToken)
            storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshedTokens.refreshToken)

            setState({
              user: storedUser,
              tokens: refreshedTokens,
              isLoading: false,
              isAuthenticated: true,
            })
          } catch (error) {
            // Token refresh failed, clear storage and set unauthenticated
            storage.clear()
            setState({
              user: null,
              tokens: null,
              isLoading: false,
              isAuthenticated: false,
            })
          }
        } else {
          setState({
            user: null,
            tokens: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const { user, tokens } = await authService.login(email, password)

      // Store in localStorage
      storage.set(STORAGE_KEYS.USER, user)
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)

      setState({
        user,
        tokens,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signup = async (signupData: SignupData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const { user, tokens } = await authService.signup(signupData)

      // Store in localStorage
      storage.set(STORAGE_KEYS.USER, user)
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)

      setState({
        user,
        tokens,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const logout = async () => {
    try {
      if (state.tokens?.accessToken) {
        await authService.logout(state.tokens.accessToken)
      }
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      // Clear storage and state regardless of API call success
      storage.clear()
      setState({
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  const refreshAuth = async () => {
    try {
      if (!state.tokens?.refreshToken) {
        throw new Error('No refresh token available')
      }

      const refreshedTokens = await authService.refreshToken(state.tokens.refreshToken)

      // Update stored tokens
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, refreshedTokens.accessToken)
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshedTokens.refreshToken)

      setState(prev => ({
        ...prev,
        tokens: refreshedTokens,
      }))
    } catch (error) {
      // Refresh failed, logout user
      await logout()
      throw error
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!state.tokens?.accessToken) {
        throw new Error('Not authenticated')
      }

      const updatedUser = await authService.updateProfile(state.tokens.accessToken, updates)

      // Update stored user
      storage.set(STORAGE_KEYS.USER, updatedUser)

      setState(prev => ({
        ...prev,
        user: updatedUser,
      }))
    } catch (error) {
      throw error
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    refreshAuth,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

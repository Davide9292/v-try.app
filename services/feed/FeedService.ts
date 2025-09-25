// V-Try.app Feed Service

import { 
  TryOnResult, 
  UserFeed, 
  FeedFilters, 
  Collection,
  ProductInfo,
  WebsiteInfo,
  APIResponse 
} from '../../shared/types'
import { API_ENDPOINTS } from '../../shared/constants'
import { authService } from '../auth/AuthService'

export class FeedService {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  /**
   * Get user's try-on feed with pagination and filters
   */
  async getUserFeed(
    page: number = 1, 
    limit: number = 20, 
    filters?: FeedFilters
  ): Promise<UserFeed> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters && this.buildFilterParams(filters)),
      })

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.FEED.GET_FEED}?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const data = await response.json()
      
      return {
        results: data.results,
        pagination: data.pagination,
        filters: filters,
      }
    } catch (error) {
      console.error('Failed to get user feed:', error)
      throw error
    }
  }

  /**
   * Save a try-on result to user's feed
   */
  async saveTryOnResult(result: Partial<TryOnResult>): Promise<TryOnResult> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.FEED.GET_FEED}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(result),
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to save try-on result:', error)
      throw error
    }
  }

  /**
   * Get a specific try-on result
   */
  async getTryOnResult(resultId: string): Promise<TryOnResult> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.FEED.GET_RESULT}/${resultId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get try-on result:', error)
      throw error
    }
  }

  /**
   * Delete a try-on result from user's feed
   */
  async deleteTryOnResult(resultId: string): Promise<void> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.FEED.DELETE_RESULT}/${resultId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }
    } catch (error) {
      console.error('Failed to delete try-on result:', error)
      throw error
    }
  }

  /**
   * Like/unlike a try-on result
   */
  async toggleLike(resultId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.FEED.LIKE_RESULT}/${resultId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to toggle like:', error)
      throw error
    }
  }

  /**
   * Share a try-on result
   */
  async shareResult(
    resultId: string, 
    platform: 'twitter' | 'facebook' | 'instagram' | 'link'
  ): Promise<{ shareUrl: string }> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.FEED.SHARE_RESULT}/${resultId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
          body: JSON.stringify({ platform }),
        }
      )

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const data = await response.json()
      
      // Track share analytics
      this.trackShare(resultId, platform)
      
      return data
    } catch (error) {
      console.error('Failed to share result:', error)
      throw error
    }
  }

  /**
   * Get user's collections
   */
  async getUserCollections(): Promise<Collection[]> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.COLLECTIONS.LIST}`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'X-API-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get collections:', error)
      throw error
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(
    name: string, 
    description?: string, 
    isPublic: boolean = false
  ): Promise<Collection> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.COLLECTIONS.CREATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({ name, description, isPublic }),
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to create collection:', error)
      throw error
    }
  }

  /**
   * Add result to collection
   */
  async addToCollection(resultId: string, collectionId: string): Promise<void> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.COLLECTIONS.ADD_ITEM}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
          body: JSON.stringify({ resultId, collectionId }),
        }
      )

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }
    } catch (error) {
      console.error('Failed to add to collection:', error)
      throw error
    }
  }

  /**
   * Extract product information from URL
   */
  async extractProductInfo(url: string): Promise<ProductInfo> {
    try {
      // This would typically call a web scraping service
      // For now, we'll return basic info extracted from the URL
      const domain = new URL(url).hostname
      
      return {
        url,
        title: `Product from ${domain}`,
        description: '',
        imageUrl: '',
        category: this.categorizeFromDomain(domain),
      }
    } catch (error) {
      console.error('Failed to extract product info:', error)
      throw error
    }
  }

  /**
   * Extract website information
   */
  async extractWebsiteInfo(url: string): Promise<WebsiteInfo> {
    try {
      const urlObj = new URL(url)
      
      return {
        domain: urlObj.hostname,
        title: urlObj.hostname,
        description: '',
        favicon: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
      }
    } catch (error) {
      console.error('Failed to extract website info:', error)
      throw error
    }
  }

  /**
   * Search feed results
   */
  async searchFeed(
    query: string, 
    filters?: FeedFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<UserFeed> {
    try {
      const tokens = await authService.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('User not authenticated')
      }

      const queryParams = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
        ...(filters && this.buildFilterParams(filters)),
      })

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.FEED.GET_FEED}/search?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'X-API-Key': this.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const data = await response.json()
      
      return {
        results: data.results,
        pagination: data.pagination,
        filters: filters,
      }
    } catch (error) {
      console.error('Failed to search feed:', error)
      throw error
    }
  }

  /**
   * Build filter parameters for API requests
   */
  private buildFilterParams(filters: FeedFilters): Record<string, string> {
    const params: Record<string, string> = {}

    if (filters.dateRange) {
      params.from_date = filters.dateRange.from.toISOString()
      params.to_date = filters.dateRange.to.toISOString()
    }

    if (filters.generationType && filters.generationType !== 'all') {
      params.type = filters.generationType
    }

    if (filters.style?.length) {
      params.styles = filters.style.join(',')
    }

    if (filters.websites?.length) {
      params.websites = filters.websites.join(',')
    }

    if (filters.tags?.length) {
      params.tags = filters.tags.join(',')
    }

    if (filters.collections?.length) {
      params.collections = filters.collections.join(',')
    }

    if (filters.sortBy) {
      params.sort = filters.sortBy
    }

    return params
  }

  /**
   * Categorize product based on domain
   */
  private categorizeFromDomain(domain: string): string {
    const categoryMap: Record<string, string> = {
      'zara.com': 'fashion',
      'hm.com': 'fashion',
      'nike.com': 'sportswear',
      'adidas.com': 'sportswear',
      'amazon.com': 'general',
      'etsy.com': 'handmade',
    }

    return categoryMap[domain] || 'general'
  }

  /**
   * Track share analytics
   */
  private async trackShare(resultId: string, platform: string): Promise<void> {
    try {
      // Send analytics event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
          event_category: 'engagement',
          event_label: platform,
          custom_parameter_1: resultId,
        })
      }
    } catch (error) {
      console.error('Failed to track share:', error)
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
}

// Singleton instance
export const feedService = new FeedService(
  process.env.NEXT_PUBLIC_API_URL || 'https://api.v-try.app',
  process.env.NEXT_PUBLIC_API_KEY || ''
)

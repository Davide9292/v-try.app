// V-Try.app Feed Management Service
window.VTryFeedService = class {
  constructor() {
    this.apiUrl = window.VTRY_CONSTANTS.getApiUrl()
    this.cachedFeed = []
    this.lastFetchTime = null
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    
    console.log('📱 V-Try.app Feed Service initialized')
  }
  
  // Get user's try-on feed with filters
  async getFeed(filters = {}) {
    try {
      // Check cache first
      if (this.shouldUseCache()) {
        return { success: true, data: this.cachedFeed, fromCache: true }
      }
      
      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.generationType && filters.generationType !== 'all') {
        params.append('generationType', filters.generationType)
      }
      if (filters.style && filters.style.length > 0) {
        filters.style.forEach(s => params.append('style', s))
      }
      if (filters.websites && filters.websites.length > 0) {
        filters.websites.forEach(w => params.append('websites', w))
      }
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      
      const queryString = params.toString()
      const url = `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.FEED.GET}${queryString ? '?' + queryString : ''}`
      
      const response = await window.vtryAuth.makeAuthenticatedRequest(url, {
        method: 'GET'
      })
      
      if (response.success) {
        // Update cache
        if (!filters.page || filters.page === 1) {
          this.cachedFeed = response.data.results || []
          this.lastFetchTime = Date.now()
        }
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.error?.message || 'Failed to load feed')
      }
    } catch (error) {
      console.error('Get feed failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Search feed
  async searchFeed(query, filters = {}) {
    try {
      const params = new URLSearchParams()
      params.append('query', query)
      
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      
      const url = `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.FEED.SEARCH}?${params.toString()}`
      
      const response = await window.vtryAuth.makeAuthenticatedRequest(url, {
        method: 'GET'
      })
      
      if (response.success) {
        return { success: true, data: response.data }
      } else {
        throw new Error(response.error?.message || 'Search failed')
      }
    } catch (error) {
      console.error('Search feed failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Update try-on result (tags, visibility, etc.)
  async updateResult(resultId, updates) {
    try {
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.FEED.UPDATE}/${resultId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      )
      
      if (response.success) {
        // Update cached item if it exists
        this.updateCachedItem(resultId, response.data)
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.error?.message || 'Update failed')
      }
    } catch (error) {
      console.error('Update result failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Delete try-on result
  async deleteResult(resultId) {
    try {
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.FEED.DELETE}/${resultId}`,
        { method: 'DELETE' }
      )
      
      if (response.success) {
        // Remove from cache
        this.removeCachedItem(resultId)
        
        return { success: true }
      } else {
        throw new Error(response.error?.message || 'Delete failed')
      }
    } catch (error) {
      console.error('Delete result failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Like/unlike a result
  async toggleLike(resultId) {
    try {
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.FEED.UPDATE}/${resultId}/like`,
        { method: 'POST' }
      )
      
      if (response.success) {
        // Update cached item
        this.updateCachedItem(resultId, response.data)
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.error?.message || 'Like toggle failed')
      }
    } catch (error) {
      console.error('Toggle like failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Share result
  async shareResult(resultId, platform = 'link') {
    try {
      const result = this.getCachedItem(resultId)
      if (!result) {
        throw new Error('Result not found')
      }
      
      const shareData = {
        title: `My V-Try.app Result`,
        text: `Check out this AI try-on result!`,
        url: result.shareUrl || `${window.VTRY_CONSTANTS.getWebsiteUrl()}/result/${resultId}`
      }
      
      if (platform === 'native' && navigator.share) {
        await navigator.share(shareData)
        return { success: true, method: 'native' }
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(shareData.url)
        return { success: true, method: 'clipboard', url: shareData.url }
      }
    } catch (error) {
      console.error('Share result failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Download result
  async downloadResult(resultId) {
    try {
      const result = this.getCachedItem(resultId)
      if (!result) {
        throw new Error('Result not found')
      }
      
      // Create download link
      const link = document.createElement('a')
      link.href = result.resultUrl
      link.download = `vtry-result-${resultId}-${Date.now()}.${result.type === 'video' ? 'mp4' : 'jpg'}`
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      return { success: true }
    } catch (error) {
      console.error('Download result failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Get result details
  async getResult(resultId) {
    try {
      // Check cache first
      const cached = this.getCachedItem(resultId)
      if (cached) {
        return { success: true, data: cached, fromCache: true }
      }
      
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.FEED.GET}/${resultId}`,
        { method: 'GET' }
      )
      
      if (response.success) {
        return { success: true, data: response.data }
      } else {
        throw new Error(response.error?.message || 'Failed to get result')
      }
    } catch (error) {
      console.error('Get result failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Add new result to feed (called when generation completes)
  addNewResult(result) {
    // Add to beginning of cached feed
    this.cachedFeed.unshift(result)
    
    // Limit cache size
    if (this.cachedFeed.length > 100) {
      this.cachedFeed = this.cachedFeed.slice(0, 100)
    }
    
    // Dispatch event
    this.dispatchEvent('feed_updated', { action: 'added', result })
  }
  
  // Cache management methods
  shouldUseCache() {
    return this.cachedFeed.length > 0 && 
           this.lastFetchTime && 
           (Date.now() - this.lastFetchTime) < this.cacheTimeout
  }
  
  getCachedItem(resultId) {
    return this.cachedFeed.find(item => item.id === resultId) || null
  }
  
  updateCachedItem(resultId, updatedData) {
    const index = this.cachedFeed.findIndex(item => item.id === resultId)
    if (index !== -1) {
      this.cachedFeed[index] = { ...this.cachedFeed[index], ...updatedData }
      this.dispatchEvent('feed_updated', { action: 'updated', result: this.cachedFeed[index] })
    }
  }
  
  removeCachedItem(resultId) {
    const index = this.cachedFeed.findIndex(item => item.id === resultId)
    if (index !== -1) {
      const removed = this.cachedFeed.splice(index, 1)[0]
      this.dispatchEvent('feed_updated', { action: 'removed', result: removed })
    }
  }
  
  clearCache() {
    this.cachedFeed = []
    this.lastFetchTime = null
  }
  
  // Filter and sort helpers
  filterByType(type) {
    if (type === 'all') return this.cachedFeed
    return this.cachedFeed.filter(item => item.type === type)
  }
  
  filterByWebsite(domain) {
    return this.cachedFeed.filter(item => 
      item.websiteInfo?.domain?.includes(domain)
    )
  }
  
  filterByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    
    return this.cachedFeed.filter(item => {
      const itemDate = new Date(item.createdAt).getTime()
      return itemDate >= start && itemDate <= end
    })
  }
  
  sortByDate(ascending = false) {
    return [...this.cachedFeed].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return ascending ? dateA - dateB : dateB - dateA
    })
  }
  
  sortByLikes(ascending = false) {
    return [...this.cachedFeed].sort((a, b) => {
      const likesA = a.likesCount || 0
      const likesB = b.likesCount || 0
      return ascending ? likesA - likesB : likesB - likesA
    })
  }
  
  // Event dispatcher
  dispatchEvent(eventType, data) {
    const event = new CustomEvent(`vtry_feed_${eventType}`, { detail: data })
    window.dispatchEvent(event)
  }
  
  // Get feed statistics
  getFeedStats() {
    const stats = {
      total: this.cachedFeed.length,
      images: this.cachedFeed.filter(item => item.type === 'image').length,
      videos: this.cachedFeed.filter(item => item.type === 'video').length,
      totalLikes: this.cachedFeed.reduce((sum, item) => sum + (item.likesCount || 0), 0),
      websites: [...new Set(this.cachedFeed.map(item => item.websiteInfo?.domain).filter(Boolean))].length
    }
    
    return stats
  }
  
  // Clean up resources
  destroy() {
    this.clearCache()
  }
}

// Create global instance
window.vtryFeed = new window.VTryFeedService()

// Listen for generation completion to update feed
window.addEventListener('vtry_ai_job_complete', (event) => {
  const { resultUrl, thumbnailUrl, ...jobData } = event.detail
  
  if (resultUrl) {
    // Create feed item from completed generation
    const feedItem = {
      id: jobData.jobId,
      userId: window.vtryAuth.currentUser?.id,
      type: jobData.type || 'image',
      resultUrl,
      thumbnailUrl,
      status: 'completed',
      createdAt: new Date().toISOString(),
      websiteInfo: jobData.websiteInfo || {},
      style: jobData.style || 'realistic',
      isPublic: false,
      likesCount: 0,
      viewsCount: 0,
      tags: []
    }
    
    window.vtryFeed.addNewResult(feedItem)
  }
})

console.log('📱 V-Try.app Feed Service ready')

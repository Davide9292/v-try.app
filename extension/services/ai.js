// V-Try.app AI Generation Service
window.VTryAIService = class {
  constructor() {
    this.apiUrl = window.VTRY_CONSTANTS.getApiUrl()
    this.activeJobs = new Map()
    this.websocket = null
    
    console.log('🤖 V-Try.app AI Service initialized')
  }
  
  // Initialize WebSocket connection for real-time updates
  async initWebSocket() {
    if (!window.vtryAuth.isAuthenticated()) return
    
    try {
      const wsUrl = this.apiUrl.replace('http', 'ws') + '/ws'
      this.websocket = new WebSocket(wsUrl)
      
      this.websocket.onopen = () => {
        console.log('🔌 WebSocket connected')
        
        // Authenticate WebSocket connection
        this.websocket.send(JSON.stringify({
          type: 'authenticate',
          token: window.vtryAuth.tokens?.accessToken
        }))
      }
      
      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleWebSocketMessage(message)
        } catch (error) {
          console.error('WebSocket message parsing failed:', error)
        }
      }
      
      this.websocket.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (window.vtryAuth.isAuthenticated()) {
            this.initWebSocket()
          }
        }, 5000)
      }
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('WebSocket initialization failed:', error)
    }
  }
  
  // Handle WebSocket messages
  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'generation_update':
        this.handleGenerationUpdate(message.data)
        break
      case 'generation_complete':
        this.handleGenerationComplete(message.data)
        break
      case 'generation_failed':
        this.handleGenerationFailed(message.data)
        break
      default:
        console.log('Unknown WebSocket message:', message)
    }
  }
  
  // Start AI generation
  async generateTryOn(request) {
    try {
      // Validate request
      if (!window.VTRY_TYPES.validateGenerationRequest(request)) {
        throw new Error('Invalid generation request')
      }
      
      // Check authentication
      if (!window.vtryAuth.isAuthenticated()) {
        throw new Error('Authentication required')
      }
      
      // Check daily limits
      const usage = await this.getDailyUsage()
      const limits = window.VTRY_CONSTANTS.DAILY_LIMITS[window.vtryAuth.currentUser.subscription]
      
      if (request.type === 'image' && usage.images >= limits.images) {
        throw new Error('Daily image generation limit exceeded')
      }
      
      if (request.type === 'video' && usage.videos >= limits.videos) {
        throw new Error('Daily video generation limit exceeded')
      }
      
      // Make API request
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.AI.GENERATE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      )
      
      if (response.success) {
        const job = response.data
        this.activeJobs.set(job.jobId, job)
        
        // Start polling for status updates
        this.pollJobStatus(job.jobId)
        
        return { success: true, jobId: job.jobId, job }
      } else {
        throw new Error(response.error?.message || 'Generation failed')
      }
    } catch (error) {
      console.error('AI generation failed:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Get generation job status
  async getJobStatus(jobId) {
    try {
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.AI.STATUS}/${jobId}`,
        { method: 'GET' }
      )
      
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to get job status')
      }
    } catch (error) {
      console.error('Get job status failed:', error)
      throw error
    }
  }
  
  // Cancel generation job
  async cancelJob(jobId) {
    try {
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.AI.CANCEL}/${jobId}`,
        { method: 'DELETE' }
      )
      
      if (response.success) {
        this.activeJobs.delete(jobId)
        this.notifyJobCancelled(jobId)
        return true
      } else {
        throw new Error(response.error?.message || 'Failed to cancel job')
      }
    } catch (error) {
      console.error('Cancel job failed:', error)
      return false
    }
  }
  
  // Poll job status (fallback if WebSocket is not available)
  async pollJobStatus(jobId, maxAttempts = 60) {
    let attempts = 0
    
    const poll = async () => {
      try {
        const status = await this.getJobStatus(jobId)
        
        // Update active job
        if (this.activeJobs.has(jobId)) {
          this.activeJobs.set(jobId, { ...this.activeJobs.get(jobId), ...status })
        }
        
        // Notify listeners
        this.notifyJobUpdate(jobId, status)
        
        // Check if job is complete
        if (status.status === 'completed') {
          this.handleGenerationComplete({ jobId, ...status })
          return
        }
        
        if (status.status === 'failed') {
          this.handleGenerationFailed({ jobId, ...status })
          return
        }
        
        // Continue polling if job is still in progress
        attempts++
        if (attempts < maxAttempts && 
            (status.status === 'queued' || status.status === 'processing')) {
          setTimeout(poll, 2000) // Poll every 2 seconds
        } else if (attempts >= maxAttempts) {
          this.handleGenerationFailed({ 
            jobId, 
            error: 'Generation timeout' 
          })
        }
      } catch (error) {
        console.error('Polling failed:', error)
        
        attempts++
        if (attempts < 5) {
          setTimeout(poll, 5000) // Retry after 5 seconds
        } else {
          this.handleGenerationFailed({ 
            jobId, 
            error: 'Status polling failed' 
          })
        }
      }
    }
    
    // Start polling after 1 second
    setTimeout(poll, 1000)
  }
  
  // Handle generation update
  handleGenerationUpdate(data) {
    const { jobId } = data
    
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.set(jobId, { ...this.activeJobs.get(jobId), ...data })
    }
    
    this.notifyJobUpdate(jobId, data)
  }
  
  // Handle generation completion
  handleGenerationComplete(data) {
    const { jobId } = data
    
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.set(jobId, { ...this.activeJobs.get(jobId), ...data })
    }
    
    this.notifyJobComplete(jobId, data)
    
    // Clean up after 5 minutes
    setTimeout(() => {
      this.activeJobs.delete(jobId)
    }, 5 * 60 * 1000)
  }
  
  // Handle generation failure
  handleGenerationFailed(data) {
    const { jobId } = data
    
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.set(jobId, { ...this.activeJobs.get(jobId), ...data })
    }
    
    this.notifyJobFailed(jobId, data)
    
    // Clean up after 1 minute
    setTimeout(() => {
      this.activeJobs.delete(jobId)
    }, 60 * 1000)
  }
  
  // Get daily usage statistics
  async getDailyUsage() {
    try {
      const response = await window.vtryAuth.makeAuthenticatedRequest(
        `${this.apiUrl}${window.VTRY_CONSTANTS.ENDPOINTS.USER.USAGE}`,
        { method: 'GET' }
      )
      
      if (response.success) {
        return {
          images: response.data.usage.imagesGenerated || 0,
          videos: response.data.usage.videosGenerated || 0,
          remaining: response.data.remaining || {}
        }
      } else {
        return { images: 0, videos: 0, remaining: {} }
      }
    } catch (error) {
      console.error('Failed to get daily usage:', error)
      return { images: 0, videos: 0, remaining: {} }
    }
  }
  
  // Event notification methods
  notifyJobUpdate(jobId, data) {
    this.dispatchEvent('job_update', { jobId, ...data })
  }
  
  notifyJobComplete(jobId, data) {
    this.dispatchEvent('job_complete', { jobId, ...data })
  }
  
  notifyJobFailed(jobId, data) {
    this.dispatchEvent('job_failed', { jobId, ...data })
  }
  
  notifyJobCancelled(jobId) {
    this.dispatchEvent('job_cancelled', { jobId })
  }
  
  // Event dispatcher
  dispatchEvent(eventType, data) {
    const event = new CustomEvent(`vtry_ai_${eventType}`, { detail: data })
    window.dispatchEvent(event)
  }
  
  // Get active jobs
  getActiveJobs() {
    return Array.from(this.activeJobs.values())
  }
  
  // Get specific job
  getJob(jobId) {
    return this.activeJobs.get(jobId) || null
  }
  
  // Clean up resources
  destroy() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    
    this.activeJobs.clear()
  }
}

// Create global instance
window.vtryAI = new window.VTryAIService()

// Initialize WebSocket when auth is ready
window.addEventListener('vtry_auth_ready', () => {
  window.vtryAI.initWebSocket()
})

console.log('🤖 V-Try.app AI Service ready')

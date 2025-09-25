// V-Try.app Extension Popup v2.0
// Enhanced with authentication, feed, and KIE AI integration

class VTryAppPopup {
  constructor() {
    this.currentUser = null
    this.currentTab = 'try-on'
    this.feedResults = []
    this.collections = []
    
    this.init()
  }

  async init() {
    console.log('🚀 V-Try.app Popup v2.0 initializing...')
    
    try {
      // Check authentication status
      const isAuthenticated = await authService.isAuthenticated()
      
      if (!isAuthenticated) {
        this.showAuthRequired()
      } else {
        const user = await authService.getCurrentUser()
        if (!user.faceImageUrl || !user.bodyImageUrl) {
          this.showProfileSetup(user)
        } else {
          this.showMainApp(user)
        }
      }
    } catch (error) {
      console.error('Initialization failed:', error)
      this.showError('Failed to initialize app')
    } finally {
      this.hideLoading()
    }
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Auth buttons
    document.getElementById('login-btn')?.addEventListener('click', () => this.handleLogin())
    document.getElementById('signup-btn')?.addEventListener('click', () => this.handleSignup())
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout())
    
    // Profile setup
    document.getElementById('faceImage')?.addEventListener('change', (e) => this.handleImageUpload(e, 'face'))
    document.getElementById('bodyImage')?.addEventListener('change', (e) => this.handleImageUpload(e, 'body'))
    document.getElementById('complete-setup')?.addEventListener('click', () => this.completeSetup())
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab))
    })
    
    // Feed controls
    document.getElementById('feed-search')?.addEventListener('input', (e) => this.searchFeed(e.target.value))
    document.getElementById('feed-filter')?.addEventListener('change', (e) => this.filterFeed(e.target.value))
    
    // Collections
    document.getElementById('create-collection-btn')?.addEventListener('click', () => this.createCollection())
    
    // Generation modal
    document.getElementById('close-generation-modal')?.addEventListener('click', () => this.closeGenerationModal())
    
    // Settings
    document.getElementById('settings-btn')?.addEventListener('click', () => this.openSettings())
  }

  // Authentication Methods
  async handleLogin() {
    try {
      this.showLoading('Signing in...')
      const authResult = await authService.openAuthPopup('login')
      
      if (authResult.user.faceImageUrl && authResult.user.bodyImageUrl) {
        this.showMainApp(authResult.user)
      } else {
        this.showProfileSetup(authResult.user)
      }
    } catch (error) {
      console.error('Login failed:', error)
      this.showError('Login failed. Please try again.')
    } finally {
      this.hideLoading()
    }
  }

  async handleSignup() {
    try {
      this.showLoading('Creating account...')
      const authResult = await authService.openAuthPopup('signup')
      this.showProfileSetup(authResult.user)
    } catch (error) {
      console.error('Signup failed:', error)
      this.showError('Signup failed. Please try again.')
    } finally {
      this.hideLoading()
    }
  }

  async handleLogout() {
    try {
      await authService.logout()
      this.showAuthRequired()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Profile Setup Methods
  async handleImageUpload(event, type) {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    if (!this.validateImageFile(file, type)) return

    try {
      const imageData = await this.fileToBase64(file)
      this.displayImagePreview(imageData, type)
      
      // Store temporarily
      if (type === 'face') {
        this.tempFaceImage = imageData
      } else {
        this.tempBodyImage = imageData
      }
      
      this.checkSetupComplete()
    } catch (error) {
      console.error('Image upload failed:', error)
      this.showError('Failed to process image')
    }
  }

  validateImageFile(file, type) {
    // Size check
    const maxSize = type === 'face' ? 2 * 1024 * 1024 : 4 * 1024 * 1024 // 2MB for face, 4MB for body
    if (file.size > maxSize) {
      this.showError(`Image too large. Max size: ${maxSize / 1024 / 1024}MB`)
      return false
    }

    // Type check
    if (!file.type.startsWith('image/')) {
      this.showError('Please select a valid image file')
      return false
    }

    return true
  }

  displayImagePreview(imageData, type) {
    const previewId = type === 'face' ? 'facePreview' : 'bodyPreview'
    const preview = document.getElementById(previewId)
    
    preview.innerHTML = `<img src="${imageData}" alt="${type} preview" class="preview-image">`
  }

  checkSetupComplete() {
    const completeBtn = document.getElementById('complete-setup')
    const canComplete = this.tempFaceImage && this.tempBodyImage
    
    completeBtn.disabled = !canComplete
    completeBtn.textContent = canComplete ? 'Complete Setup' : 'Upload both images'
  }

  async completeSetup() {
    try {
      this.showLoading('Setting up your profile...')
      
      // Upload images to server
      const response = await fetch(`${API_BASE_URL}/user/upload-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAccessToken()}`,
        },
        body: JSON.stringify({
          faceImage: this.tempFaceImage,
          bodyImage: this.tempBodyImage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload images')
      }

      const updatedUser = await response.json()
      this.showMainApp(updatedUser)
      
    } catch (error) {
      console.error('Setup failed:', error)
      this.showError('Failed to complete setup. Please try again.')
    } finally {
      this.hideLoading()
    }
  }

  // Main App Methods
  async showMainApp(user) {
    this.currentUser = user
    
    // Update UI
    document.getElementById('user-name').textContent = user.username
    document.getElementById('user-tier').textContent = user.subscription.toUpperCase()
    document.getElementById('user-avatar').src = user.avatarUrl || 'icons/icon48.png'
    
    // Load initial data
    await this.loadUsageStats()
    await this.loadFeed()
    await this.loadCollections()
    
    this.showView('main-app')
  }

  async loadUsageStats() {
    try {
      // Get today's usage from API or storage
      const stats = await this.getTodayUsage()
      
      document.getElementById('images-used').textContent = stats.imagesUsed
      document.getElementById('videos-used').textContent = stats.videosUsed
      document.getElementById('credits-remaining').textContent = stats.creditsRemaining
    } catch (error) {
      console.error('Failed to load usage stats:', error)
    }
  }

  async loadFeed(filters = {}) {
    try {
      document.getElementById('feed-loading').style.display = 'block'
      
      const feed = await feedService.getUserFeed(1, 20, filters)
      this.feedResults = feed.results
      
      this.renderFeed()
    } catch (error) {
      console.error('Failed to load feed:', error)
      this.showError('Failed to load your feed')
    } finally {
      document.getElementById('feed-loading').style.display = 'none'
    }
  }

  renderFeed() {
    const feedContainer = document.getElementById('feed-results')
    const emptyState = document.getElementById('feed-empty')
    
    if (this.feedResults.length === 0) {
      emptyState.style.display = 'block'
      feedContainer.innerHTML = ''
      return
    }
    
    emptyState.style.display = 'none'
    
    feedContainer.innerHTML = this.feedResults.map(result => `
      <div class="feed-item" data-id="${result.id}">
        <div class="feed-item-header">
          <img src="${result.generatedImageUrl}" alt="Try-on result" class="feed-thumbnail">
          <div class="feed-item-info">
            <h4>${result.productInfo.title || 'Product'}</h4>
            <p>${result.websiteInfo.domain}</p>
            <span class="feed-date">${this.formatDate(result.createdAt)}</span>
          </div>
          <div class="feed-item-actions">
            <button class="action-btn" onclick="popup.openResult('${result.id}')" title="View">👁️</button>
            <button class="action-btn" onclick="popup.shareResult('${result.id}')" title="Share">📤</button>
            <button class="action-btn" onclick="popup.deleteResult('${result.id}')" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="feed-item-tags">
          ${result.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    `).join('')
  }

  async loadCollections() {
    try {
      this.collections = await feedService.getUserCollections()
      this.renderCollections()
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  renderCollections() {
    const container = document.getElementById('collections-list')
    
    if (this.collections.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📂</span>
          <h3>No collections yet</h3>
          <p>Create collections to organize your try-ons</p>
        </div>
      `
      return
    }
    
    container.innerHTML = this.collections.map(collection => `
      <div class="collection-item" data-id="${collection.id}">
        <div class="collection-cover">
          <img src="${collection.coverImageUrl || 'icons/icon48.png'}" alt="${collection.name}">
        </div>
        <div class="collection-info">
          <h4>${collection.name}</h4>
          <p>${collection.tryOnCount} items</p>
        </div>
      </div>
    `).join('')
  }

  // Tab Navigation
  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName)
    })
    
    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`)
    })
    
    this.currentTab = tabName
    
    // Load tab-specific data
    if (tabName === 'feed' && this.feedResults.length === 0) {
      this.loadFeed()
    } else if (tabName === 'collections' && this.collections.length === 0) {
      this.loadCollections()
    }
  }

  // Feed Methods
  async searchFeed(query) {
    if (query.length < 2) {
      this.loadFeed()
      return
    }
    
    try {
      const feed = await feedService.searchFeed(query)
      this.feedResults = feed.results
      this.renderFeed()
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  async filterFeed(filterType) {
    const filters = {}
    
    switch (filterType) {
      case 'image':
        filters.generationType = 'image'
        break
      case 'video':
        filters.generationType = 'video'
        break
      case 'today':
        filters.dateRange = {
          from: new Date(new Date().setHours(0, 0, 0, 0)),
          to: new Date()
        }
        break
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        filters.dateRange = {
          from: weekAgo,
          to: new Date()
        }
        break
    }
    
    this.loadFeed(filters)
  }

  // Result Actions
  async openResult(resultId) {
    try {
      const result = await feedService.getTryOnResult(resultId)
      this.showResultModal(result)
    } catch (error) {
      console.error('Failed to open result:', error)
    }
  }

  async shareResult(resultId) {
    try {
      const shareUrl = await feedService.shareResult(resultId, 'link')
      navigator.clipboard.writeText(shareUrl.shareUrl)
      this.showSuccess('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to share result:', error)
    }
  }

  async deleteResult(resultId) {
    if (!confirm('Are you sure you want to delete this try-on?')) return
    
    try {
      await feedService.deleteTryOnResult(resultId)
      this.feedResults = this.feedResults.filter(r => r.id !== resultId)
      this.renderFeed()
      this.showSuccess('Try-on deleted')
    } catch (error) {
      console.error('Failed to delete result:', error)
    }
  }

  // Collection Methods
  async createCollection() {
    const name = prompt('Collection name:')
    if (!name) return
    
    try {
      const collection = await feedService.createCollection(name)
      this.collections.push(collection)
      this.renderCollections()
      this.showSuccess('Collection created!')
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  // UI State Management
  showView(viewId) {
    document.querySelectorAll('[id$="-state"], [id$="-required"], [id$="-setup"], [id$="-app"]').forEach(el => {
      el.style.display = 'none'
    })
    document.getElementById(viewId).style.display = 'block'
  }

  showAuthRequired() {
    this.showView('auth-required')
  }

  showProfileSetup(user) {
    this.currentUser = user
    this.showView('profile-setup')
  }

  showLoading(message = 'Loading...') {
    const loading = document.getElementById('loading-state')
    loading.querySelector('p').textContent = message
    loading.style.display = 'flex'
  }

  hideLoading() {
    document.getElementById('loading-state').style.display = 'none'
  }

  showError(message) {
    // Create toast notification
    const toast = document.createElement('div')
    toast.className = 'toast toast-error'
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  showSuccess(message) {
    const toast = document.createElement('div')
    toast.className = 'toast toast-success'
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  // Utility Methods
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    if (diff < 24 * 60 * 60 * 1000) {
      return 'Today'
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  async getAccessToken() {
    const tokens = await authService.getStoredTokens()
    return tokens?.accessToken
  }

  async getTodayUsage() {
    // This would typically come from the API
    // For now, return mock data
    return {
      imagesUsed: 5,
      videosUsed: 1,
      creditsRemaining: this.currentUser?.subscription === 'free' ? 5 : '∞'
    }
  }

  openSettings() {
    chrome.tabs.create({ url: 'https://v-try.app/settings' })
  }

  closeGenerationModal() {
    document.getElementById('generation-modal').style.display = 'none'
  }

  showResultModal(result) {
    // Implementation for showing full result modal
    console.log('Showing result:', result)
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.popup = new VTryAppPopup()
})

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATION_UPDATE') {
    // Update generation progress if modal is open
    console.log('Generation update:', message.data)
  }
})

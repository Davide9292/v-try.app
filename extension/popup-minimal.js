// V-Try.app Extension - Minimal UI Implementation
class VTryApp {
  constructor() {
    this.currentUser = null
    this.currentTab = 'try-on'
    this.apiBaseUrl = 'https://api.v-try.app'
    this.feedResults = []
    this.collections = []
    
    this.init()
  }

  async init() {
    console.log('🚀 V-Try.app Extension initializing...')
    
    try {
      // Check authentication
      const isAuthenticated = await this.checkAuth()
      
      if (!isAuthenticated) {
        this.showState('auth-state')
      } else {
        const user = await this.getCurrentUser()
        
        if (!user.faceImageUrl || !user.bodyImageUrl) {
          this.showState('setup-state')
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
    // Auth
    document.getElementById('login-btn')?.addEventListener('click', () => this.handleAuth('login'))
    document.getElementById('signup-btn')?.addEventListener('click', () => this.handleAuth('signup'))
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout())
    
    // Setup
    document.getElementById('face-input')?.addEventListener('change', (e) => this.handleImageUpload(e, 'face'))
    document.getElementById('body-input')?.addEventListener('change', (e) => this.handleImageUpload(e, 'body'))
    document.getElementById('complete-setup')?.addEventListener('click', () => this.completeSetup())
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab))
    })
    
    // Generation options
    document.querySelectorAll('input[name="type"]').forEach(input => {
      input.addEventListener('change', () => this.updateGenerationType())
    })
    
    // Feed
    document.getElementById('feed-search')?.addEventListener('input', (e) => this.searchFeed(e.target.value))
    
    // Collections
    document.getElementById('new-collection')?.addEventListener('click', () => this.createCollection())
    
    // Settings
    document.getElementById('settings-btn')?.addEventListener('click', () => this.openSettings())
    
    // Option selection
    document.querySelectorAll('.option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'))
        option.classList.add('selected')
        option.querySelector('input').checked = true
      })
    })
  }

  // Authentication Methods
  async checkAuth() {
    try {
      const tokens = await this.getStoredTokens()
      if (!tokens?.accessToken) return false
      
      // Verify token with API
      const response = await fetch(`${this.apiBaseUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      })
      
      return response.ok
    } catch (error) {
      console.error('Auth check failed:', error)
      return false
    }
  }

  async handleAuth(type) {
    try {
      this.showLoading()
      
      // Open auth window
      const authUrl = `${this.apiBaseUrl}/auth/popup?type=${type}&extension=true`
      
      const authWindow = window.open(authUrl, 'auth', 'width=500,height=700,scrollbars=yes,resizable=yes')
      
      // Listen for auth completion
      const authResult = await this.waitForAuthResult(authWindow)
      
      if (authResult.success) {
        await this.storeTokens(authResult.tokens)
        
        if (authResult.user.faceImageUrl && authResult.user.bodyImageUrl) {
          this.showMainApp(authResult.user)
        } else {
          this.showState('setup-state')
        }
      } else {
        throw new Error(authResult.error || 'Authentication failed')
      }
      
    } catch (error) {
      console.error('Auth failed:', error)
      this.showError('Authentication failed. Please try again.')
    } finally {
      this.hideLoading()
    }
  }

  async waitForAuthResult(authWindow) {
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed)
          reject(new Error('Authentication cancelled'))
        }
      }, 1000)

      // Listen for message from auth window
      const handleMessage = (event) => {
        if (event.origin !== new URL(this.apiBaseUrl).origin) return
        
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        authWindow.close()
        
        if (event.data.type === 'AUTH_SUCCESS') {
          resolve(event.data)
        } else {
          reject(new Error(event.data.error || 'Authentication failed'))
        }
      }

      window.addEventListener('message', handleMessage)
      
      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        authWindow.close()
        reject(new Error('Authentication timeout'))
      }, 5 * 60 * 1000)
    })
  }

  async handleLogout() {
    try {
      const tokens = await this.getStoredTokens()
      
      if (tokens?.accessToken) {
        await fetch(`${this.apiBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        })
      }
      
      await this.clearStoredTokens()
      this.showState('auth-state')
      
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Profile Setup Methods
  async handleImageUpload(event, type) {
    const file = event.target.files[0]
    if (!file) return

    try {
      // Validate file
      if (!this.validateImageFile(file)) return

      // Convert to base64
      const imageData = await this.fileToBase64(file)
      
      // Show preview
      this.showImagePreview(imageData, type)
      
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

  validateImageFile(file) {
    if (file.size > 4 * 1024 * 1024) {
      this.showError('Image too large (max 4MB)')
      return false
    }
    
    if (!file.type.startsWith('image/')) {
      this.showError('Please select a valid image file')
      return false
    }
    
    return true
  }

  showImagePreview(imageData, type) {
    const previewId = type === 'face' ? 'face-preview' : 'body-preview'
    const preview = document.getElementById(previewId)
    
    preview.style.backgroundImage = `url(${imageData})`
    preview.style.backgroundSize = 'cover'
    preview.style.backgroundPosition = 'center'
    preview.textContent = ''
  }

  checkSetupComplete() {
    const completeBtn = document.getElementById('complete-setup')
    const canComplete = this.tempFaceImage && this.tempBodyImage
    
    completeBtn.disabled = !canComplete
    completeBtn.textContent = canComplete ? 'Complete Setup' : 'Upload both images'
  }

  async completeSetup() {
    try {
      this.showLoading()
      
      const tokens = await this.getStoredTokens()
      
      const response = await fetch(`${this.apiBaseUrl}/api/user/upload-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          faceImage: this.tempFaceImage,
          bodyImage: this.tempBodyImage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload images')
      }

      const user = await response.json()
      this.showMainApp(user)
      
    } catch (error) {
      console.error('Setup failed:', error)
      this.showError('Setup failed. Please try again.')
    } finally {
      this.hideLoading()
    }
  }

  // Main App Methods
  async showMainApp(user) {
    this.currentUser = user
    
    // Update UI
    document.getElementById('user-name').textContent = user.username
    document.getElementById('user-tier').textContent = user.subscription
    document.getElementById('user-avatar').textContent = user.username.charAt(0).toUpperCase()
    
    // Load data
    await this.loadUsageStats()
    
    this.showState('main-state')
  }

  async getCurrentUser() {
    try {
      const tokens = await this.getStoredTokens()
      
      const response = await fetch(`${this.apiBaseUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get user profile')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get current user:', error)
      throw error
    }
  }

  async loadUsageStats() {
    try {
      // Mock data for now - replace with API call
      const stats = {
        imagesUsed: 3,
        videosUsed: 1,
        creditsLeft: this.currentUser.subscription === 'FREE' ? 7 : 97
      }
      
      document.getElementById('images-used').textContent = stats.imagesUsed
      document.getElementById('videos-used').textContent = stats.videosUsed
      document.getElementById('credits-left').textContent = stats.creditsLeft
    } catch (error) {
      console.error('Failed to load usage stats:', error)
    }
  }

  // Tab Management
  switchTab(tabName) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName)
    })
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`)
    })
    
    this.currentTab = tabName
    
    // Load tab data
    if (tabName === 'feed') {
      this.loadFeed()
    } else if (tabName === 'collections') {
      this.loadCollections()
    }
  }

  async loadFeed() {
    try {
      const loading = document.getElementById('feed-loading')
      const empty = document.getElementById('feed-empty')
      const results = document.getElementById('feed-results')
      
      loading.classList.remove('hidden')
      empty.classList.add('hidden')
      results.innerHTML = ''
      
      // Mock data for now
      setTimeout(() => {
        loading.classList.add('hidden')
        
        if (this.feedResults.length === 0) {
          empty.classList.remove('hidden')
        } else {
          this.renderFeed()
        }
      }, 1000)
      
    } catch (error) {
      console.error('Failed to load feed:', error)
    }
  }

  renderFeed() {
    const results = document.getElementById('feed-results')
    
    if (this.feedResults.length === 0) {
      document.getElementById('feed-empty').classList.remove('hidden')
      return
    }
    
    results.innerHTML = this.feedResults.map(result => `
      <div class="feed-item">
        <div class="feed-thumb" style="background-image: url(${result.thumbnailUrl}); background-size: cover;"></div>
        <div class="feed-content">
          <div class="feed-title">${result.productTitle || 'Product'}</div>
          <div class="feed-meta">${result.websiteDomain} • ${this.formatDate(result.createdAt)}</div>
        </div>
      </div>
    `).join('')
  }

  async loadCollections() {
    try {
      const loading = document.getElementById('collections-loading')
      const empty = document.getElementById('collections-empty')
      const results = document.getElementById('collections-results')
      
      loading.classList.remove('hidden')
      empty.classList.add('hidden')
      results.innerHTML = ''
      
      // Mock data for now
      setTimeout(() => {
        loading.classList.add('hidden')
        
        if (this.collections.length === 0) {
          empty.classList.remove('hidden')
        } else {
          this.renderCollections()
        }
      }, 1000)
      
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  renderCollections() {
    const results = document.getElementById('collections-results')
    
    results.innerHTML = this.collections.map(collection => `
      <div class="feed-item">
        <div class="feed-thumb"></div>
        <div class="feed-content">
          <div class="feed-title">${collection.name}</div>
          <div class="feed-meta">${collection.itemCount} items</div>
        </div>
      </div>
    `).join('')
  }

  async searchFeed(query) {
    // Implement search functionality
    console.log('Searching feed:', query)
  }

  async createCollection() {
    const name = prompt('Collection name:')
    if (!name) return
    
    try {
      // Mock for now
      this.collections.push({
        id: Date.now().toString(),
        name,
        itemCount: 0
      })
      
      this.renderCollections()
      this.showSuccess('Collection created')
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }

  updateGenerationType() {
    const selected = document.querySelector('input[name="type"]:checked')
    console.log('Generation type changed:', selected.value)
  }

  openSettings() {
    chrome.tabs.create({ url: 'https://v-try.app/settings' })
  }

  // Utility Methods
  showState(stateId) {
    const states = ['loading-state', 'auth-state', 'setup-state', 'main-state']
    
    states.forEach(state => {
      const element = document.getElementById(state)
      if (element) {
        element.classList.toggle('hidden', state !== stateId)
      }
    })
  }

  showLoading() {
    document.getElementById('loading-state').classList.remove('hidden')
  }

  hideLoading() {
    document.getElementById('loading-state').classList.add('hidden')
  }

  showError(message) {
    const status = document.getElementById('setup-status') || this.createStatusElement()
    status.textContent = message
    status.className = 'status status-error'
    
    setTimeout(() => {
      status.textContent = ''
      status.className = 'status'
    }, 3000)
  }

  showSuccess(message) {
    const status = document.getElementById('setup-status') || this.createStatusElement()
    status.textContent = message
    status.className = 'status status-success'
    
    setTimeout(() => {
      status.textContent = ''
      status.className = 'status'
    }, 3000)
  }

  createStatusElement() {
    const status = document.createElement('div')
    status.className = 'status'
    status.id = 'dynamic-status'
    document.body.appendChild(status)
    return status
  }

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
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Storage Methods
  async storeTokens(tokens) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ 'vtry_auth_tokens': tokens })
    } else {
      localStorage.setItem('vtry_auth_tokens', JSON.stringify(tokens))
    }
  }

  async getStoredTokens() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['vtry_auth_tokens'])
        return result.vtry_auth_tokens || null
      } else {
        const stored = localStorage.getItem('vtry_auth_tokens')
        return stored ? JSON.parse(stored) : null
      }
    } catch {
      return null
    }
  }

  async clearStoredTokens() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.remove(['vtry_auth_tokens'])
    } else {
      localStorage.removeItem('vtry_auth_tokens')
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.vtryApp = new VTryApp()
})

// Handle messages from content script
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GENERATION_UPDATE') {
      console.log('Generation update:', message.data)
      // Handle generation progress updates
    }
  })
}

// V-Try.app Extension - Minimal UI Implementation
class VTryApp {
  constructor() {
    this.currentUser = null
    this.currentTab = 'try-on'
    this.apiBaseUrl = window.VTRY_CONSTANTS?.getApiUrl() || 'https://v-tryapp-production.up.railway.app'
    this.feedResults = []
    this.collections = []
    
    this.init()
  }

  async init() {
    console.log('🚀 V-Try.app Extension initializing...')
    
    try {
      // Wait a bit for auth service to load
      await this.waitForAuthService()
      
      // Check authentication
      console.log('🔍 Checking authentication status...')
      const isAuthenticated = await this.checkAuth()
      console.log('🔐 Authentication result:', isAuthenticated)
      
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, showing auth screen')
        this.showState('auth-state')
      } else {
        console.log('✅ Authenticated, getting user data...')
        const user = await this.getCurrentUser()
        console.log('👤 User data:', user)
        
        if (!user || (!user.faceImageUrl || !user.bodyImageUrl)) {
          console.log('📷 Profile incomplete, showing setup screen')
          this.showState('setup-state')
        } else {
          console.log('🎉 Profile complete, showing main app')
          this.showMainApp(user)
        }
      }
    } catch (error) {
      console.error('❌ Initialization failed:', error)
      this.showError('Failed to initialize app')
    } finally {
      this.hideLoading()
    }
    
    this.setupEventListeners()
  }

  async waitForAuthService() {
    // Wait up to 2 seconds for auth service to be available
    for (let i = 0; i < 20; i++) {
      if (window.vtryAuth) {
        console.log('✅ Auth service found')
        return
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    console.log('⚠️ Auth service not found, using fallback')
  }

  setupEventListeners() {
    console.log('🎧 Setting up event listeners...')
    
    // Auth
    document.getElementById('login-btn')?.addEventListener('click', () => this.handleAuth('login'))
    document.getElementById('signup-btn')?.addEventListener('click', () => this.handleAuth('signup'))
    document.getElementById('logout-btn')?.addEventListener('click', () => this.handleLogout())
    
    // Setup - Add event listeners dynamically when setup state is shown
    this.setupImageUploadListeners()
    
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

  setupImageUploadListeners() {
    console.log('📷 Setting up image upload listeners...')
    
    // Face image upload
    const faceInput = document.getElementById('face-input')
    const facePreview = document.getElementById('face-preview')
    const faceButton = document.getElementById('face-button')
    
    if (faceInput) {
      // Remove existing listeners first
      faceInput.removeEventListener('change', this.handleFaceUpload)
      this.handleFaceUpload = (e) => {
        console.log('📷 Face input changed')
        this.handleImageUpload(e, 'face')
      }
      faceInput.addEventListener('change', this.handleFaceUpload)
    }
    
    if (facePreview) {
      facePreview.removeEventListener('click', this.handleFacePreviewClick)
      this.handleFacePreviewClick = () => {
        console.log('📷 Face preview clicked')
        document.getElementById('face-input')?.click()
      }
      facePreview.addEventListener('click', this.handleFacePreviewClick)
    }
    
    if (faceButton) {
      faceButton.removeEventListener('click', this.handleFaceButtonClick)
      this.handleFaceButtonClick = (e) => {
        e.preventDefault()
        console.log('📷 Face button clicked')
        document.getElementById('face-input')?.click()
      }
      faceButton.addEventListener('click', this.handleFaceButtonClick)
    }
    
    // Body image upload
    const bodyInput = document.getElementById('body-input')
    const bodyPreview = document.getElementById('body-preview')
    const bodyButton = document.getElementById('body-button')
    
    if (bodyInput) {
      bodyInput.removeEventListener('change', this.handleBodyUpload)
      this.handleBodyUpload = (e) => {
        console.log('📷 Body input changed')
        this.handleImageUpload(e, 'body')
      }
      bodyInput.addEventListener('change', this.handleBodyUpload)
    }
    
    if (bodyPreview) {
      bodyPreview.removeEventListener('click', this.handleBodyPreviewClick)
      this.handleBodyPreviewClick = () => {
        console.log('📷 Body preview clicked')
        document.getElementById('body-input')?.click()
      }
      bodyPreview.addEventListener('click', this.handleBodyPreviewClick)
    }
    
    if (bodyButton) {
      bodyButton.removeEventListener('click', this.handleBodyButtonClick)
      this.handleBodyButtonClick = (e) => {
        e.preventDefault()
        console.log('📷 Body button clicked')
        document.getElementById('body-input')?.click()
      }
      bodyButton.addEventListener('click', this.handleBodyButtonClick)
    }
    
    // Complete setup button
    const completeBtn = document.getElementById('complete-setup')
    if (completeBtn) {
      completeBtn.removeEventListener('click', this.handleCompleteSetup)
      this.handleCompleteSetup = () => {
        console.log('✅ Complete setup clicked')
        this.completeSetup()
      }
      completeBtn.addEventListener('click', this.handleCompleteSetup)
    }
  }

  // Authentication Methods
  async checkAuth() {
    try {
      console.log('🔧 Starting auth check...')
      
      // First check stored tokens directly
      const tokens = await this.getStoredTokens()
      console.log('🎫 Stored tokens check:', tokens ? 'Found tokens' : 'No tokens')
      
      if (!tokens?.accessToken) {
        console.log('❌ No access token found in storage')
        return false
      }
      
      console.log('🌐 Verifying token with API...')
      // Verify token with API
      const response = await fetch(`${this.apiBaseUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      })
      
      console.log('🌐 API response status:', response.status, response.ok)
      
      if (response.ok) {
        console.log('✅ Token is valid')
        return true
      } else {
        console.log('❌ Token is invalid, clearing storage')
        await this.clearStoredTokens()
        return false
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error)
      return false
    }
  }

  async handleAuth(type) {
    try {
      this.showLoading()
      
      // Show inline auth form instead of popup
      this.showAuthForm(type)
      
    } catch (error) {
      console.error('Auth error:', error)
      this.showError('Authentication failed')
    } finally {
      this.hideLoading()
    }
  }

  showAuthForm(type) {
    const authState = document.getElementById('auth-state')
    const content = authState.querySelector('.content')
    
    const formHtml = type === 'signup' ? `
      <div class="section">
        <div class="section-title">Create Account</div>
        <form id="auth-form">
          <input type="text" id="username" class="input" placeholder="Username" required style="margin-bottom: 8px;">
          <input type="email" id="email" class="input" placeholder="Email" required style="margin-bottom: 8px;">
          <input type="password" id="password" class="input" placeholder="Password" required style="margin-bottom: 16px;">
          <button type="submit" class="btn">Create Account</button>
          <button type="button" class="btn btn-secondary" id="back-btn" style="margin-top: 8px;">Back</button>
        </form>
        <div class="status" id="auth-status"></div>
      </div>
    ` : `
      <div class="section">
        <div class="section-title">Sign In</div>
        <form id="auth-form">
          <input type="email" id="email" class="input" placeholder="Email" required style="margin-bottom: 8px;">
          <input type="password" id="password" class="input" placeholder="Password" required style="margin-bottom: 16px;">
          <button type="submit" class="btn">Sign In</button>
          <button type="button" class="btn btn-secondary" id="back-btn" style="margin-top: 8px;">Back</button>
        </form>
        <div class="status" id="auth-status"></div>
      </div>
    `
    
    content.innerHTML = formHtml
    
    // Setup form handlers
    document.getElementById('auth-form').addEventListener('submit', (e) => this.submitAuth(e, type))
    document.getElementById('back-btn').addEventListener('click', () => this.init())
  }

  async submitAuth(event, type) {
    event.preventDefault()
    
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const username = type === 'signup' ? document.getElementById('username').value : null
    
    const statusEl = document.getElementById('auth-status')
    statusEl.textContent = 'Processing...'
    statusEl.className = 'status'
    
    try {
      // Direct API call instead of using auth service
      const endpoint = type === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const body = type === 'signup' 
        ? { email, password, username }
        : { email, password }
      
      console.log(`🌐 Making ${type} request to:`, `${this.apiBaseUrl}${endpoint}`)
      
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      const result = await response.json()
      console.log(`🌐 ${type} response:`, result)
      
      if (result.success) {
        // Store tokens directly
        await this.storeTokens(result.data.tokens)
        
        statusEl.textContent = 'Success! Redirecting...'
        statusEl.className = 'status status-success'
        
        // Check if profile is complete
        const user = result.data.user
        if (user.faceImageUrl && user.bodyImageUrl) {
          this.showMainApp(user)
        } else {
          this.showState('setup-state')
        }
      } else {
        statusEl.textContent = result.error?.message || 'Authentication failed'
        statusEl.className = 'status status-error'
      }
      
    } catch (error) {
      console.error('Auth failed:', error)
      statusEl.textContent = 'Network error. Please check your connection.'
      statusEl.className = 'status status-error'
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
    console.log('🖼️ Image upload started:', type)
    const file = event.target.files[0]
    if (!file) {
      console.log('❌ No file selected')
      return
    }

    console.log('📁 File selected:', file.name, file.size, file.type)

    try {
      // Validate file
      if (!this.validateImageFile(file)) {
        console.log('❌ File validation failed')
        return
      }

      console.log('✅ File validation passed')
      
      // Show status
      const statusEl = document.getElementById('setup-status')
      statusEl.textContent = `Processing ${type} image...`
      statusEl.className = 'status'

      // Convert to base64
      const imageData = await this.fileToBase64(file)
      console.log('✅ Image converted to base64, length:', imageData.length)
      
      // Show preview
      this.showImagePreview(imageData, type)
      
      // Store temporarily
      if (type === 'face') {
        this.tempFaceImage = imageData
        console.log('✅ Face image stored')
      } else {
        this.tempBodyImage = imageData
        console.log('✅ Body image stored')
      }

      statusEl.textContent = `${type} image uploaded successfully!`
      statusEl.className = 'status status-success'
      
      this.checkSetupComplete()
      
    } catch (error) {
      console.error('Image upload failed:', error)
      const statusEl = document.getElementById('setup-status')
      statusEl.textContent = `Failed to process ${type} image`
      statusEl.className = 'status status-error'
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
      // Use the auth service if available
      if (window.vtryAuth && window.vtryAuth.isAuthenticated()) {
        const user = await window.vtryAuth.getCurrentUserProfile()
        return user
      }
      
      // Fallback to manual API call
      const tokens = await this.getStoredTokens()
      
      const response = await fetch(`${this.apiBaseUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get user profile')
      }

      const result = await response.json()
      console.log('👤 API user response:', result)
      
      // Extract user data from API response format
      return result.success ? result.data : result
    } catch (error) {
      console.error('Failed to get current user:', error)
      throw error
    }
  }

  async loadUsageStats() {
    try {
      // Get real usage data from API
      const response = await fetch(`${this.apiBaseUrl}/api/user/usage`, {
        headers: {
          'Authorization': `Bearer ${(await this.getStoredTokens())?.accessToken}`,
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        const usage = result.data.usage
        const limits = window.VTRY_CONSTANTS.DAILY_LIMITS[this.currentUser.subscription]
        
        document.getElementById('images-used').textContent = usage.imagesGenerated || 0
        document.getElementById('videos-used').textContent = usage.videosGenerated || 0
        document.getElementById('credits-left').textContent = 
          this.currentUser.subscription === 'FREE' 
            ? Math.max(0, limits.images - (usage.imagesGenerated || 0))
            : '∞'
      } else {
        // Fallback to mock data
        const stats = {
          imagesUsed: 0,
          videosUsed: 0,
          creditsLeft: this.currentUser.subscription === 'FREE' ? 10 : '∞'
        }
        
        document.getElementById('images-used').textContent = stats.imagesUsed
        document.getElementById('videos-used').textContent = stats.videosUsed
        document.getElementById('credits-left').textContent = stats.creditsLeft
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error)
      // Fallback stats
      document.getElementById('images-used').textContent = '0'
      document.getElementById('videos-used').textContent = '0'
      document.getElementById('credits-left').textContent = '10'
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
      
      // Load real feed data from API
      const tokens = await this.getStoredTokens()
      const response = await fetch(`${this.apiBaseUrl}/api/feed?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      })
      
      loading.classList.add('hidden')
      
      if (response.ok) {
        const result = await response.json()
        this.feedResults = result.data.results || []
        
        if (this.feedResults.length === 0) {
          empty.classList.remove('hidden')
        } else {
          this.renderFeed()
        }
      } else {
        // Show empty state if API fails
        empty.classList.remove('hidden')
      }
      
    } catch (error) {
      console.error('Failed to load feed:', error)
      document.getElementById('feed-loading').classList.add('hidden')
      document.getElementById('feed-empty').classList.remove('hidden')
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
        <div class="feed-thumb" 
             style="background-image: url(${result.generatedImageUrl || result.originalImageUrl}); background-size: cover; background-position: center; cursor: pointer;" 
             onclick="vtryApp.viewFeedItem('${result.id}')" 
             title="Click to expand image"></div>
        <div class="feed-content" style="cursor: pointer;" onclick="vtryApp.viewFeedItem('${result.id}')">
          <div class="feed-title">${result.productInfo?.title || result.websiteInfo?.title || 'Product Try-On'}</div>
          <div class="feed-meta">${result.websiteInfo?.domain || 'Unknown'} • ${this.formatDate(result.createdAt)}</div>
          ${result.productUrl ? `
            <div class="feed-actions" style="margin-top: 4px;">
              <a href="${result.productUrl}" target="_blank" class="feed-link" 
                 style="font-size: 11px; color: #007BFF; text-decoration: none; display: inline-flex; align-items: center; gap: 2px;"
                 onclick="event.stopPropagation()">
                <span>🔗</span> View Original Page
              </a>
            </div>
          ` : ''}
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
      
      // Load real collections data from API
      const tokens = await this.getStoredTokens()
      const response = await fetch(`${this.apiBaseUrl}/api/collections`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      })
      
      loading.classList.add('hidden')
      
      if (response.ok) {
        const result = await response.json()
        this.collections = result.data.collections || []
        
        if (this.collections.length === 0) {
          empty.classList.remove('hidden')
        } else {
          this.renderCollections()
        }
      } else {
        // Show empty state if API fails
        empty.classList.remove('hidden')
      }
      
    } catch (error) {
      console.error('Failed to load collections:', error)
      document.getElementById('collections-loading').classList.add('hidden')
      document.getElementById('collections-empty').classList.remove('hidden')
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
    if (!query.trim()) {
      await this.loadFeed()
      return
    }
    
    try {
      const tokens = await this.getStoredTokens()
      const response = await fetch(`${this.apiBaseUrl}/api/feed/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        this.feedResults = result.data.results || []
        this.renderFeed()
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  async createCollection() {
    const name = prompt('Collection name:')
    if (!name?.trim()) return
    
    try {
      const tokens = await this.getStoredTokens()
      const response = await fetch(`${this.apiBaseUrl}/api/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      })
      
      if (response.ok) {
        const result = await response.json()
        this.collections.push(result.data)
        this.renderCollections()
        this.showSuccess('Collection created successfully')
      } else {
        this.showError('Failed to create collection')
      }
    } catch (error) {
      console.error('Failed to create collection:', error)
      this.showError('Failed to create collection')
    }
  }

  async viewFeedItem(itemId) {
    try {
      const item = this.feedResults.find(r => r.id === itemId)
      if (!item) return
      
      // Create and show modal with full image
      const modal = document.createElement('div')
      modal.className = 'modal-overlay'
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh; background: white; border-radius: 8px; overflow: hidden;">
          <div class="modal-header" style="padding: 16px; border-bottom: 1px solid #E9ECEF; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0; font-size: 16px;">${item.productInfo?.title || 'Try-On Result'}</h3>
              ${item.productUrl ? `
                <a href="${item.productUrl}" target="_blank" 
                   style="font-size: 12px; color: #007BFF; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px;">
                  <span>🔗</span> View Original Page
                </a>
              ` : ''}
            </div>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body" style="padding: 20px; text-align: center;">
            <img src="${item.generatedImageUrl}" alt="Try-on result" style="max-width: 100%; max-height: 60vh; border-radius: 8px;">
            <div style="margin-top: 16px; font-size: 14px; color: #6C757D;">
              ${item.websiteInfo?.domain} • ${this.formatDate(item.createdAt)}
            </div>
          </div>
          <div class="modal-footer" style="padding: 16px; border-top: 1px solid #E9ECEF; display: flex; gap: 8px; justify-content: center;">
            <button onclick="vtryApp.downloadImage('${item.generatedImageUrl}')" class="btn btn-secondary btn-sm">Download</button>
            <button onclick="vtryApp.shareImage('${item.id}')" class="btn btn-secondary btn-sm">Share</button>
            ${item.productUrl ? `
              <button onclick="window.open('${item.productUrl}', '_blank')" class="btn btn-secondary btn-sm">View Original Page</button>
            ` : ''}
          </div>
        </div>
      `
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(0,0,0,0.8); z-index: 10000; 
        display: flex; align-items: center; justify-content: center;
      `
      
      document.body.appendChild(modal)
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove()
      })
    } catch (error) {
      console.error('Failed to view feed item:', error)
    }
  }

  async downloadImage(imageUrl) {
    try {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `vtry-result-${Date.now()}.jpg`
      link.target = '_blank'
      link.click()
      this.showSuccess('Download started')
    } catch (error) {
      console.error('Download failed:', error)
      this.showError('Download failed')
    }
  }

  async shareImage(itemId) {
    try {
      const item = this.feedResults.find(r => r.id === itemId)
      if (!item) return
      
      if (navigator.share) {
        await navigator.share({
          title: 'My V-Try.app Result',
          text: 'Check out my AI try-on result!',
          url: item.generatedImageUrl,
        })
      } else {
        await navigator.clipboard.writeText(item.generatedImageUrl)
        this.showSuccess('Link copied to clipboard')
      }
    } catch (error) {
      console.error('Share failed:', error)
      this.showError('Share failed')
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
    console.log('🔄 Switching to state:', stateId)
    const states = ['loading-state', 'auth-state', 'setup-state', 'main-state']
    
    states.forEach(state => {
      const element = document.getElementById(state)
      if (element) {
        element.classList.toggle('hidden', state !== stateId)
      }
    })
    
    // Re-setup event listeners when switching to setup state
    if (stateId === 'setup-state') {
      setTimeout(() => {
        this.setupImageUploadListeners()
      }, 100) // Small delay to ensure DOM is ready
    }
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

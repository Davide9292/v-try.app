// V-Try.app Content Script - Minimal Design
class VTryContentScript {
  constructor() {
    this.isProcessing = false
    this.apiBaseUrl = window.VTRY_CONSTANTS?.getApiUrl() || 'https://v-tryapp-production.up.railway.app'
    this.currentBadge = null
    this.currentModal = null
    
    this.init()
  }

  init() {
    console.log('🎭 V-Try.app Content Script loaded')
    
    // Inject minimal styles
    this.injectStyles()
    
    // Setup image hover detection
    this.setupHoverDetection()
    
    // Listen for messages from popup
    this.setupMessageListener()
  }

  injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
      /* V-Try.app Minimal Badge Styles */
      .vtry-badge {
        position: absolute;
        z-index: 999999;
        background: #000000;
        color: #FFFFFF;
        padding: 6px 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
        border: none;
        outline: none;
        user-select: none;
        opacity: 0;
        transform: translateY(4px);
        pointer-events: auto;
      }
      
      .vtry-badge.visible {
        opacity: 1;
        transform: translateY(0);
      }
      
      .vtry-badge:hover {
        background: #212529;
        transform: translateY(-1px);
      }
      
      .vtry-badge.processing {
        background: #6C757D;
        cursor: wait;
      }
      
      .vtry-badge.processing:hover {
        background: #6C757D;
        transform: translateY(0);
      }
      
      /* Image highlight */
      .vtry-highlight {
        outline: 2px solid #000000 !important;
        outline-offset: 2px !important;
      }
      
      /* Modal styles */
      .vtry-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .vtry-modal.visible {
        opacity: 1;
      }
      
      .vtry-modal-content {
        background: #FFFFFF;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.95);
        transition: transform 0.2s ease;
      }
      
      .vtry-modal.visible .vtry-modal-content {
        transform: scale(1);
      }
      
      .vtry-modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid #E9ECEF;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .vtry-modal-title {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 16px;
        font-weight: 600;
        color: #000000;
      }
      
      .vtry-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #6C757D;
        padding: 4px;
        line-height: 1;
      }
      
      .vtry-close:hover {
        color: #000000;
      }
      
      .vtry-modal-body {
        padding: 20px;
        text-align: center;
      }
      
      .vtry-generation-progress {
        margin-bottom: 20px;
      }
      
      .vtry-progress-bar {
        width: 100%;
        height: 4px;
        background: #E9ECEF;
        margin-bottom: 12px;
      }
      
      .vtry-progress-fill {
        height: 100%;
        background: #000000;
        width: 0%;
        transition: width 0.3s ease;
      }
      
      .vtry-status-text {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        color: #6C757D;
        margin: 0;
      }
      
      .vtry-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
        margin: 20px 0;
      }
      
      .vtry-preview-image {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border: 1px solid #E9ECEF;
      }
      
      .vtry-arrow {
        font-size: 20px;
        color: #6C757D;
      }
      
      .vtry-result-placeholder {
        width: 120px;
        height: 120px;
        background: #F8F9FA;
        border: 1px solid #E9ECEF;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 8px;
      }
      
      .vtry-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #E9ECEF;
        border-top: 2px solid #000000;
        border-radius: 50%;
        animation: vtry-spin 1s linear infinite;
      }
      
      @keyframes vtry-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .vtry-spinner-text {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        color: #6C757D;
      }
      
      .vtry-result-image {
        max-width: 300px;
        max-height: 400px;
        border: 1px solid #E9ECEF;
      }
      
      .vtry-modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
      }
      
      .vtry-btn {
        padding: 8px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      
      .vtry-btn-primary {
        background: #000000;
        color: #FFFFFF;
      }
      
      .vtry-btn-primary:hover {
        background: #212529;
      }
      
      .vtry-btn-secondary {
        background: #FFFFFF;
        color: #000000;
        border: 1px solid #DEE2E6;
      }
      
      .vtry-btn-secondary:hover {
        background: #F8F9FA;
      }
      
      /* Toast notifications */
      .vtry-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000000;
        color: #FFFFFF;
        padding: 12px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        z-index: 1000001;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      }
      
      .vtry-toast.visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      .vtry-toast.error {
        background: #000000;
      }
      
      .vtry-toast.success {
        background: #000000;
      }
    `
    
    document.head.appendChild(style)
  }

  setupHoverDetection() {
    let hoverTimeout

    const handleMouseEnter = (e) => {
      if (this.isProcessing) return
      
      const img = e.target
      
      // Skip if image is too small
      if (img.offsetWidth < 100 || img.offsetHeight < 100) return
      
      // Skip if already has badge
      if (img.dataset.vtryBadge) return
      
      clearTimeout(hoverTimeout)
      hoverTimeout = setTimeout(() => {
        this.showBadge(img)
      }, 200)
    }

    const handleMouseLeave = (e) => {
      clearTimeout(hoverTimeout)
      
      // Remove badge after delay if not hovering over badge
      setTimeout(() => {
        if (this.currentBadge && !this.currentBadge.matches(':hover')) {
          this.hideBadge()
        }
      }, 100)
    }

    // Add listeners to all images
    const addListeners = () => {
      document.querySelectorAll('img').forEach(img => {
        if (img.dataset.vtryListeners) return
        
        img.addEventListener('mouseenter', handleMouseEnter)
        img.addEventListener('mouseleave', handleMouseLeave)
        img.dataset.vtryListeners = 'true'
      })
    }

    // Initial setup
    addListeners()

    // Watch for new images
    const observer = new MutationObserver(() => {
      addListeners()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  showBadge(img) {
    // Remove existing badge
    this.hideBadge()
    
    // Create badge
    const badge = document.createElement('button')
    badge.className = 'vtry-badge'
    badge.textContent = 'Try On'
    
    // Position badge
    const rect = img.getBoundingClientRect()
    badge.style.position = 'fixed'
    badge.style.top = (rect.top + 8) + 'px'
    badge.style.right = (window.innerWidth - rect.right + 8) + 'px'
    
    // Add to page
    document.body.appendChild(badge)
    
    // Show with animation
    setTimeout(() => {
      badge.classList.add('visible')
    }, 10)
    
    // Add click handler
    badge.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.handleTryOn(img)
    })
    
    // Add hover handlers
    badge.addEventListener('mouseenter', () => {
      img.classList.add('vtry-highlight')
    })
    
    badge.addEventListener('mouseleave', () => {
      img.classList.remove('vtry-highlight')
      setTimeout(() => {
        if (!img.matches(':hover')) {
          this.hideBadge()
        }
      }, 100)
    })
    
    this.currentBadge = badge
    img.dataset.vtryBadge = 'true'
  }

  hideBadge() {
    if (this.currentBadge) {
      // Remove highlight from image
      document.querySelectorAll('.vtry-highlight').forEach(img => {
        img.classList.remove('vtry-highlight')
        delete img.dataset.vtryBadge
      })
      
      // Remove badge
      this.currentBadge.remove()
      this.currentBadge = null
    }
  }

  async handleTryOn(img) {
    if (this.isProcessing) return
    
    try {
      this.isProcessing = true
      
      // Check authentication
      const isAuthenticated = await this.checkAuth()
      if (!isAuthenticated) {
        this.showToast('Please sign in to use V-Try.app', 'error')
        return
      }
      
      // Update badge to processing state
      if (this.currentBadge) {
        this.currentBadge.classList.add('processing')
        this.currentBadge.textContent = 'Processing...'
      }
      
      // Show generation modal
      this.showGenerationModal(img)
      
      // Start generation process
      await this.generateTryOn(img)
      
    } catch (error) {
      console.error('Try-on failed:', error)
      this.showToast('Try-on failed. Please try again.', 'error')
    } finally {
      this.isProcessing = false
      this.hideBadge()
    }
  }

  showGenerationModal(originalImg) {
    // Create modal
    const modal = document.createElement('div')
    modal.className = 'vtry-modal'
    
    modal.innerHTML = `
      <div class="vtry-modal-content">
        <div class="vtry-modal-header">
          <h3 class="vtry-modal-title">Generating Your Try-On</h3>
          <button class="vtry-close">&times;</button>
        </div>
        <div class="vtry-modal-body">
          <div class="vtry-generation-progress">
            <div class="vtry-progress-bar">
              <div class="vtry-progress-fill"></div>
            </div>
            <p class="vtry-status-text">Starting generation...</p>
          </div>
          <div class="vtry-preview">
            <img src="${originalImg.src}" alt="Original" class="vtry-preview-image">
            <div class="vtry-arrow">→</div>
            <div class="vtry-result-placeholder">
              <div class="vtry-spinner"></div>
              <div class="vtry-spinner-text">Generating...</div>
            </div>
          </div>
        </div>
      </div>
    `
    
    // Add to page
    document.body.appendChild(modal)
    
    // Show with animation
    setTimeout(() => {
      modal.classList.add('visible')
    }, 10)
    
    // Add close handler
    modal.querySelector('.vtry-close').addEventListener('click', () => {
      this.hideGenerationModal()
    })
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideGenerationModal()
      }
    })
    
    this.currentModal = modal
  }

  hideGenerationModal() {
    if (this.currentModal) {
      this.currentModal.classList.remove('visible')
      setTimeout(() => {
        this.currentModal.remove()
        this.currentModal = null
      }, 200)
    }
  }

  async generateTryOn(img) {
    try {
      // Get user tokens
      const tokens = await this.getStoredTokens()
      if (!tokens?.accessToken) {
        throw new Error('Please sign in to use V-Try.app')
      }
      
      // Convert image to base64
      const imageData = await this.imageToBase64(img)
      if (!imageData) {
        throw new Error('Failed to process image')
      }
      
      // Get generation preferences from popup
      const preferences = await this.getGenerationPreferences()
      
      // Update progress
      this.updateProgress(25, 'Processing image...')
      
      // Prepare request payload
      const payload = {
        type: preferences.type || 'image',
        targetImage: imageData,
        style: preferences.style || 'realistic',
        productUrl: window.location.href,
        websiteInfo: {
          domain: window.location.hostname,
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
          favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || '',
        },
      }
      
      console.log('🚀 Starting AI generation with payload:', payload)
      console.log('🔑 Using API URL:', `${this.apiBaseUrl}/api/ai/generate`)
      console.log('🎫 Using token:', tokens.accessToken ? 'Present' : 'Missing')
      
      // Start generation with enhanced payload
      const response = await fetch(`${this.apiBaseUrl}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(payload),
      })
      
      console.log('📡 API response status:', response.status, response.statusText)
      
      if (!response.ok) {
        let errorMessage = 'Generation failed'
        try {
          const error = await response.json()
          console.error('❌ API error response:', error)
          
          if (response.status === 401) {
            throw new Error('Please sign in again')
          } else if (response.status === 429) {
            throw new Error('Daily limit exceeded. Upgrade for unlimited tries!')
          }
          
          errorMessage = error.error?.message || error.message || 'Generation failed'
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Update progress
        this.updateProgress(50, 'AI is working...')
        
        // Poll for completion with real-time updates
        await this.pollGenerationStatus(result.data.jobId, tokens.accessToken)
      } else {
        throw new Error(result.error?.message || 'Failed to start generation')
      }
      
    } catch (error) {
      console.error('❌ Generation failed:', error)
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.updateProgress(0, 'Error: Network connection failed. Check your internet connection.')
      } else if (error.message.includes('Failed to fetch')) {
        this.updateProgress(0, 'Error: Cannot reach V-Try.app servers. Please try again later.')
      } else {
        this.updateProgress(0, `Error: ${error.message}`)
      }
      
      // Show error for longer for important messages
      const isImportantError = error.message.includes('sign in') || error.message.includes('limit') || error.message.includes('Network') || error.message.includes('servers')
      setTimeout(() => {
        this.hideGenerationModal()
      }, isImportantError ? 5000 : 3000)
    }
  }

  async pollGenerationStatus(jobId, accessToken) {
    const maxAttempts = 60 // 2 minutes max
    let attempts = 0
    
    const poll = async () => {
      try {
        const response = await fetch(`${this.apiBaseUrl}/api/ai/status/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })
        
        if (!response.ok) {
          throw new Error('Failed to check status')
        }
        
        const status = await response.json()
        
        switch (status.status) {
          case 'queued':
            this.updateProgress(25, 'Queued for processing...')
            break
          case 'processing':
            this.updateProgress(75, 'AI is generating...')
            break
          case 'completed':
            this.updateProgress(100, 'Complete!')
            this.showResult(status.resultUrl)
            return
          case 'failed':
            throw new Error(status.error || 'Generation failed')
          case 'cancelled':
            throw new Error('Generation was cancelled')
        }
        
        // Continue polling
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          throw new Error('Generation timeout')
        }
        
      } catch (error) {
        console.error('Status check failed:', error)
        this.updateProgress(0, `Error: ${error.message}`)
        
        setTimeout(() => {
          this.hideGenerationModal()
        }, 3000)
      }
    }
    
    // Start polling
    setTimeout(poll, 1000)
  }

  updateProgress(percent, message) {
    if (!this.currentModal) return
    
    const progressFill = this.currentModal.querySelector('.vtry-progress-fill')
    const statusText = this.currentModal.querySelector('.vtry-status-text')
    
    if (progressFill) {
      progressFill.style.width = `${percent}%`
    }
    
    if (statusText) {
      statusText.textContent = message
    }
  }

  showResult(resultUrl) {
    if (!this.currentModal) return
    
    const modalBody = this.currentModal.querySelector('.vtry-modal-body')
    
    modalBody.innerHTML = `
      <img src="${resultUrl}" alt="Try-on result" class="vtry-result-image">
      <div class="vtry-modal-actions">
        <button class="vtry-btn vtry-btn-primary" onclick="window.vtryContent.downloadResult('${resultUrl}')">
          Download
        </button>
        <button class="vtry-btn vtry-btn-secondary" onclick="window.vtryContent.shareResult('${resultUrl}')">
          Share
        </button>
        <button class="vtry-btn vtry-btn-secondary" onclick="window.vtryContent.hideGenerationModal()">
          Close
        </button>
      </div>
    `
  }

  async downloadResult(url) {
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = `vtry-result-${Date.now()}.jpg`
      link.click()
      
      this.showToast('Download started', 'success')
    } catch (error) {
      console.error('Download failed:', error)
      this.showToast('Download failed', 'error')
    }
  }

  async shareResult(url) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My V-Try.app Result',
          url: url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        this.showToast('Link copied to clipboard', 'success')
      }
    } catch (error) {
      console.error('Share failed:', error)
      this.showToast('Share failed', 'error')
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `vtry-toast ${type}`
    toast.textContent = message
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.classList.add('visible')
    }, 10)
    
    setTimeout(() => {
      toast.classList.remove('visible')
      setTimeout(() => {
        toast.remove()
      }, 300)
    }, 3000)
  }

  // Utility Methods
  async checkAuth() {
    try {
      const tokens = await this.getStoredTokens()
      return tokens?.accessToken ? true : false
    } catch {
      return false
    }
  }

  async getStoredTokens() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['vtry_auth_tokens'])
        return result.vtry_auth_tokens || null
      }
      return null
    } catch {
      return null
    }
  }

  async getGenerationPreferences() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['vtry_preferences'])
        return result.vtry_preferences || { type: 'image', style: 'realistic' }
      }
      return { type: 'image', style: 'realistic' }
    } catch {
      return { type: 'image', style: 'realistic' }
    }
  }

  async imageToBase64(img) {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Create a new image to handle CORS
      const corsImg = new Image()
      corsImg.crossOrigin = 'anonymous'
      
      return new Promise((resolve) => {
        corsImg.onload = () => {
          canvas.width = corsImg.naturalWidth
          canvas.height = corsImg.naturalHeight
          ctx.drawImage(corsImg, 0, 0)
          
          try {
            const base64 = canvas.toDataURL('image/jpeg', 0.8)
            resolve(base64)
          } catch (e) {
            console.warn('CORS issue, using original URL')
            resolve(img.src)
          }
        }
        
        corsImg.onerror = () => {
          console.warn('Failed to load image, using original URL')
          resolve(img.src)
        }
        
        corsImg.src = img.src
      })
    } catch (error) {
      console.error('Image conversion failed:', error)
      return img.src
    }
  }

  setupMessageListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'GENERATION_PREFERENCES_UPDATED') {
          // Handle preferences update
          console.log('Preferences updated:', message.data)
        }
      })
    }
  }

  // Enhanced helper methods
  extractProductTitle(img) {
    // Try to extract product title from various sources
    const sources = [
      img.alt,
      img.title,
      img.getAttribute('data-product-name'),
      img.getAttribute('data-title'),
      img.closest('[data-product-name]')?.getAttribute('data-product-name'),
      img.closest('article')?.querySelector('h1, h2, h3')?.textContent,
      img.closest('.product')?.querySelector('.title, .name, h1, h2, h3')?.textContent,
      document.title,
    ]
    
    return sources.find(title => title && title.trim().length > 0)?.trim() || 'Product'
  }

  detectProductCategory(img) {
    const context = img.closest('article, .product, .item')?.textContent?.toLowerCase() || 
                   img.alt?.toLowerCase() || 
                   document.title.toLowerCase() || ''
    
    const categories = {
      'clothing': ['shirt', 'dress', 'pants', 'jacket', 'sweater', 'hoodie', 'top', 'bottom'],
      'shoes': ['shoe', 'sneaker', 'boot', 'sandal', 'heel', 'footwear'],
      'accessories': ['watch', 'bag', 'purse', 'hat', 'belt', 'jewelry', 'necklace', 'bracelet'],
      'beauty': ['makeup', 'lipstick', 'foundation', 'mascara', 'perfume', 'skincare'],
      'eyewear': ['glasses', 'sunglasses', 'eyewear'],
    }
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => context.includes(keyword))) {
        return category
      }
    }
    
    return 'general'
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.vtryContent = new VTryContentScript()
  })
} else {
  window.vtryContent = new VTryContentScript()
}

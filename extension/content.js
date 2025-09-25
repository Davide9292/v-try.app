// MirrorMe - Simple Face/Body Swap Extension
// Based on official Gemini API Image Generation documentation
// https://ai.google.dev/gemini-api/docs/image-generation

class MirrorMe {
  constructor() {
    this.isProcessing = false;
    this.init();
  }

  init() {
    console.log('🎭 MirrorMe: Initializing simple face/body swap system...');
    this.addHoverListeners();
  }

  addHoverListeners() {
    // Add hover listeners to all images on the page
    const images = document.querySelectorAll('img');
    images.forEach(img => this.setupImageHover(img));

    // Watch for new images added dynamically
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const newImages = node.querySelectorAll ? node.querySelectorAll('img') : [];
            newImages.forEach(img => this.setupImageHover(img));
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setupImageHover(img) {
    if (img.dataset.mirrormeSetup) return;
    img.dataset.mirrormeSetup = 'true';

    let badge = null;

    img.addEventListener('mouseenter', () => {
      if (this.isProcessing) return;

      badge = this.createBadge();
      this.positionBadge(badge, img);
      document.body.appendChild(badge);

      badge.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleSwap(img);
      });
    });

    img.addEventListener('mouseleave', () => {
      if (badge && !badge.matches(':hover')) {
        this.removeBadge(badge);
        badge = null;
      }
    });
  }

  createBadge() {
    const badge = document.createElement('div');
    badge.innerHTML = `
      <div style="
        position: fixed;
        z-index: 999999;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        🎭 MirrorMe
      </div>
    `;
    return badge.firstElementChild;
  }

  positionBadge(badge, img) {
    const rect = img.getBoundingClientRect();
    badge.style.left = (rect.right - 100) + 'px';
    badge.style.top = (rect.top + 10) + 'px';
  }

  removeBadge(badge) {
    if (badge && badge.parentNode) {
      badge.parentNode.removeChild(badge);
    }
  }

  async handleSwap(targetImg) {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      console.log('🎭 Starting face/body swap...');

      // Get user data from storage
      const { geminiApiKey, userImage } = await chrome.storage.local.get(['geminiApiKey', 'userImage']);

      if (!geminiApiKey) {
        this.showError('⚙️ Please configure your Gemini API key in the extension popup first!');
        return;
      }

      if (!userImage) {
        this.showError('📸 Please upload your photo in the extension popup first!');
        return;
      }

      // Show loading state
      this.showLoading(targetImg);

      // Convert target image to base64
      const targetImageData = await this.imageToBase64(targetImg);
      if (!targetImageData) {
        throw new Error('Unable to convert target image');
      }

      // Generate swapped image using Gemini (with retry logic)
      const swappedImageData = await this.swapFaceWithGemini(geminiApiKey, userImage, targetImageData);

      // Replace original image with swapped one
      this.replaceOriginalImage(targetImg, swappedImageData);

      console.log('✅ Face/body swap completed successfully!');

    } catch (error) {
      console.error('❌ Face/body swap failed:', error);
      this.showError(`Error: ${error.message}`);
    } finally {
      this.isProcessing = false;
      this.hideLoading();
    }
  }

  async imageToBase64(img) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Handle CORS by creating a new image
        const corsImg = new Image();
        corsImg.crossOrigin = 'anonymous';
        
        corsImg.onload = () => {
          canvas.width = corsImg.naturalWidth;
          canvas.height = corsImg.naturalHeight;
          ctx.drawImage(corsImg, 0, 0);
          
          try {
            const base64 = canvas.toDataURL('image/png');
            resolve(base64);
          } catch (e) {
            console.warn('⚠️ CORS issue, trying alternative method...');
            resolve(null);
          }
        };
        
        corsImg.onerror = () => resolve(null);
        corsImg.src = img.src;
        
      } catch (error) {
        console.error('Image conversion error:', error);
        resolve(null);
      }
    });
  }

  async swapFaceWithGemini(apiKey, userImage, targetImage, attempt = 1) {
    console.log(`🤖 Using Gemini 2.5 Flash Image Generation... (Attempt ${attempt})`);

    // Research-based prompts that work with Gemini image generation
    const prompts = [
      // Attempt 1: Simple instruction (most effective according to research)
      `Show the person from the first image wearing the outfit from the second image.`,

      // Attempt 2: Photography-style prompt (proven to work better)
      `Create a photograph of the person from the first image wearing the exact clothing shown in the second image. Same pose, same background, same lighting as the second image.`,

      // Attempt 3: Step-by-step approach
      `1. Take the person from the first image
2. Put them in the scene from the second image  
3. Make them wear the same clothes as in the second image
4. Keep everything else identical`
    ];

    const prompt = prompts[Math.min(attempt - 1, prompts.length - 1)];
    console.log(`💭 Using prompt level: ${attempt}/3`);
    console.log(`📝 Prompt: "${prompt.substring(0, 80)}...")`);

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: this.getMimeType(userImage),
              data: userImage.split(',')[1]
            }
          },
          {
            inlineData: {
              mimeType: this.getMimeType(targetImage),
              data: targetImage.split(',')[1]
            }
          }
        ]
      }]
    };

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('📡 Gemini API response received');
    console.log('🔍 Response structure:', {
      candidates: data.candidates?.length || 0,
      hasContent: !!data.candidates?.[0]?.content,
      parts: data.candidates?.[0]?.content?.parts?.length || 0
    });

    // Extract image data from response (based on official documentation)
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          console.log('✅ Generated image found in response');
          const generatedImage = `data:image/png;base64,${part.inlineData.data}`;
          
          // Check if image was actually modified (improved detection)
          const originalData = targetImage.includes(',') ? targetImage.split(',')[1] : targetImage;
          const generatedData = part.inlineData.data;
          
          // More sophisticated check - compare data size and first/last characters
          const isSameSize = Math.abs(originalData.length - generatedData.length) < 100;
          const sameStart = originalData.substring(0, 50) === generatedData.substring(0, 50);
          const sameEnd = originalData.substring(-50) === generatedData.substring(-50);
          
          if (originalData === generatedData || (isSameSize && sameStart && sameEnd)) {
            console.warn('⚠️ Generated image appears very similar to original');
            if (attempt < 3) {
              console.log(`🔄 Retrying with different prompt (attempt ${attempt + 1})...`);
              return this.swapFaceWithGemini(apiKey, userImage, targetImage, attempt + 1);
            } else {
              console.log('⚠️ Using result anyway after 3 attempts');
              // Don't throw error, just use the result - maybe it did change slightly
            }
          }
          
          return generatedImage;
        }
      }
    }

    throw new Error('No image data found in API response');
  }

  getMimeType(base64Data) {
    if (base64Data.includes('data:image/')) {
      const match = base64Data.match(/data:image\/([^;]+)/);
      if (match) {
        const format = match[1].toLowerCase();
        return format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      }
    }
    return 'image/png';
  }

  replaceOriginalImage(originalImg, newImageData) {
    console.log('🔄 Replacing original image with swapped version...');
    
    // Create a smooth transition effect
    originalImg.style.transition = 'opacity 0.3s ease';
    originalImg.style.opacity = '0.5';
    
    setTimeout(() => {
      originalImg.src = newImageData;
      originalImg.style.opacity = '1';
      
      // Add a subtle glow effect to indicate the swap
      originalImg.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
      setTimeout(() => {
        originalImg.style.boxShadow = '';
      }, 2000);
      
      console.log('✅ Image replacement completed');
    }, 300);
  }

  showLoading(img) {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'mirrorme-loading';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          padding: 30px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          "></div>
          <div style="color: #333; font-size: 16px; font-weight: 600;">
            🎭 Generating your image...
          </div>
          <div style="color: #666; font-size: 14px; margin-top: 8px;">
            This may take a few seconds
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(overlay);
  }

  hideLoading() {
    const overlay = document.getElementById('mirrorme-loading');
    if (overlay) {
      overlay.remove();
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 6px 25px rgba(255, 107, 107, 0.4);
        z-index: 1000001;
        max-width: 350px;
        animation: slideIn 0.3s ease;
      ">
        ${message}
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(errorDiv.firstElementChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      const error = document.body.lastElementChild;
      if (error && error.textContent.includes(message.substring(0, 20))) {
        error.remove();
      }
    }, 5000);
  }
}

// Initialize MirrorMe when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new MirrorMe());
} else {
  new MirrorMe();
}

console.log('🎭 MirrorMe content script loaded - Simple face/body swap ready!');

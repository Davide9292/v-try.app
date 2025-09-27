// Google Gemini AI Service - Nano Banana Image Generation
// Using the official Google Gemini API

export interface GeminiGenerationRequest {
  type: 'image' | 'video'
  userFaceImage: string
  userBodyImage: string
  targetImage: string
  prompt?: string
  style: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
  parameters?: {
    width?: number
    height?: number
  }
}

export interface GeminiGenerationResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  error?: string
  processingTime?: number
  cost?: number
  quality?: number
}

export class GeminiAIService {
  private apiKey: string
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Generate an AI try-on image using Gemini 2.5 Flash Image Preview (Nano Banana)
   */
  async generateImage(request: GeminiGenerationRequest): Promise<GeminiGenerationResponse> {
    try {
      console.log('🎨 Starting Gemini AI image generation...')
      
      // Create a detailed prompt for virtual try-on
      const tryOnPrompt = this.createTryOnPrompt(request)
      console.log('📝 Generated prompt:', tryOnPrompt)
      
      // Convert images to base64 format for Gemini API
      console.log('🔄 Converting images to base64...')
      const userFaceBase64 = await this.extractBase64Data(request.userFaceImage)
      const userBodyBase64 = await this.extractBase64Data(request.userBodyImage)
      const targetBase64 = await this.extractBase64Data(request.targetImage)
      
      console.log('👤 User face image converted, size:', userFaceBase64.length, 'chars')
      console.log('🏃 User body image converted, size:', userBodyBase64.length, 'chars')
      console.log('📸 Product image converted, size:', targetBase64.length, 'chars')
      
      // Prepare the request payload following Gemini documentation format exactly
      const contents = [
        { text: tryOnPrompt },
        // Image 1: User's face
        {
          inlineData: {
            mimeType: this.getMimeType(request.userFaceImage),
            data: userFaceBase64
          }
        },
        // Image 2: User's body  
        {
          inlineData: {
            mimeType: this.getMimeType(request.userBodyImage),
            data: userBodyBase64
          }
        },
        // Image 3: Product photo
        {
          inlineData: {
            mimeType: this.getMimeType(request.targetImage),
            data: targetBase64
          }
        }
      ]

      console.log('📡 Making Gemini API request...')
      console.log('🔑 Using API key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET')
      console.log('📊 Request payload size:', JSON.stringify({ contents }).length, 'bytes')
      console.log('🖼️ User image type:', this.getMimeType(request.userFaceImage))
      console.log('🛍️ Target image type:', this.getMimeType(request.targetImage))
      
      // Call Gemini API
      const response = await fetch(`${this.baseUrl}/models/gemini-2.5-flash-image-preview:generateContent`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          contents: [{ parts: contents }]
        })
      })
      
      console.log('📡 Gemini API response status:', response.status)
      console.log('📡 Gemini API response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Gemini API error:', response.status, errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Gemini API response received')
      console.log('📄 Response structure:', JSON.stringify(result, null, 2))
      
      // Extract the generated image from the response
      const candidate = (result as any).candidates?.[0]
      if (!candidate) {
        console.error('❌ No candidates in response:', result)
        throw new Error('No candidates returned from Gemini API')
      }
      
      console.log('🎯 Candidate found:', JSON.stringify(candidate, null, 2))

      // Find the image part in the response
      let generatedImageData = null
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          generatedImageData = part.inlineData.data
          break
        }
      }

      if (!generatedImageData) {
        throw new Error('No image data returned from Gemini API')
      }

      // Convert base64 to data URL
      const resultUrl = `data:image/png;base64,${generatedImageData}`
      
      console.log('🖼️ Generated image data length:', generatedImageData.length)
      console.log('✅ Gemini generation completed successfully')

      return {
        jobId: `gemini_${Date.now()}`,
        status: 'completed',
        resultUrl: resultUrl,
        processingTime: 3000, // Gemini is typically very fast
        cost: 0.03, // Estimated cost based on Google pricing
        quality: 0.95, // High quality
      }

    } catch (error) {
      console.error('❌ Gemini AI image generation error:', error)
      throw new Error(`Failed to generate image with Gemini: ${(error as Error).message}`)
    }
  }

  /**
   * Get job status (for Gemini, images are generated synchronously)
   */
  async getJobStatus(jobId: string): Promise<GeminiGenerationResponse> {
    // Gemini generates images synchronously, so if we have a jobId, it's completed
    return {
      jobId,
      status: 'completed',
      resultUrl: undefined, // This should be stored in database
      processingTime: 0,
      cost: 0.03,
      quality: 0.95,
    }
  }

  /**
   * Cancel a generation job (not applicable for synchronous Gemini generation)
   */
  async cancelJob(jobId: string): Promise<boolean> {
    return false // Cannot cancel synchronous operations
  }

  /**
   * Create an ultra-simple prompt following Gemini documentation examples
   */
  private createTryOnPrompt(request: GeminiGenerationRequest): string {
    const styleDescriptions = {
      realistic: 'Make it photorealistic.',
      artistic: 'Make it artistic and stylized.',
      fashion: 'Make it a high-fashion editorial photo.',
      lifestyle: 'Make it natural and casual.'
    };

    const styleDesc = styleDescriptions[request.style] || styleDescriptions.realistic;

    // Focus on face/body replacement while keeping original clothes
    return `Replace the model in the third image with the person from the first two images. Keep the original clothes, pose, background and lighting from the third image exactly the same. Only change the face and body shape, but keep everything else identical. ${styleDesc}`;
  }

  /**
   * Convert image URL or data URL to base64 data
   */
  private async extractBase64Data(imageData: string): Promise<string> {
    if (imageData.startsWith('data:')) {
      // Extract base64 part from data URL
      return imageData.split(',')[1]
    } else if (imageData.startsWith('http')) {
      // Fetch image from URL and convert to base64
      console.log('🔄 Fetching image from URL:', imageData)
      try {
        const response = await fetch(imageData)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        console.log('✅ Image converted to base64, length:', base64.length)
        return base64
      } catch (error) {
        console.error('❌ Failed to fetch/convert image:', error)
        throw new Error(`Failed to convert image URL to base64: ${error.message}`)
      }
    }
    // Assume it's already base64
    return imageData
  }

  /**
   * Get MIME type from image data or URL
   */
  private getMimeType(imageData: string): string {
    if (imageData.startsWith('data:image/')) {
      const mimeMatch = imageData.match(/data:(image\/[^;]+)/)
      return mimeMatch ? mimeMatch[1] : 'image/jpeg'
    } else if (imageData.includes('.png')) {
      return 'image/png'
    } else if (imageData.includes('.gif')) {
      return 'image/gif'
    } else if (imageData.includes('.webp')) {
      return 'image/webp'
    }
    // Default to JPEG if we can't determine
    return 'image/jpeg'
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'x-goog-api-key': this.apiKey,
        },
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities() {
    return {
      'gemini-2.5-flash-image-preview': {
        type: 'image',
        maxWidth: 1024,
        maxHeight: 1024,
        supportedStyles: ['realistic', 'artistic', 'fashion', 'lifestyle'],
        avgProcessingTime: 3000, // 3 seconds (synchronous)
        cost: 0.03, // $30 per 1M tokens, ~1290 tokens per image
        features: [
          'text-to-image',
          'image-editing',
          'multi-image-composition',
          'iterative-refinement',
          'high-fidelity-text-rendering'
        ]
      }
    }
  }
}

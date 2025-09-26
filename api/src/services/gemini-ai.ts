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
      
      // Prepare the request payload with user and target images
      const contents = [
        {
          parts: [
            { text: tryOnPrompt },
            // User's face/body image
            {
              inlineData: {
                mimeType: this.getMimeType(request.userFaceImage),
                data: this.extractBase64Data(request.userFaceImage)
              }
            },
            // Target product image
            {
              inlineData: {
                mimeType: this.getMimeType(request.targetImage),
                data: this.extractBase64Data(request.targetImage)
              }
            }
          ]
        }
      ]

      console.log('📡 Making Gemini API request...')
      
      // Call Gemini API
      const response = await fetch(`${this.baseUrl}/models/gemini-2.5-flash-image-preview:generateContent`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Gemini API error:', response.status, errorText)
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Gemini API response received')
      
      // Extract the generated image from the response
      const candidate = result.candidates?.[0]
      if (!candidate) {
        throw new Error('No candidates returned from Gemini API')
      }

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
   * Create a detailed prompt for virtual try-on using Gemini
   */
  private createTryOnPrompt(request: GeminiGenerationRequest): string {
    const styleDescriptions = {
      realistic: 'photorealistic, high-quality, detailed, professional photography',
      artistic: 'artistic style, creative interpretation, stylized',
      fashion: 'fashion photography style, professional studio lighting, magazine quality',
      lifestyle: 'lifestyle photography, natural setting, casual atmosphere'
    }

    const styleDesc = styleDescriptions[request.style] || styleDescriptions.realistic

    // Create a comprehensive prompt for virtual try-on using Gemini's capabilities
    return `Create a professional virtual try-on image by combining these two images:

1. Take the person from the first image (user photo)
2. Take the clothing item from the second image (product photo)  
3. Generate a new image showing the person wearing the clothing item

Requirements:
- The person should be wearing the exact clothing item from the product image
- Maintain the person's appearance, face, body shape, and pose from the original photo
- The clothing should fit naturally and realistically on the person's body
- Ensure proper lighting, shadows, and fabric texture to make it look authentic
- Style: ${styleDesc}
- The final result should look like a professional photo of the person actually wearing this clothing item
- Pay attention to proper fit, draping, and how the fabric would naturally fall on the person's body
- Maintain consistent lighting and perspective between the person and the clothing

${request.prompt ? `Additional instructions: ${request.prompt}` : ''}

Generate a high-quality, realistic image that seamlessly combines the person and the clothing item.`
  }

  /**
   * Extract base64 data from data URL or return as-is if already base64
   */
  private extractBase64Data(imageData: string): string {
    if (imageData.startsWith('data:')) {
      // Extract base64 part from data URL
      return imageData.split(',')[1]
    }
    return imageData
  }

  /**
   * Get MIME type from image data
   */
  private getMimeType(imageData: string): string {
    if (imageData.startsWith('data:image/')) {
      const mimeMatch = imageData.match(/data:(image\/[^;]+)/)
      return mimeMatch ? mimeMatch[1] : 'image/jpeg'
    }
    // Default to JPEG for base64 without data URL
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

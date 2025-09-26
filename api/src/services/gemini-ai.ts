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
      const targetBase64 = await this.extractBase64Data(request.targetImage)
      
      console.log('🖼️ User face image converted, size:', userFaceBase64.length, 'chars')
      console.log('🛍️ Target image converted, size:', targetBase64.length, 'chars')
      
      // Prepare the request payload with user and target images
      const contents = [
        {
          parts: [
            { text: tryOnPrompt },
            // User's face/body image
            {
              inlineData: {
                mimeType: this.getMimeType(request.userFaceImage),
                data: userFaceBase64
              }
            },
            // Target product image
            {
              inlineData: {
                mimeType: this.getMimeType(request.targetImage),
                data: targetBase64
              }
            }
          ]
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
        body: JSON.stringify({ contents })
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

    // Model replacement prompt - replace the model in the product image with the user
    return `Create a model replacement image by replacing the model in the product photo with the person from the user photo.

TASK: Replace the model/person in the second image (product photo) with the person from the first image (user photo).

STEP-BY-STEP INSTRUCTIONS:
1. Take the complete scene from the product image - background, lighting, setting, pose, clothing, and composition
2. Replace ONLY the model's face, hair, and body with the person from the user image
3. Keep everything else from the product image exactly the same - pose, clothes, background, lighting, shadows

CRITICAL REQUIREMENTS:
- Use the EXACT scene, background, and setting from the product image
- Use the EXACT clothing, colors, patterns, and styling from the product image  
- Use the EXACT pose, body position, and composition from the product image
- Replace ONLY the model's physical appearance (face, hair, skin tone, body shape) with the user's
- Maintain the same lighting direction, shadows, and photographic style as the product image
- Adjust the clothing fit naturally to the user's body proportions while keeping the same style
- Preserve all product image details: background elements, props, studio setup, etc.

PHOTOGRAPHIC CONSISTENCY:
- Match the exact camera angle and perspective from the product image
- Maintain the same lighting setup and shadow patterns
- Keep the same color grading and photographic style: ${styleDesc}
- Preserve the same image quality and professional studio aesthetic

RESULT GOAL:
The final image should look like the user was the original model in the product photoshoot. Someone should not be able to tell that any replacement was made - it should appear as if the user was always the model in that exact scene.

${request.prompt ? `Additional context: ${request.prompt}` : ''}`
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

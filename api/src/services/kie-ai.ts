// KIE AI Service - Enterprise Grade Integration
// Using built-in fetch (Node.js 18+)

export interface KIEAIGenerationRequest {
  type: 'image' | 'video'
  userFaceImage: string
  userBodyImage: string
  targetImage: string
  prompt?: string
  style: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
  parameters?: {
    width?: number
    height?: number
    duration?: number // for video
    motionType?: 'subtle' | 'dynamic' | 'showcase'
  }
}

export interface KIEAIGenerationResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  resultUrl?: string
  thumbnailUrl?: string
  error?: string
  processingTime?: number
  cost?: number
  quality?: number
}

export class KIEAIService {
  private apiKey: string
  private baseUrl: string = 'https://api.kie.ai/api/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Generate an AI try-on image using KIE AI GPT-4O model
   */
  async generateImage(request: KIEAIGenerationRequest): Promise<KIEAIGenerationResponse> {
    try {
      // Create a detailed prompt for virtual try-on
      const tryOnPrompt = this.createTryOnPrompt(request)
      
      const response = await fetch(`${this.baseUrl}/gpt4o-image/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: tryOnPrompt,
          aspectRatio: request.parameters?.width && request.parameters?.height 
            ? `${request.parameters.width}:${request.parameters.height}`
            : '1:1',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`KIE AI API error: ${response.status} - ${error}`)
      }

      const result = await response.json() as any
      console.log('🎨 KIE AI Response:', result)

      // KIE AI returns the image URL directly in the response
      const imageUrl = result.url || result.image_url || result.data?.url
      
      if (!imageUrl) {
        console.error('❌ No image URL in KIE AI response:', result)
        throw new Error('No image URL returned from KIE AI')
      }

      return {
        jobId: `kie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed', // KIE AI returns completed images immediately
        resultUrl: imageUrl,
        processingTime: 3000, // Immediate generation
        cost: 0.05, // Estimated cost
        quality: 0.9,
      }

    } catch (error) {
      console.error('❌ KIE AI image generation error:', error)
      throw new Error(`Failed to generate image: ${(error as Error).message}`)
    }
  }

  /**
   * Generate an AI try-on video using Veo3 model
   */
  async generateVideo(request: KIEAIGenerationRequest): Promise<KIEAIGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate/video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'veo3',
          inputs: {
            face_image: request.userFaceImage,
            body_image: request.userBodyImage,
            target_image: request.targetImage,
            prompt: request.prompt || 'smooth virtual try-on transition',
            style: request.style,
          },
          parameters: {
            width: request.parameters?.width || 512,
            height: request.parameters?.height || 768,
            duration: request.parameters?.duration || 3,
            motion_type: request.parameters?.motionType || 'subtle',
            fps: 24,
            quality: 'high',
            safety_check: true,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`KIE AI API error: ${response.status} - ${error}`)
      }

      const result = await response.json() as any

      return {
        jobId: result.job_id,
        status: this.mapStatus(result.status),
        resultUrl: result.output?.video_url,
        thumbnailUrl: result.output?.thumbnail_url,
        processingTime: result.processing_time,
        cost: this.calculateVideoCost(request.parameters?.duration || 3),
        quality: result.output?.quality_score,
      }

    } catch (error) {
      console.error('KIE AI video generation error:', error)
      throw new Error(`Failed to generate video: ${error.message}`)
    }
  }

  /**
   * Check the status of a generation job
   */
  async getJobStatus(jobId: string): Promise<KIEAIGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`KIE AI API error: ${response.status} - ${error}`)
      }

      const result = await response.json() as any

      return {
        jobId: result.job_id,
        status: this.mapStatus(result.status),
        resultUrl: result.output?.image_url || result.output?.video_url,
        thumbnailUrl: result.output?.thumbnail_url,
        error: result.error,
        processingTime: result.processing_time,
        cost: result.cost,
        quality: result.output?.quality_score,
      }

    } catch (error) {
      console.error('KIE AI job status error:', error)
      throw new Error(`Failed to get job status: ${error.message}`)
    }
  }

  /**
   * Cancel a generation job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      return response.ok

    } catch (error) {
      console.error('KIE AI job cancellation error:', error)
      return false
    }
  }

  /**
   * Get account usage and limits
   */
  async getAccountUsage(): Promise<{
    imagesGenerated: number
    videosGenerated: number
    totalCost: number
    remainingCredits: number
    planLimits: {
      monthlyImages: number
      monthlyVideos: number
    }
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/account/usage`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get account usage: ${response.status}`)
      }

      const result = await response.json() as any

      return {
        imagesGenerated: result.usage.images_generated,
        videosGenerated: result.usage.videos_generated,
        totalCost: result.usage.total_cost,
        remainingCredits: result.credits.remaining,
        planLimits: {
          monthlyImages: result.limits.monthly_images,
          monthlyVideos: result.limits.monthly_videos,
        },
      }

    } catch (error) {
      console.error('KIE AI account usage error:', error)
      throw new Error(`Failed to get account usage: ${error.message}`)
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      return response.ok

    } catch (error) {
      return false
    }
  }

  /**
   * Map KIE AI status to our internal status
   */
  private mapStatus(kieStatus: string): 'queued' | 'processing' | 'completed' | 'failed' {
    switch (kieStatus.toLowerCase()) {
      case 'pending':
      case 'queued':
        return 'queued'
      case 'processing':
      case 'running':
        return 'processing'
      case 'completed':
      case 'succeeded':
        return 'completed'
      case 'failed':
      case 'error':
      default:
        return 'failed'
    }
  }

  /**
   * Calculate cost for image generation
   */
  private calculateImageCost(): number {
    return 0.05 // $0.05 per image
  }

  /**
   * Calculate cost for video generation
   */
  private calculateVideoCost(duration: number): number {
    return 0.25 * Math.ceil(duration / 3) // $0.25 per 3-second segment
  }

  /**
   * Create a detailed prompt for virtual try-on using KIE AI
   */
  private createTryOnPrompt(request: KIEAIGenerationRequest): string {
    const styleDescriptions = {
      realistic: 'photorealistic, high-quality, detailed',
      artistic: 'artistic style, creative interpretation',
      fashion: 'fashion photography style, professional lighting',
      lifestyle: 'lifestyle photography, natural setting'
    }

    const typeDescriptions = {
      image: 'a high-quality photograph',
      video: 'a high-quality image suitable for video'
    }

    const styleDesc = styleDescriptions[request.style] || styleDescriptions.realistic
    const typeDesc = typeDescriptions[request.type] || typeDescriptions.image

    // Create a comprehensive prompt for virtual try-on
    return `Create ${typeDesc} showing a person wearing the clothing item from the product image. 
    Style: ${styleDesc}. 
    The person should be wearing the exact clothing item shown in the product image, 
    with proper fit and realistic appearance. 
    Ensure the clothing looks natural and well-fitted on the person.
    High quality, professional photography style, good lighting, realistic textures.
    ${request.prompt || ''}`
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities() {
    return {
      'nano-banana': {
        type: 'image',
        maxWidth: 2048,
        maxHeight: 2048,
        supportedStyles: ['realistic', 'artistic', 'fashion', 'lifestyle'],
        avgProcessingTime: 15000, // 15 seconds
        cost: 0.05,
      },
      'veo3': {
        type: 'video',
        maxWidth: 1024,
        maxHeight: 1024,
        maxDuration: 10,
        supportedStyles: ['realistic', 'artistic', 'fashion', 'lifestyle'],
        supportedMotionTypes: ['subtle', 'dynamic', 'showcase'],
        avgProcessingTime: 60000, // 60 seconds
        costPerSegment: 0.25,
      },
    }
  }
}

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
   * Generate an AI try-on image using Nano Banana Edit model
   */
  async generateImage(request: KIEAIGenerationRequest): Promise<KIEAIGenerationResponse> {
    try {
      // Create a detailed prompt for virtual try-on
      const tryOnPrompt = this.createTryOnPrompt(request)
      
      // Prepare image URLs - we'll use the user's face/body image and target image
      const imageUrls = []
      if (request.userFaceImage) imageUrls.push(request.userFaceImage)
      if (request.userBodyImage && request.userBodyImage !== request.userFaceImage) {
        imageUrls.push(request.userBodyImage)
      }
      if (request.targetImage) imageUrls.push(request.targetImage)
      
      // Limit to 5 images as per API spec
      const finalImageUrls = imageUrls.slice(0, 5)
      
      console.log('🎨 Creating KIE AI task with:', {
        prompt: tryOnPrompt,
        imageCount: finalImageUrls.length,
        model: 'google/nano-banana-edit'
      })
      
      // Step 1: Create the generation task
      const createResponse = await fetch(`${this.baseUrl}/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/nano-banana-edit',
          input: {
            prompt: tryOnPrompt,
            image_urls: finalImageUrls,
            output_format: 'png',
            image_size: 'auto'
          }
        }),
      })

      if (!createResponse.ok) {
        const error = await createResponse.text()
        throw new Error(`KIE AI API error: ${createResponse.status} - ${error}`)
      }

      const createResult = await createResponse.json() as any
      console.log('🎨 KIE AI Task Created:', JSON.stringify(createResult, null, 2))
      
      if (createResult.code !== 200 || !createResult.data?.taskId) {
        throw new Error(`Failed to create KIE AI task: ${createResult.msg || 'Unknown error'}`)
      }

      const taskId = createResult.data.taskId
      console.log('✅ KIE AI Task ID:', taskId)

      return {
        jobId: taskId,
        status: 'queued', // Task starts as queued
        resultUrl: undefined, // Will be available after completion
        processingTime: undefined,
        cost: 0.05, // Estimated cost
        quality: undefined,
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
   * Check the status of a generation job using correct KIE AI endpoint
   */
  async getJobStatus(taskId: string): Promise<KIEAIGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/recordInfo?taskId=${taskId}`, {
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
      console.log('📊 KIE AI Status Response:', JSON.stringify(result, null, 2))

      if (result.code !== 200) {
        throw new Error(`KIE AI status check failed: ${result.msg || 'Unknown error'}`)
      }

      const data = result.data
      const state = data.state // waiting, success, fail
      
      // Parse resultJson if available
      let resultUrls = []
      if (data.resultJson) {
        try {
          const resultData = JSON.parse(data.resultJson)
          resultUrls = resultData.resultUrls || []
        } catch (e) {
          console.warn('Failed to parse resultJson:', data.resultJson)
        }
      }

      // Map KIE AI states to our status format
      let mappedStatus = 'queued'
      if (state === 'waiting') mappedStatus = 'processing'
      else if (state === 'success') mappedStatus = 'completed'
      else if (state === 'fail') mappedStatus = 'failed'

      return {
        jobId: taskId,
        status: mappedStatus,
        resultUrl: resultUrls[0] || undefined, // First result URL
        processingTime: data.costTime,
        cost: 0.05, // Estimated cost
        quality: state === 'success' ? 0.9 : undefined,
        error: data.failMsg || undefined,
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
   * Create a detailed prompt for virtual try-on using Nano Banana Edit model
   */
  private createTryOnPrompt(request: KIEAIGenerationRequest): string {
    const styleDescriptions = {
      realistic: 'photorealistic, high-quality, detailed, professional photography',
      artistic: 'artistic style, creative interpretation, stylized',
      fashion: 'fashion photography style, professional studio lighting, magazine quality',
      lifestyle: 'lifestyle photography, natural setting, casual atmosphere'
    }

    const styleDesc = styleDescriptions[request.style] || styleDescriptions.realistic

    // Create a comprehensive prompt for virtual try-on using the Nano Banana Edit model
    // This model works by editing the input images based on the prompt
    return `Transform the person in the image to be wearing the clothing item shown in the product image. 
    Make it look like a professional virtual try-on where the person is wearing the exact clothing item.
    The clothing should fit naturally and realistically on the person's body.
    Maintain the person's appearance and pose while seamlessly integrating the new clothing.
    Style: ${styleDesc}.
    Ensure proper lighting, shadows, and fabric texture to make it look authentic.
    The final result should look like the person is actually wearing this clothing item.
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

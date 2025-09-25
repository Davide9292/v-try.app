// V-Try.app KIE AI Integration Service

import { 
  KIEAIRequest, 
  KIEAIResponse, 
  GenerationStatus,
  AIGenerationStyle 
} from '../../shared/types'
import { KIE_AI_CONFIG, ERROR_CODES } from '../../shared/constants'

export class KIEAIService {
  private baseUrl: string
  private apiKey: string

  constructor(apiKey: string) {
    this.baseUrl = KIE_AI_CONFIG.BASE_URL
    this.apiKey = apiKey
  }

  /**
   * Generate AI image using Nano Banana model
   */
  async generateImage(request: KIEAIRequest): Promise<KIEAIResponse> {
    try {
      const payload = {
        model: KIE_AI_CONFIG.MODELS.NANO_BANANA,
        prompt: this.buildPrompt(request),
        images: {
          user_face: request.userFaceImage,
          user_body: request.userBodyImage,
          target_product: request.targetImage,
        },
        parameters: {
          style: request.style,
          width: request.parameters?.width || 1024,
          height: request.parameters?.height || 1024,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          strength: 0.8,
          ...request.parameters,
        },
      }

      const response = await fetch(`${this.baseUrl}/generate/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client': 'v-try-app',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const result = await response.json()
      
      return {
        jobId: result.job_id,
        status: this.mapStatus(result.status),
        resultUrl: result.result_url,
        thumbnailUrl: result.thumbnail_url,
        processingTime: result.processing_time,
        cost: result.cost,
        metadata: {
          model: result.model,
          version: result.version,
          parameters: result.parameters,
        },
      }
    } catch (error) {
      console.error('Image generation failed:', error)
      throw error
    }
  }

  /**
   * Generate AI video using Veo3 model
   */
  async generateVideo(request: KIEAIRequest): Promise<KIEAIResponse> {
    try {
      // First generate the image
      const imageResult = await this.generateImage({
        ...request,
        type: 'image',
      })

      if (imageResult.status !== 'completed' || !imageResult.resultUrl) {
        throw new Error('Failed to generate base image for video')
      }

      // Then create video from the generated image
      const videoPayload = {
        model: KIE_AI_CONFIG.MODELS.VEO3,
        prompt: this.buildVideoPrompt(request),
        source_image: imageResult.resultUrl,
        parameters: {
          duration: request.parameters?.duration || 3,
          motion_type: request.parameters?.motionType || 'subtle',
          fps: 24,
          width: request.parameters?.width || 1024,
          height: request.parameters?.height || 1024,
        },
      }

      const response = await fetch(`${this.baseUrl}/generate/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client': 'v-try-app',
        },
        body: JSON.stringify(videoPayload),
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const result = await response.json()
      
      return {
        jobId: result.job_id,
        status: this.mapStatus(result.status),
        resultUrl: result.result_url,
        thumbnailUrl: result.thumbnail_url,
        processingTime: result.processing_time,
        cost: (imageResult.cost || 0) + (result.cost || 0),
        metadata: {
          model: result.model,
          version: result.version,
          parameters: result.parameters,
          baseImageJobId: imageResult.jobId,
        },
      }
    } catch (error) {
      console.error('Video generation failed:', error)
      throw error
    }
  }

  /**
   * Check generation status
   */
  async getGenerationStatus(jobId: string): Promise<KIEAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client': 'v-try-app',
        },
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      const result = await response.json()
      
      return {
        jobId: result.job_id,
        status: this.mapStatus(result.status),
        resultUrl: result.result_url,
        thumbnailUrl: result.thumbnail_url,
        processingTime: result.processing_time,
        cost: result.cost,
        error: result.error,
        metadata: {
          model: result.model,
          version: result.version,
          parameters: result.parameters,
        },
      }
    } catch (error) {
      console.error('Status check failed:', error)
      throw error
    }
  }

  /**
   * Cancel ongoing generation
   */
  async cancelGeneration(jobId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client': 'v-try-app',
        },
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }
    } catch (error) {
      console.error('Cancellation failed:', error)
      throw error
    }
  }

  /**
   * Get available models and their capabilities
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Client': 'v-try-app',
        },
      })

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response))
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get models:', error)
      throw error
    }
  }

  /**
   * Build prompt for image generation
   */
  private buildPrompt(request: KIEAIRequest): string {
    const basePrompt = `Virtual try-on: Show the person from the user images wearing the clothing/product from the target image.`
    
    const stylePrompts = {
      realistic: 'Photorealistic, natural lighting, high quality, detailed',
      artistic: 'Artistic style, creative interpretation, stylized rendering',
      fashion: 'Fashion photography, professional lighting, editorial style, high fashion',
      lifestyle: 'Lifestyle photography, natural setting, casual atmosphere, everyday style',
    }

    const styleAddition = stylePrompts[request.style] || stylePrompts.realistic
    
    return `${basePrompt} ${styleAddition}. ${request.prompt || ''}`
  }

  /**
   * Build prompt for video generation
   */
  private buildVideoPrompt(request: KIEAIRequest): string {
    const motionPrompts = {
      subtle: 'Gentle movements, natural breathing, minimal pose changes',
      dynamic: 'More pronounced movements, slight pose variations, dynamic presentation',
      showcase: 'Fashion runway style presentation, confident movements, showcase poses',
    }

    const motionType = request.parameters?.motionType || 'subtle'
    const motionAddition = motionPrompts[motionType] || motionPrompts.subtle

    return `${this.buildPrompt(request)} ${motionAddition}. Smooth video transitions, high quality motion.`
  }

  /**
   * Map KIE AI status to our internal status
   */
  private mapStatus(kieStatus: string): GenerationStatus {
    const statusMap: Record<string, GenerationStatus> = {
      'pending': 'queued',
      'queued': 'queued',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
    }

    return statusMap[kieStatus] || 'queued'
  }

  /**
   * Handle API error responses
   */
  private async handleErrorResponse(response: Response): Promise<string> {
    try {
      const errorData = await response.json()
      
      // Map KIE AI errors to our error codes
      if (errorData.error?.code === 'quota_exceeded') {
        return ERROR_CODES.AI.QUOTA_EXCEEDED
      }
      if (errorData.error?.code === 'invalid_input') {
        return ERROR_CODES.AI.INVALID_INPUT
      }
      if (errorData.error?.code === 'model_unavailable') {
        return ERROR_CODES.AI.MODEL_UNAVAILABLE
      }
      
      return errorData.error?.message || `KIE AI Error: ${response.status}`
    } catch {
      return `HTTP ${response.status}: ${response.statusText}`
    }
  }

  /**
   * Validate image before sending to KIE AI
   */
  validateImage(imageData: string, type: 'face' | 'body' | 'product'): boolean {
    try {
      // Check if it's a valid base64 image
      if (!imageData.startsWith('data:image/')) {
        return false
      }

      // Check size
      const sizeInBytes = (imageData.length * 3) / 4
      if (sizeInBytes > KIE_AI_CONFIG.MAX_IMAGE_SIZE) {
        return false
      }

      // Extract format
      const format = imageData.split(';')[0].split('/')[1]
      if (!KIE_AI_CONFIG.SUPPORTED_FORMATS.IMAGE.includes(format)) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Estimate generation cost
   */
  estimateCost(type: 'image' | 'video', style: AIGenerationStyle): number {
    const baseCosts = {
      image: {
        realistic: 0.05,
        artistic: 0.04,
        fashion: 0.06,
        lifestyle: 0.04,
      },
      video: {
        realistic: 0.25,
        artistic: 0.20,
        fashion: 0.30,
        lifestyle: 0.20,
      },
    }

    return baseCosts[type][style] || baseCosts[type].realistic
  }
}

// Singleton instance
export const kieAIService = new KIEAIService(
  process.env.KIE_AI_API_KEY || ''
)

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
      
      // Resolve image sources and MIME types robustly
      console.log('🔄 Converting images to base64 with accurate MIME types...')
      const [userFace, userBody, target] = await Promise.all([
        this.resolveImage(request.userFaceImage),
        this.resolveImage(request.userBodyImage),
        this.resolveImage(request.targetImage),
      ])

      console.log('👤 Image 1 (User face) converted, size:', userFace.base64.length, 'chars')
      console.log('🏃 Image 2 (User body) converted, size:', userBody.base64.length, 'chars')
      console.log('📸 Image 3 (Product/Model) converted, size:', target.base64.length, 'chars')
      console.log('🖼️ Detected types:', { face: userFace.mimeType, body: userBody.mimeType, target: target.mimeType })
      console.log('🎯 Image order: 1=Face, 2=Body, 3=Target (CRITICAL)')

      // Detect whether the target image already contains a human model to choose the right instruction
      const hasHumanInTarget = await this.detectTargetHasHumanModel(target.base64, target.mimeType)
      console.log('🕵️ Target contains human model?', hasHumanInTarget)

      // Create a detailed prompt for virtual try-on
      const tryOnPrompt = this.createTryOnPrompt(request, hasHumanInTarget)
      console.log('📝 Generated prompt:', tryOnPrompt)

      // Prepare role-labeled parts to disambiguate images for Gemini
      const rolePriming = `There are three images provided in order. FIRST=USER_FACE photo, SECOND=USER_BODY photo, THIRD=TARGET_PRODUCT_SCENE.`
      const contents = [
        { text: rolePriming },
        { text: tryOnPrompt },
        { text: 'FIRST IMAGE: USER_FACE' },
        { inlineData: { mimeType: userFace.mimeType, data: userFace.base64 } },
        { text: 'SECOND IMAGE: USER_BODY' },
        { inlineData: { mimeType: userBody.mimeType, data: userBody.base64 } },
        { text: 'THIRD IMAGE: TARGET_PRODUCT_SCENE' },
        { inlineData: { mimeType: target.mimeType, data: target.base64 } },
      ]

      const payload = {
        contents: [{ parts: contents }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
        }
      }

      console.log('📡 Making Gemini API request...')
      console.log('🔑 Using API key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET')
      console.log('📊 Request payload size:', JSON.stringify(payload).length, 'bytes')

      const attemptOnce = async (strict: boolean) => {
        const strictHint = strict ? 'IMPORTANT: Never return the THIRD image unchanged. Ensure the subject clearly becomes the USER. If you cannot replace, regenerate until it is replaced.' : ''
        const attemptPayload = strict ? {
          ...payload,
          contents: [{ parts: [{ text: rolePriming }, { text: strictHint + ' ' + tryOnPrompt }, { text: 'FIRST IMAGE: USER_FACE' }, { inlineData: { mimeType: userFace.mimeType, data: userFace.base64 } }, { text: 'SECOND IMAGE: USER_BODY' }, { inlineData: { mimeType: userBody.mimeType, data: userBody.base64 } }, { text: 'THIRD IMAGE: TARGET_PRODUCT_SCENE' }, { inlineData: { mimeType: target.mimeType, data: target.base64 } }] }]
        } : payload

        const response = await fetch(`${this.baseUrl}/models/gemini-2.5-flash-image-preview:generateContent`, {
          method: 'POST',
          headers: {
            'x-goog-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attemptPayload)
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

        const candidate = (result as any).candidates?.[0]
        if (!candidate) {
          console.error('❌ No candidates in response:', result)
          throw new Error('No candidates returned from Gemini API')
        }

        let generatedImageData: string | null = null
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            generatedImageData = part.inlineData.data
            break
          }
        }

        if (!generatedImageData) {
          throw new Error('No image data returned from Gemini API')
        }

        return generatedImageData
      }

      // First attempt (normal)
      let generatedImageData = await attemptOnce(false)

      // If the model appears to have returned the original target unchanged, retry once with stricter instructions
      if (this.isLikelySameImage(generatedImageData, target.base64)) {
        console.warn('⚠️ Generated image appears identical to target. Retrying with stricter instructions...')
        generatedImageData = await attemptOnce(true)
      }

      // Convert base64 to data URL (PNG default)
      const resultUrl = `data:image/png;base64,${generatedImageData}`
      console.log('🖼️ Generated image data length:', generatedImageData.length)
      console.log('✅ Gemini generation completed successfully')

      return {
        jobId: `gemini_${Date.now()}`,
        status: 'completed',
        resultUrl: resultUrl,
        processingTime: 3000,
        cost: 0.03,
        quality: 0.95,
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
  private createTryOnPrompt(request: GeminiGenerationRequest, hasHumanInTarget: boolean): string {
    const styleDescriptions = {
      realistic: 'Make it photorealistic.',
      artistic: 'Make it artistic and stylized.',
      fashion: 'Make it a high-fashion editorial photo.',
      lifestyle: 'Make it natural and casual.'
    };

    const styleDesc = styleDescriptions[request.style] || styleDescriptions.realistic;

    // Two scenarios: target has a model vs. product-only (flat lay, mannequin, packshot)
    if (hasHumanInTarget) {
      return `TASK: Virtual try-on.
Use the FIRST image (USER_FACE) and SECOND image (USER_BODY) to replace the identity of the person in the THIRD image (TARGET_PRODUCT_SCENE).
REQUIREMENTS:
- Replace the face with the user's face and match skin tone and proportions.
- Match the body shape to the user's body while preserving the original pose.
- Do not change the clothing/product, logos, text, pattern, color, fabric, fit, or accessories in the THIRD image.
- Do not change composition, camera angle, background, lighting, reflections, or shadows in the THIRD image.
- Remove the original person's identity; the person must clearly become the user.
CONSTRAINTS:
- No added text, watermarks, or artifacts.
- No extra people or objects.
OUTPUT: One edited image only. ${styleDesc}`
    }

    // Product-only target: compose the user wearing the exact product in a matching style
    return `TASK: Virtual try-on from product-only photo.
Use the FIRST image (USER_FACE) and SECOND image (USER_BODY) to render the user wearing the product shown in the THIRD image (TARGET_PRODUCT_SCENE).
REQUIREMENTS:
- Recreate a natural human model with the user's face and approximate body shape.
- Keep the product pixel-level identity: same garment, same color, pattern, texture, stitching, logos, and graphics.
- Match the product photo's lighting, white balance, and material highlights. Preserve background characteristics (e.g., pure white packshot stays pure white), add realistic contact shadows only if present in the target.
- Choose a neutral pose that showcases the product similar to its orientation in the THIRD image.
CONSTRAINTS:
- No alterations to the product design or text.
- No extra props or busy backgrounds.
OUTPUT: One generated image only. ${styleDesc}`
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
   * Resolve image string (data URL | URL | base64) into { base64, mimeType }
   */
  private async resolveImage(imageData: string): Promise<{ base64: string, mimeType: string }> {
    if (imageData.startsWith('data:image/')) {
      const mimeMatch = imageData.match(/data:(image\/[^;]+)/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
      return { base64: await this.extractBase64Data(imageData), mimeType }
    }

    if (imageData.startsWith('http')) {
      try {
        const resp = await fetch(imageData)
        if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`)
        const contentType = resp.headers.get('content-type') || this.getMimeType(imageData)
        const arrayBuffer = await resp.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        return { base64, mimeType: contentType.startsWith('image/') ? contentType : this.getMimeType(imageData) }
      } catch (error) {
        console.error('❌ resolveImage: failed to fetch target image', error)
        // Fallback using previous extractor and heuristic mime
        const base64 = await this.extractBase64Data(imageData)
        return { base64, mimeType: this.getMimeType(imageData) }
      }
    }

    // raw base64 without data URL
    const b64 = await this.extractBase64Data(imageData)
    // Heuristic mime from magic numbers
    const head = b64.substring(0, 12)
    let mime = 'image/jpeg'
    if (head.startsWith('iVBORw0KGgo')) mime = 'image/png'
    else if (head.startsWith('/9j/')) mime = 'image/jpeg'
    else if (head.startsWith('R0lGOD')) mime = 'image/gif'
    else if (head.startsWith('UklGR')) mime = 'image/webp'
    return { base64: b64, mimeType: mime }
  }

  /**
   * Ask Gemini 1.5 Flash to detect if the target image already contains a human model
   */
  private async detectTargetHasHumanModel(base64: string, mimeType: string): Promise<boolean> {
    try {
      const prompt = 'Answer strictly with yes or no: Does this image contain a visible human person wearing clothing?'
      const payload = {
        contents: [{ parts: [ { text: prompt }, { inlineData: { mimeType, data: base64 } } ] }],
        generationConfig: { temperature: 0 }
      }
      const resp = await fetch(`${this.baseUrl}/models/gemini-1.5-flash:generateContent`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) {
        console.warn('⚠️ detectTargetHasHumanModel: non-OK response', resp.status)
        return true // default to true so we preserve pose/lights when unsure
      }
      const data: any = await resp.json()
      const text = (data?.candidates?.[0]?.content?.parts || [])
        .map((p: any) => p?.text)
        .filter((t: any) => typeof t === 'string' && t.length > 0)
        .join(' ') || ''
      const answer = text.trim().toLowerCase()
      const result = answer.startsWith('y') // yes
      console.log('🧪 Human detection answer:', answer, '=>', result)
      return result
    } catch (e) {
      console.warn('⚠️ detectTargetHasHumanModel failed, assuming true', (e as Error).message)
      return true
    }
  }

  /**
   * Very lightweight check to see if output likely equals target image
   */
  private isLikelySameImage(generatedB64: string, targetB64: string): boolean {
    if (!generatedB64 || !targetB64) return false
    if (generatedB64.length === targetB64.length && generatedB64.substring(0, 64) === targetB64.substring(0, 64)) {
      return true
    }
    const lengthRatio = Math.min(generatedB64.length, targetB64.length) / Math.max(generatedB64.length, targetB64.length)
    const headEqual = generatedB64.substring(0, 24) === targetB64.substring(0, 24)
    return headEqual && lengthRatio > 0.98
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

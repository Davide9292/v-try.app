// Cloudinary Service - Image Storage & Optimization
import { v2 as cloudinary } from 'cloudinary'
import { nanoid } from 'nanoid'
import sharp from 'sharp'

export class CloudinaryService {
  constructor(config: any) {
    cloudinary.config({
      cloud_name: config.cloudinaryCloudName,
      api_key: config.cloudinaryApiKey,
      api_secret: config.cloudinaryApiSecret,
      secure: true,
    })
  }

  /**
   * Upload a base64 image to Cloudinary
   * @param base64Data Base64 encoded image data (with data:image/... prefix)
   * @param folder Folder to organize uploads (e.g., 'faces', 'bodies', 'results')
   * @param userId User ID for organization
   * @returns Promise with upload result including URL and public_id
   */
  async uploadBase64Image(
    base64Data: string, 
    folder: string, 
    userId: string
  ): Promise<{
    url: string
    secureUrl: string
    publicId: string
    width: number
    height: number
    format: string
    bytes: number
  }> {
    try {
      // Generate unique filename
      const filename = `${userId}_${nanoid(10)}`
      
      // Upload to Cloudinary with optimizations
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: `vtry-app/${folder}`,
        public_id: filename,
        resource_type: 'image',
        format: 'auto', // Auto-select best format (WebP, AVIF, etc.)
        quality: 'auto:good', // Auto-optimize quality
        fetch_format: 'auto', // Auto-select best format for delivery
        flags: 'progressive', // Progressive JPEG
        transformation: [
          {
            width: 1024,
            height: 1024,
            crop: 'limit', // Don't upscale, only downscale if needed
            quality: 'auto:good',
          }
        ],
      })

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw new Error(`Failed to upload image: ${error.message}`)
    }
  }

  /**
   * Upload processed buffer to Cloudinary
   * @param buffer Image buffer
   * @param folder Folder to organize uploads
   * @param userId User ID
   * @param options Additional upload options
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    userId: string,
    options: {
      width?: number
      height?: number
      format?: 'jpg' | 'png' | 'webp' | 'auto'
      quality?: number
    } = {}
  ): Promise<{
    url: string
    secureUrl: string
    publicId: string
    width: number
    height: number
    format: string
    bytes: number
  }> {
    try {
      // Process image with Sharp if needed
      let processedBuffer = buffer
      if (options.width || options.height || options.format) {
        let sharpImage = sharp(buffer)
        
        if (options.width || options.height) {
          sharpImage = sharpImage.resize(options.width, options.height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
        }
        
        if (options.format && options.format !== 'auto') {
          sharpImage = sharpImage.toFormat(options.format, {
            quality: options.quality || 85,
          })
        }
        
        processedBuffer = await sharpImage.toBuffer()
      }

      // Convert buffer to base64
      const base64Data = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`
      
      return await this.uploadBase64Image(base64Data, folder, userId)
    } catch (error) {
      console.error('Buffer upload error:', error)
      throw new Error(`Failed to upload buffer: ${error.message}`)
    }
  }

  /**
   * Delete image from Cloudinary
   * @param publicId The public_id returned from upload
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return result.result === 'ok'
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      return false
    }
  }

  /**
   * Delete multiple images
   * @param publicIds Array of public_ids to delete
   */
  async deleteImages(publicIds: string[]): Promise<{ deleted: string[], errors: string[] }> {
    const deleted: string[] = []
    const errors: string[] = []

    for (const publicId of publicIds) {
      try {
        const success = await this.deleteImage(publicId)
        if (success) {
          deleted.push(publicId)
        } else {
          errors.push(publicId)
        }
      } catch (error) {
        errors.push(publicId)
      }
    }

    return { deleted, errors }
  }

  /**
   * Generate optimized URL for existing image
   * @param publicId Image public_id
   * @param transformations Cloudinary transformations
   */
  generateOptimizedUrl(
    publicId: string,
    transformations: {
      width?: number
      height?: number
      crop?: 'fill' | 'fit' | 'scale' | 'limit'
      quality?: 'auto' | number
      format?: 'auto' | 'jpg' | 'png' | 'webp'
      effect?: string
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations,
    })
  }

  /**
   * Get image metadata
   * @param publicId Image public_id
   */
  async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId)
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
      }
    } catch (error) {
      console.error('Get image info error:', error)
      throw new Error(`Failed to get image info: ${error.message}`)
    }
  }

  /**
   * Delete all images for a user (cleanup)
   * @param userId User ID
   */
  async deleteUserFolder(userId: string): Promise<{ deleted: number, errors: number }> {
    try {
      // Search for all user images
      const searchResult = await cloudinary.search
        .expression(`folder:vtry-app/* AND public_id:*${userId}_*`)
        .sort_by('created_at', 'desc')
        .max_results(500)
        .execute()

      if (searchResult.resources.length === 0) {
        return { deleted: 0, errors: 0 }
      }

      const publicIds = searchResult.resources.map(resource => resource.public_id)
      const deleteResult = await this.deleteImages(publicIds)

      return {
        deleted: deleteResult.deleted.length,
        errors: deleteResult.errors.length,
      }
    } catch (error) {
      console.error('Delete user folder error:', error)
      return { deleted: 0, errors: 1 }
    }
  }

  /**
   * Generate upload signature for direct uploads from frontend
   * @param folder Target folder
   * @param userId User ID
   */
  generateUploadSignature(folder: string, userId: string): {
    signature: string
    timestamp: number
    apiKey: string
    cloudName: string
    folder: string
    publicId: string
  } {
    const timestamp = Math.round(new Date().getTime() / 1000)
    const publicId = `${userId}_${nanoid(10)}`
    const fullFolder = `vtry-app/${folder}`

      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder: fullFolder,
          public_id: publicId,
          resource_type: 'image',
          format: 'auto',
          quality: 'auto:good',
        },
        process.env.CLOUDINARY_API_SECRET || ''
      )

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      folder: fullFolder,
      publicId,
    }
  }
}

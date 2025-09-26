// Bull Queue Service - Enterprise Grade Job Processing
import Bull, { Queue, Job } from 'bull'
import { Redis } from 'ioredis'

export interface GenerationJobData {
  userId: string
  type: 'image' | 'video'
  userFaceImage: string
  userBodyImage: string
  targetImage: string
  prompt?: string
  style: 'realistic' | 'artistic' | 'fashion' | 'lifestyle'
  productUrl?: string
  websiteInfo?: {
    domain: string
    title: string
    description?: string
  }
  parameters?: {
    width?: number
    height?: number
    duration?: number
    motionType?: 'subtle' | 'dynamic' | 'showcase'
  }
  deviceInfo?: string
}

export interface GenerationJobResult {
  success: boolean
  resultUrl?: string
  thumbnailUrl?: string
  error?: string
  processingTime: number
  cost: number
  quality?: number
}

export class BullQueueService {
  private generationQueue: Queue<GenerationJobData>
  private redis: Redis

  constructor(redis: Redis) {
    this.redis = redis

    // Initialize generation queue
    this.generationQueue = new Bull<GenerationJobData>('ai-generation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,           // Retry failed jobs up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    })

    this.setupJobProcessors()
    this.setupEventHandlers()
  }

  /**
   * Add a generation job to the queue
   */
  async addGenerationJob(data: GenerationJobData): Promise<Job<GenerationJobData>> {
    const jobOptions: Bull.JobOptions = {
      priority: this.getJobPriority(data.type),
      delay: 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }

    return this.generationQueue.add('generate', data, jobOptions)
  }

  /**
   * Cancel a generation job
   */
  async cancelGenerationJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.generationQueue.getJob(jobId)
      if (job) {
        await job.remove()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to cancel job:', error)
      return false
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{
    status: string
    progress: number
    result?: GenerationJobResult
    error?: string
  } | null> {
    try {
      const job = await this.generationQueue.getJob(jobId)
      if (!job) return null

      const state = await job.getState()
      
      return {
        status: state,
        progress: job.progress() as number,
        result: job.returnvalue,
        error: job.failedReason,
      }
    } catch (error) {
      console.error('Failed to get job status:', error)
      return null
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.generationQueue.getWaiting(),
      this.generationQueue.getActive(),
      this.generationQueue.getCompleted(),
      this.generationQueue.getFailed(),
      this.generationQueue.getDelayed(),
    ])

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    }
  }

  /**
   * Setup job processors
   */
  private setupJobProcessors(): void {
    // Main generation processor
    this.generationQueue.process('generate', 5, async (job: Job<GenerationJobData>) => {
      const { KIEAIService } = await import('./kie-ai')
      const { S3Service } = await import('./s3')
      const { PrismaClient } = await import('@prisma/client')
      
      const kieAI = new KIEAIService(process.env.KIE_AI_API_KEY!)
      const s3 = new S3Service({
        awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        awsS3Bucket: process.env.AWS_S3_BUCKET!,
        awsRegion: process.env.AWS_REGION || 'us-east-1',
      })
      const prisma = new PrismaClient()

      try {
        const startTime = Date.now()
        const data = job.data

        // Update job progress
        await job.progress(10)

        // Create database record
        const tryOnResult = await prisma.tryOnResult.create({
          data: {
            userId: data.userId,
            jobId: job.id.toString(),
            generationType: data.type.toUpperCase() as any,
            status: 'PROCESSING',
            originalImageUrl: data.userFaceImage, // Temporary
            targetImageUrl: data.targetImage,
            productUrl: data.productUrl || '',
            websiteDomain: data.websiteInfo?.domain || '',
            websiteTitle: data.websiteInfo?.title || '',
            aiModel: data.type === 'image' ? 'nano-banana' : 'veo3',
            aiPrompt: data.prompt || 'Virtual try-on',
            aiStyle: data.style.toUpperCase() as any,
            aiParameters: data.parameters || {},
            faceImageUsed: data.userFaceImage,
            bodyImageUsed: data.userBodyImage,
            deviceInfo: { userAgent: data.deviceInfo },
          },
        })

        await job.progress(20)

        // Generate with KIE AI
        let kieResult
        if (data.type === 'image') {
          kieResult = await kieAI.generateImage(data)
        } else {
          kieResult = await kieAI.generateVideo(data)
        }

        await job.progress(50)

        // Poll for completion if still processing
        while (kieResult.status === 'queued' || kieResult.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
          kieResult = await kieAI.getJobStatus(kieResult.jobId)
          await job.progress(Math.min(90, 50 + (Date.now() - startTime) / 1000))
        }

        if (kieResult.status === 'failed') {
          throw new Error(kieResult.error || 'KIE AI generation failed')
        }

        await job.progress(95)

        // Update database with results
        const processingTime = Date.now() - startTime
        await prisma.tryOnResult.update({
          where: { id: tryOnResult.id },
          data: {
            status: 'COMPLETED',
            generatedImageUrl: data.type === 'image' ? kieResult.resultUrl : undefined,
            generatedVideoUrl: data.type === 'video' ? kieResult.resultUrl : undefined,
            thumbnailUrl: kieResult.thumbnailUrl,
            processingTime,
            cost: kieResult.cost || 0,
            quality: kieResult.quality,
          },
        })

        await job.progress(100)

        // Emit WebSocket event (if WebSocket service is available)
        try {
          const { WebSocketService } = await import('./websocket')
          // This would need to be injected properly in a real implementation
          // wsService.emitGenerationUpdate(data.userId, job.id.toString(), 'completed', 100, kieResult.resultUrl)
        } catch (error) {
          console.warn('WebSocket service not available')
        }

        const result: GenerationJobResult = {
          success: true,
          resultUrl: kieResult.resultUrl,
          thumbnailUrl: kieResult.thumbnailUrl,
          processingTime,
          cost: kieResult.cost || 0,
          quality: kieResult.quality,
        }

        await prisma.$disconnect()
        return result

      } catch (error) {
        console.error('Generation job failed:', error)

        // Update database with error
        try {
          const prisma = new PrismaClient()
          await prisma.tryOnResult.update({
            where: { jobId: job.id.toString() },
            data: {
              status: 'FAILED',
              error: error.message,
            },
          })
          await prisma.$disconnect()
        } catch (dbError) {
          console.error('Failed to update database with error:', dbError)
        }

        throw error
      }
    })
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.generationQueue.on('completed', (job: Job, result: GenerationJobResult) => {
      console.log(`✅ Generation job ${job.id} completed successfully`)
    })

    this.generationQueue.on('failed', (job: Job, error: Error) => {
      console.error(`❌ Generation job ${job.id} failed:`, error.message)
    })

    this.generationQueue.on('stalled', (job: Job) => {
      console.warn(`⚠️ Generation job ${job.id} stalled`)
    })

    this.generationQueue.on('progress', (job: Job, progress: number) => {
      console.log(`📊 Generation job ${job.id} progress: ${progress}%`)
    })

    this.generationQueue.on('waiting', (jobId: string) => {
      console.log(`⏳ Generation job ${jobId} is waiting`)
    })

    this.generationQueue.on('active', (job: Job) => {
      console.log(`🚀 Generation job ${job.id} started processing`)
    })
  }

  /**
   * Get job priority based on type and user subscription
   */
  private getJobPriority(type: string, subscription: string = 'FREE'): number {
    const basePriority = type === 'image' ? 10 : 5 // Images have higher priority than videos
    
    switch (subscription) {
      case 'ENTERPRISE':
        return basePriority + 20
      case 'PRO':
        return basePriority + 10
      case 'FREE':
      default:
        return basePriority
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanOldJobs(): Promise<void> {
    try {
      await this.generationQueue.clean(24 * 60 * 60 * 1000, 'completed') // Remove completed jobs older than 24h
      await this.generationQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed') // Remove failed jobs older than 7 days
      console.log('✅ Old jobs cleaned successfully')
    } catch (error) {
      console.error('❌ Failed to clean old jobs:', error)
    }
  }

  /**
   * Gracefully close the queue
   */
  async close(): Promise<void> {
    await this.generationQueue.close()
  }
}

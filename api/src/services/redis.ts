// Redis Service - Caching and Session Management
import type { Redis } from 'ioredis'

export class RedisService {
  private redis: Redis

  constructor(redisClient: Redis) {
    this.redis = redisClient
  }

  // Cache management
  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key)
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value)
      } else {
        await this.redis.set(key, value)
      }
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Redis del error:', error)
      return false
    }
  }

  // JSON cache helpers
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis getJSON error:', error)
      return null
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value)
      return await this.set(key, jsonValue, ttlSeconds)
    } catch (error) {
      console.error('Redis setJSON error:', error)
      return false
    }
  }

  // Session management
  async getSession(sessionId: string): Promise<any | null> {
    return await this.getJSON(`session:${sessionId}`)
  }

  async setSession(sessionId: string, sessionData: any, ttlSeconds: number = 3600): Promise<boolean> {
    return await this.setJSON(`session:${sessionId}`, sessionData, ttlSeconds)
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return await this.del(`session:${sessionId}`)
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean
    remaining: number
    resetAt: Date
  }> {
    try {
      const current = await this.redis.incr(`rate:${key}`)
      
      if (current === 1) {
        await this.redis.expire(`rate:${key}`, windowSeconds)
      }

      const ttl = await this.redis.ttl(`rate:${key}`)
      const resetAt = new Date(Date.now() + (ttl * 1000))

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetAt,
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fail open - allow request if Redis is down
      return {
        allowed: true,
        remaining: limit,
        resetAt: new Date(Date.now() + (windowSeconds * 1000)),
      }
    }
  }

  // User data caching
  async cacheUserProfile(userId: string, profile: any, ttlSeconds: number = 300): Promise<boolean> {
    return await this.setJSON(`user:${userId}`, profile, ttlSeconds)
  }

  async getCachedUserProfile(userId: string): Promise<any | null> {
    return await this.getJSON(`user:${userId}`)
  }

  async invalidateUserCache(userId: string): Promise<boolean> {
    const pattern = `user:${userId}*`
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis cache invalidation error:', error)
      return false
    }
  }

  // Feed caching
  async cacheFeed(userId: string, feedKey: string, feed: any, ttlSeconds: number = 60): Promise<boolean> {
    return await this.setJSON(`feed:${userId}:${feedKey}`, feed, ttlSeconds)
  }

  async getCachedFeed(userId: string, feedKey: string): Promise<any | null> {
    return await this.getJSON(`feed:${userId}:${feedKey}`)
  }

  // Generation job tracking
  async trackGenerationJob(jobId: string, jobData: any, ttlSeconds: number = 3600): Promise<boolean> {
    return await this.setJSON(`job:${jobId}`, jobData, ttlSeconds)
  }

  async getGenerationJob(jobId: string): Promise<any | null> {
    return await this.getJSON(`job:${jobId}`)
  }

  async updateGenerationJobStatus(jobId: string, status: string, result?: any): Promise<boolean> {
    try {
      const job = await this.getGenerationJob(jobId)
      if (!job) return false

      job.status = status
      job.updatedAt = new Date().toISOString()
      
      if (result) {
        job.result = result
      }

      return await this.setJSON(`job:${jobId}`, job, 3600)
    } catch (error) {
      console.error('Redis job update error:', error)
      return false
    }
  }

  // Analytics and metrics
  async incrementMetric(metric: string, value: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(`metric:${metric}`, value)
    } catch (error) {
      console.error('Redis metric increment error:', error)
      return 0
    }
  }

  async getMetric(metric: string): Promise<number> {
    try {
      const value = await this.redis.get(`metric:${metric}`)
      return value ? parseInt(value, 10) : 0
    } catch (error) {
      console.error('Redis metric get error:', error)
      return 0
    }
  }

  // Pub/Sub for real-time updates
  async publish(channel: string, message: any): Promise<boolean> {
    try {
      await this.redis.publish(channel, JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Redis publish error:', error)
      return false
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const response = await this.redis.ping()
      return response === 'PONG'
    } catch (error) {
      console.error('Redis ping error:', error)
      return false
    }
  }

  // Cleanup expired keys
  async cleanup(): Promise<void> {
    try {
      // This is handled automatically by Redis TTL, but we can add custom cleanup logic here
      console.log('Redis cleanup completed')
    } catch (error) {
      console.error('Redis cleanup error:', error)
    }
  }
}

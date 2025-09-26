// WebSocket Service - Real-time Communication
import type { FastifyInstance } from 'fastify'
import type { SocketStream } from '@fastify/websocket'
import type { IncomingMessage } from 'http'

interface WebSocketClient {
  id: string
  userId?: string
  socket: SocketStream
  lastPing: number
  subscriptions: Set<string>
}

interface WebSocketMessage {
  type: string
  data?: any
  timestamp: string
  id?: string
}

export class WebSocketService {
  private fastify: FastifyInstance
  private clients: Map<string, WebSocketClient> = new Map()
  private userConnections: Map<string, Set<string>> = new Map()
  private pingInterval: NodeJS.Timeout
  private cleanupInterval: NodeJS.Timeout

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify
    this.setupCleanupIntervals()
  }

  // Handle new WebSocket connections
  handleConnection(connection: SocketStream, request: IncomingMessage) {
    const clientId = this.generateClientId()
    const client: WebSocketClient = {
      id: clientId,
      socket: connection,
      lastPing: Date.now(),
      subscriptions: new Set(),
    }

    this.clients.set(clientId, client)

    // Set up event handlers
    connection.socket.on('message', (message: Buffer) => {
      this.handleMessage(client, message)
    })

    connection.socket.on('close', () => {
      this.handleDisconnection(client)
    })

    connection.socket.on('error', (error: Error) => {
      this.fastify.log.error('WebSocket error:', error)
      this.handleDisconnection(client)
    })

    // Send welcome message
    this.sendToClient(client, {
      type: 'connected',
      data: { clientId },
      timestamp: new Date().toISOString(),
    })

    this.fastify.log.info(`WebSocket client connected: ${clientId}`)
  }

  // Handle incoming messages from clients
  private handleMessage(client: WebSocketClient, message: Buffer) {
    try {
      const data = JSON.parse(message.toString()) as WebSocketMessage

      switch (data.type) {
        case 'authenticate':
          this.handleAuthentication(client, data.data)
          break

        case 'subscribe':
          this.handleSubscription(client, data.data)
          break

        case 'unsubscribe':
          this.handleUnsubscription(client, data.data)
          break

        case 'ping':
          this.handlePing(client)
          break

        case 'generation_status_request':
          this.handleGenerationStatusRequest(client, data.data)
          break

        default:
          this.fastify.log.warn(`Unknown message type: ${data.type}`)
      }
    } catch (error) {
      this.fastify.log.error('Error handling WebSocket message:', error)
      this.sendError(client, 'Invalid message format')
    }
  }

  // Handle client authentication
  private async handleAuthentication(client: WebSocketClient, authData: any) {
    try {
      const { token } = authData

      if (!token) {
        this.sendError(client, 'Authentication token required')
        return
      }

      // Verify JWT token
      const decoded = await this.fastify.jwt.verify(token) as any
      
      if (decoded.type !== 'access') {
        this.sendError(client, 'Invalid token type')
        return
      }

      // Verify session exists
      const session = await this.fastify.prisma.session.findUnique({
        where: { token },
        include: { user: { select: { id: true, username: true } } },
      })

      if (!session || session.expiresAt < new Date()) {
        this.sendError(client, 'Invalid or expired session')
        return
      }

      // Associate client with user
      client.userId = session.user.id
      
      // Track user connections
      if (!this.userConnections.has(session.user.id)) {
        this.userConnections.set(session.user.id, new Set())
      }
      this.userConnections.get(session.user.id)!.add(client.id)

      // Send authentication success
      this.sendToClient(client, {
        type: 'authenticated',
        data: {
          userId: session.user.id,
          username: session.user.username,
        },
        timestamp: new Date().toISOString(),
      })

      this.fastify.log.info(`WebSocket client authenticated: ${client.id} -> ${session.user.id}`)

    } catch (error) {
      this.fastify.log.error('WebSocket authentication error:', error)
      this.sendError(client, 'Authentication failed')
    }
  }

  // Handle channel subscriptions
  private handleSubscription(client: WebSocketClient, subData: any) {
    const { channels } = subData

    if (!Array.isArray(channels)) {
      this.sendError(client, 'Invalid subscription data')
      return
    }

    channels.forEach((channel: string) => {
      if (this.isValidChannel(channel, client.userId)) {
        client.subscriptions.add(channel)
      }
    })

    this.sendToClient(client, {
      type: 'subscribed',
      data: { channels: Array.from(client.subscriptions) },
      timestamp: new Date().toISOString(),
    })
  }

  // Handle channel unsubscriptions
  private handleUnsubscription(client: WebSocketClient, subData: any) {
    const { channels } = subData

    if (!Array.isArray(channels)) {
      this.sendError(client, 'Invalid unsubscription data')
      return
    }

    channels.forEach((channel: string) => {
      client.subscriptions.delete(channel)
    })

    this.sendToClient(client, {
      type: 'unsubscribed',
      data: { channels },
      timestamp: new Date().toISOString(),
    })
  }

  // Handle ping messages
  private handlePing(client: WebSocketClient) {
    client.lastPing = Date.now()
    this.sendToClient(client, {
      type: 'pong',
      timestamp: new Date().toISOString(),
    })
  }

  // Handle generation status requests
  private async handleGenerationStatusRequest(client: WebSocketClient, data: any) {
    try {
      const { jobId } = data

      if (!client.userId) {
        this.sendError(client, 'Authentication required')
        return
      }

      // Verify job belongs to user
      const result = await this.fastify.prisma.tryOnResult.findFirst({
        where: {
          jobId,
          userId: client.userId,
        },
        select: {
          status: true,
          generatedImageUrl: true,
          generatedVideoUrl: true,
          processingTime: true,
          cost: true,
          error: true,
        },
      })

      if (!result) {
        this.sendError(client, 'Job not found')
        return
      }

      this.sendToClient(client, {
        type: 'generation_status',
        data: {
          jobId,
          status: result.status.toLowerCase(),
          resultUrl: result.generatedImageUrl || result.generatedVideoUrl,
          processingTime: result.processingTime,
          cost: result.cost,
          error: result.error,
        },
        timestamp: new Date().toISOString(),
      })

    } catch (error) {
      this.fastify.log.error('Error handling generation status request:', error)
      this.sendError(client, 'Failed to get generation status')
    }
  }

  // Handle client disconnection
  private handleDisconnection(client: WebSocketClient) {
    // Remove from clients map
    this.clients.delete(client.id)

    // Remove from user connections
    if (client.userId) {
      const userConnections = this.userConnections.get(client.userId)
      if (userConnections) {
        userConnections.delete(client.id)
        if (userConnections.size === 0) {
          this.userConnections.delete(client.userId)
        }
      }
    }

    this.fastify.log.info(`WebSocket client disconnected: ${client.id}`)
  }

  // Public methods for broadcasting messages

  // Notify user about generation updates
  notifyGenerationUpdate(userId: string, jobId: string, status: string, data?: any) {
    this.broadcastToUser(userId, {
      type: 'generation_update',
      data: {
        jobId,
        status,
        ...data,
      },
      timestamp: new Date().toISOString(),
    })
  }

  // Notify user about feed updates
  notifyFeedUpdate(userId: string, action: string, data: any) {
    this.broadcastToUser(userId, {
      type: 'feed_update',
      data: {
        action,
        ...data,
      },
      timestamp: new Date().toISOString(),
    })
  }

  // Send notification to user
  sendNotification(userId: string, notification: any) {
    this.broadcastToUser(userId, {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    })
  }

  // Broadcast to all users
  broadcast(message: WebSocketMessage) {
    this.clients.forEach(client => {
      this.sendToClient(client, message)
    })
  }

  // Broadcast to specific user
  broadcastToUser(userId: string, message: WebSocketMessage) {
    const userConnections = this.userConnections.get(userId)
    if (userConnections) {
      userConnections.forEach(clientId => {
        const client = this.clients.get(clientId)
        if (client) {
          this.sendToClient(client, message)
        }
      })
    }
  }

  // Broadcast to channel subscribers
  broadcastToChannel(channel: string, message: WebSocketMessage) {
    this.clients.forEach(client => {
      if (client.subscriptions.has(channel)) {
        this.sendToClient(client, message)
      }
    })
  }

  // Private helper methods

  private sendToClient(client: WebSocketClient, message: WebSocketMessage) {
    try {
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(JSON.stringify(message))
      }
    } catch (error) {
      this.fastify.log.error('Error sending message to client:', error)
      this.handleDisconnection(client)
    }
  }

  private sendError(client: WebSocketClient, error: string) {
    this.sendToClient(client, {
      type: 'error',
      data: { message: error },
      timestamp: new Date().toISOString(),
    })
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private isValidChannel(channel: string, userId?: string): boolean {
    // Define valid channel patterns
    const validPatterns = [
      /^user:[\w-]+$/, // User-specific channels
      /^generation:[\w-]+$/, // Generation job channels
      /^feed:[\w-]+$/, // Feed update channels
      /^global$/, // Global announcements
    ]

    // Check if channel matches any valid pattern
    const isValid = validPatterns.some(pattern => pattern.test(channel))
    
    // For user-specific channels, verify ownership
    if (channel.startsWith('user:') || channel.startsWith('generation:') || channel.startsWith('feed:')) {
      const channelUserId = channel.split(':')[1]
      return isValid && channelUserId === userId
    }

    return isValid
  }

  private setupCleanupIntervals() {
    // Ping all clients every 30 seconds
    this.pingInterval = setInterval(() => {
      this.clients.forEach(client => {
        this.sendToClient(client, {
          type: 'ping',
          timestamp: new Date().toISOString(),
        })
      })
    }, 30000)

    // Clean up dead connections every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const timeout = 60000 // 1 minute timeout

      this.clients.forEach(client => {
        if (now - client.lastPing > timeout) {
          this.fastify.log.info(`Cleaning up inactive client: ${client.id}`)
          this.handleDisconnection(client)
        }
      })
    }, 60000)
  }

  // Get connection statistics
  getStats() {
    return {
      totalClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter(c => c.userId).length,
      uniqueUsers: this.userConnections.size,
      totalSubscriptions: Array.from(this.clients.values()).reduce(
        (sum, client) => sum + client.subscriptions.size, 
        0
      ),
    }
  }

  // Cleanup on shutdown
  destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // Close all connections
    this.clients.forEach(client => {
      try {
        client.socket.close()
      } catch (error) {
        // Ignore close errors
      }
    })

    this.clients.clear()
    this.userConnections.clear()
  }
}

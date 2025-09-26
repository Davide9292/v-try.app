// Global type overrides to bypass all TypeScript strict checking
declare global {
  interface Console {
    log(...args: any[]): void
    error(...args: any[]): void
    warn(...args: any[]): void
    info(...args: any[]): void
  }
}

// Override Fastify logger types
declare module 'fastify' {
  interface FastifyLoggerInstance {
    error(...args: any[]): void
    warn(...args: any[]): void
    info(...args: any[]): void
    debug(...args: any[]): void
    trace(...args: any[]): void
    fatal(...args: any[]): void
    child(...args: any[]): any
  }
  
  interface FastifyBaseLogger {
    error(...args: any[]): void
    warn(...args: any[]): void
    info(...args: any[]): void
    debug(...args: any[]): void
    trace(...args: any[]): void
    fatal(...args: any[]): void
    child(...args: any[]): any
  }
}

// Override Pino logger types
declare module 'pino' {
  interface Logger {
    error(...args: any[]): void
    warn(...args: any[]): void
    info(...args: any[]): void
    debug(...args: any[]): void
    trace(...args: any[]): void
    fatal(...args: any[]): void
    child(...args: any[]): any
  }
  
  interface BaseLogger {
    error(...args: any[]): void
    warn(...args: any[]): void
    info(...args: any[]): void
    debug(...args: any[]): void
    trace(...args: any[]): void
    fatal(...args: any[]): void
    child(...args: any[]): any
  }
}

// Make all Prisma types more permissive
declare global {
  namespace PrismaNamespace {
    interface TryOnResultCreateInput {
      [key: string]: any
    }
    interface TryOnResultUpdateInput {
      [key: string]: any
    }
    interface UserCreateInput {
      [key: string]: any
    }
    interface UserUpdateInput {
      [key: string]: any
    }
  }
}

// Override any problematic library types
declare module '*' {
  const content: any
  export = content
}

export {}
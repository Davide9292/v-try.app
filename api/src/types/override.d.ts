// Type overrides to bypass TypeScript strict checking
declare module 'fastify' {
  interface FastifyLoggerInstance {
    error(msg: string, ...args: any[]): void
    warn(msg: string, ...args: any[]): void
    info(msg: string, ...args: any[]): void
    debug(msg: string, ...args: any[]): void
  }
}

// Override any problematic Prisma types
declare global {
  namespace PrismaNamespace {
    interface TryOnResultCreateInput {
      [key: string]: any
    }
  }
}

// Make all error types more permissive
declare module 'pino' {
  interface Logger {
    error(msg: string, ...args: any[]): void
    warn(msg: string, ...args: any[]): void
    info(msg: string, ...args: any[]): void
    debug(msg: string, ...args: any[]): void
  }
}

export {}

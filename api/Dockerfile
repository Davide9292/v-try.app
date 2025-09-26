# V-Try.app API Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code and schema
COPY src/ ./src/
COPY prisma/ ./prisma/

# Verify prisma files exist
RUN ls -la prisma/ && cat prisma/schema.prisma | head -5

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S vtryapi -u 1001

# Change ownership
RUN chown -R vtryapi:nodejs /app
USER vtryapi

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Start application
CMD ["npm", "start"]

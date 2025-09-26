# V-Try.app API Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from api directory
COPY api/package*.json ./
COPY api/tsconfig.json ./

# Install all dependencies (needed for build)
RUN npm install

# Copy source code and schema from api directory
COPY api/src/ ./src/
COPY api/prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

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

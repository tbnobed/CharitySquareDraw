# Multi-stage build for Chicken Poop Bingo application
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies for building
FROM base AS build-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build the application
FROM build-deps AS builder
WORKDIR /app

# Copy source code
COPY . .

# Build the Vite frontend and bundle server with esbuild
RUN npm run build
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server-bundle.js

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 chicken-poop-bingo

# Install PostgreSQL client for database operations
RUN apk add --no-cache postgresql-client

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

# Copy client assets to serve statically
COPY --from=builder /app/client/src/assets ./client/src/assets

# Make bundled server executable
RUN chmod +x dist/server-bundle.js

# Set ownership
RUN chown -R chicken-poop-bingo:nodejs /app
USER chicken-poop-bingo

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/game', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application using bundled server
CMD ["node", "dist/server-bundle.js"]
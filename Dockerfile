# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
WORKDIR /app

# Production dependencies stage
FROM base AS deps-prod
ENV NODE_ENV=production
COPY package*.json ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --only=production --no-audit --fund=false && \
    npm cache clean --force

# Development dependencies stage (for building)
FROM base AS deps-dev
ENV NODE_ENV=development
COPY package*.json ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --no-audit --fund=false

# Build stage
FROM deps-dev AS build
WORKDIR /app
COPY . .
RUN npm run build && \
    npm prune --production

# Production stage
FROM node:20-bookworm-slim AS production
WORKDIR /app

# Create non-root user
RUN groupadd --gid 1001 --system nodejs && \
    useradd --uid 1001 --system --gid nodejs --shell /bin/bash nodejs

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy production dependencies
COPY --from=deps-prod --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/main.js"]

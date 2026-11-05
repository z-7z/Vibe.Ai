# Vibe.Ai Dockerfile
# Multi-stage build for optimal image size

# Stage 1: Build stage
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Runtime stage
FROM node:22-bookworm-slim

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY --chown=appuser:appgroup . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => {
    if (res.statusCode !== 200) process.exit(1);
    res.on('data', () => {});
    res.on('end', () => process.exit(0));
  }).on('error', () => process.exit(1))" || exit 1

# Start the server
CMD ["node", "src/index.js"]

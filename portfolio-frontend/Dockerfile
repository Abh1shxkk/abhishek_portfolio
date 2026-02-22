# Multi-stage build for React Frontend
FROM node:20-alpine AS builder

# Accept GEMINI_API_KEY as a build argument (default for Heroku git push builds)
ARG GEMINI_API_KEY=AIzaSyDT-aHThMfo4GjxyT594cBwxV-9LNe5fpw
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Ensure GEMINI_API_KEY is available to Vite during build
# Create .env file so loadEnv can find it regardless of .dockerignore
RUN echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > .env

# Build the application (Vite will pick up GEMINI_API_KEY from .env)
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Add a script to substitute environment variables at runtime
COPY docker/env-config.sh /docker-entrypoint.d/env-config.sh
RUN chmod +x /docker-entrypoint.d/env-config.sh

# Copy startup script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Expose port 80
EXPOSE 80

# Start with script that handles PORT
CMD ["/start.sh"]

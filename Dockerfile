# Custom Dockerfile to avoid npm tracker issue with Railway cache mounts
FROM node:20-alpine

# Set working directory explicitly to avoid tracker issues  
WORKDIR /app

# Copy frontend package files
COPY package*.json ./

# Clear npm state and install frontend dependencies (include optional deps for rollup native modules)
RUN rm -rf ~/.npm /tmp/npm-* 2>/dev/null || true && \
    npm cache clean --force 2>/dev/null || true && \
    npm config set maxsockets 1 && \
    npm install --no-audit --no-fund --legacy-peer-deps

# Copy frontend source files
COPY . ./

# Build the frontend application
# Accept Vite environment variables as build arguments
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_BASE_URL
ARG VITE_RECAPTCHA_SITE_KEY

# Set environment variables for Vite build and build
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

RUN npm run build

# Switch to server directory
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm install --production --no-audit --no-fund

# Copy server source
COPY server/ .

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]


# Custom Dockerfile to avoid npm tracker issue with Railway cache mounts
# Build context should be set to parent directory (portfolio) when using this
FROM node:18-alpine

# Set working directory explicitly to avoid tracker issues  
WORKDIR /app

# Copy package files from parent directory (portfolio)
COPY package*.json ./

# Clear npm state before install to avoid tracker conflicts
RUN rm -rf ~/.npm /tmp/npm-* 2>/dev/null || true && \
    npm cache clean --force 2>/dev/null || true && \
    npm config set maxsockets 1 && \
    npm install --omit=optional --no-audit --no-fund --legacy-peer-deps

# Copy the rest of the frontend application
COPY . .

# Build the frontend application
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


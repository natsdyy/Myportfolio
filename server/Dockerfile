# Standalone Backend Dockerfile for Railway
# This image includes all dependencies for Puppeteer to run headlessly.

FROM node:18-slim

# Install Chromium and its dependencies for Puppeteer
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Set environment variables for Puppeteer
# This prevents downloading Chromium during npm install since we install it via apt-get
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install dependencies
# We use --production to keep the image small
RUN npm install --production

# Copy server source
COPY . .

# Railway uses the PORT env var, but we'll default to 4000 if not set
ENV PORT=4000
EXPOSE 4000

# Start the server
CMD ["npm", "start"]


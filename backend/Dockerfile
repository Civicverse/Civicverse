FROM node:18-alpine
WORKDIR /app
# Copy root files needed for workspaces/local dependencies
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
# Copy backend specific files
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
# Install only production dependencies
RUN npm install --production --no-audit --no-fund
# Copy the rest of the backend code
COPY backend/ ./

# Install XMRig for mining dependency
RUN mkdir -p /app/data/miner && \
    wget https://github.com/xmrig/xmrig/releases/download/v6.22.2/xmrig-6.22.2-linux-static-x64.tar.gz -O /tmp/xmrig.tar.gz && \
    tar -xzf /tmp/xmrig.tar.gz -C /app/data/miner --strip-components=1 && \
    rm /tmp/xmrig.tar.gz && \
    chmod +x /app/data/miner/xmrig

EXPOSE 3003 8080
CMD ["node", "start.js"]

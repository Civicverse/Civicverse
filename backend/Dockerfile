FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache xmrig hwloc && \
    npm install --production --no-audit --no-fund
COPY . .
EXPOSE 3003 8080
CMD ["node", "start.js"]

FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --no-audit --no-fund
COPY index.js ./
EXPOSE 18081 18083
CMD ["node","index.js"]

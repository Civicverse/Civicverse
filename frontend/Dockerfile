# Multi-stage build for Civicverse Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
RUN npm ci --include=dev || npm install --include=dev

# Copy source code
COPY . .

# Build production distribution bundle
RUN npm run build

# Production web server (Nginx)
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

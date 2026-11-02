# Multi-stage build for Civicverse Frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend ./backend
COPY frontend ./frontend
COPY packages ./packages
COPY scripts ./scripts
ENV CI=true
RUN npm ci

RUN npm run build --workspace=frontend \
    && test -f frontend/dist/index.html

# Production web server (Nginx)
FROM nginx:stable-alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

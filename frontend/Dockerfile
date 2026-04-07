FROM node:18-alpine AS build
WORKDIR /app
# Copy root package files
COPY package.json package-lock.json* ./
# Copy frontend specific files
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
# Install only frontend dependencies
RUN npm install --loglevel=info
# Copy the rest of the frontend code
COPY frontend/ ./
# Build the frontend
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

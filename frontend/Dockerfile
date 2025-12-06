FROM node:18-alpine AS build
WORKDIR /app
COPY demo/package.json demo/package-lock.json* ./
COPY demo/ ./
RUN npm install --no-audit --no-fund
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

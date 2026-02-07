FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production --no-audit --no-fund
COPY index.js ./
EXPOSE 3003
CMD ["node", "index.js"]

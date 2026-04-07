FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/

RUN npm install

WORKDIR /app/packages/civic-watch

EXPOSE 3002

CMD ["npm", "run", "start:service"]

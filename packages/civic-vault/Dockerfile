FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/ ./packages/

RUN npm install

WORKDIR /app/packages/civic-vault

EXPOSE 3008

CMD ["npm", "run", "start:service"]

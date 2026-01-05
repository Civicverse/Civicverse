FROM node:18-alpine
WORKDIR /usr/src/app

# install deps
COPY package.json package-lock.json* ./
RUN npm install --production --no-audit --no-fund || npm install --production

# copy source
COPY . .

EXPOSE 4310 4320 4330

ENV PORT=4310

CMD ["node","index.js"]

FROM node:21-alpine

WORKDIR /app

RUN apk add cmake python3 make curl g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD npm run start

FROM node:13.8-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npx pnpm install
COPY . .

CMD npm run start
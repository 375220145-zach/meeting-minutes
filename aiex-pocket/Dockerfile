FROM node:22-alpine

WORKDIR /app

COPY packages/backend/package.json ./
COPY packages/backend/tsconfig.json ./
COPY packages/backend/src/ src/

RUN npm install

EXPOSE 3000

CMD ["./node_modules/.bin/tsx", "src/index.ts"]

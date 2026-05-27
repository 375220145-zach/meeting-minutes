FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY src/ src/

RUN npm install

EXPOSE 3000

CMD ["./node_modules/.bin/tsx", "src/index.ts"]

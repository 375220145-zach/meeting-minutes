FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY src/ src/

RUN npm install
RUN npm install -g tsx

ENV PORT=3000
ENV CORS_ORIGIN=*

EXPOSE 3000

CMD ["tsx", "src/index.ts"]

FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx@4.19.0

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000

CMD ["node", "--import", "tsx", "src/main.ts"]

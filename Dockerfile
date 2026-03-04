FROM node:20-alpine

WORKDIR /app

# Instala pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copia package manifests e instala dependências (dev para build)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copia todo o código e roda o build (client + server bundling)
COPY . .
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]

FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/client/package.json ./apps/client/

RUN bun install --filter '@apps/client'

COPY apps/client ./apps/client
COPY packages/shared ./packages/shared

RUN cd packages/shared && bun run build

ENTRYPOINT ["bun", "run", "dev"]
FROM rust:1.89-alpine AS rust-builder
RUN apk add --no-cache musl-dev git
WORKDIR /src
RUN git clone https://github.com/flazepe/clipper.git .
RUN cargo build --release

FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg
COPY --from=rust-builder /src/target/release/clipper /usr/local/bin/clipper

COPY package.json bun.lock ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

RUN bun install --filter '@apps/server'

COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

RUN cd packages/shared && bun run build

EXPOSE 3000

ENTRYPOINT ["bun", "run", "apps/server/src/server.ts"]
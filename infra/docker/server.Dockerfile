FROM rust:1.89-alpine AS rust-builder
RUN apk add --no-cache musl-dev git
WORKDIR /src
RUN git clone https://github.com/flazepe/clipper.git .
RUN cargo build --release

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=server --prod /prod/server

FROM base AS server
RUN apk add --no-cache ffmpeg

COPY --from=build /prod/server /prod/server
COPY --from=rust-builder /src/target/release/clipper /bin/clipper

WORKDIR /prod/server
EXPOSE 3000
CMD ["pnpm", "start"]
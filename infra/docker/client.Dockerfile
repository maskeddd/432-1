FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run -r build
RUN pnpm deploy --filter=client --prod /prod/client

FROM base AS client
RUN apk add --no-cache ffmpeg

COPY --from=build /prod/client /prod/client

WORKDIR /prod/client
EXPOSE 3000
CMD ["pnpm", "start"]
FROM oven/bun:1.1.17 AS base
WORKDIR /app

FROM base AS install

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY src src

USER bun
EXPOSE 8000
ENTRYPOINT ["bun", "run", "src/app.ts"]

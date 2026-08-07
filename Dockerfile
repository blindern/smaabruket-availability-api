FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS base
WORKDIR /app

FROM base AS install

RUN mkdir -p /temp/prod
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /temp/prod/
RUN cd /temp/prod && pnpm install --prod

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY src src

ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://signoz-otel-collector.zt.foreningenbs.no:4318"
ENV OTEL_SERVICE_NAME="smaabruket-availability-api"

USER node
EXPOSE 8000
ENTRYPOINT ["node", "src/app.ts"]

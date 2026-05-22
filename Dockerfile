FROM node:24-alpine@sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14 AS base
WORKDIR /app

FROM base AS install

RUN mkdir -p /temp/prod
RUN corepack enable
COPY package.json pnpm-lock.yaml /temp/prod/
RUN cd /temp/prod && pnpm install --prod

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY src src

ENV OTEL_EXPORTER_OTLP_ENDPOINT="http://signoz-otel-collector.zt.foreningenbs.no:4318"
ENV OTEL_SERVICE_NAME="smaabruket-availability-api"

USER node
EXPOSE 8000
ENTRYPOINT ["node", "src/app.ts"]

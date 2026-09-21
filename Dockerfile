FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS base
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

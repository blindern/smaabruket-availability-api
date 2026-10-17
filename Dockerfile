FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS base
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

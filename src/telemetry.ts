import { opentelemetry } from "@elysiajs/opentelemetry"
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto"

const otlpEndpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"]
const serviceName =
  process.env["OTEL_SERVICE_NAME"] ?? "smaabruket-availability-api"

export function createTelemetryPlugin() {
  if (!otlpEndpoint) {
    console.log("Telemetry disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set")
    return null
  }

  console.log(`Telemetry enabled: sending to ${otlpEndpoint}`)

  return opentelemetry({
    serviceName,
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: `${otlpEndpoint}/v1/traces`,
        }),
      ),
    ],
  })
}

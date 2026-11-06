import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { GrpcInstrumentation } from "@opentelemetry/instrumentation-grpc";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

declare global {
  var __harithsaTelemetry:
    { flush: () => Promise<void>; shutdown: () => Promise<void> } | undefined;
}

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const credential = process.env.DYNATRACE_INGEST_TOKEN;
const local =
  endpoint &&
  /^http:\/\/(127\.0\.0\.1|localhost):\d+\//.test(endpoint) &&
  process.env.OTEL_LOCAL_TEST === "true";
const allowed =
  endpoint === "https://indiacs.live.dynatrace.com/api/v2/otlp" || local;
if (!globalThis.__harithsaTelemetry && allowed && (credential || local)) {
  process.env.OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE = "DELTA";
  const headers: Record<string, string> = credential
    ? { Authorization: `Bearer ${credential}` }
    : {};
  const base = endpoint!.replace(/\/$/, "");
  const spanProcessor = new BatchSpanProcessor({
    exporter: new OTLPTraceExporter({
      url: base + "/v1/traces",
      headers,
      timeoutMillis: 3000,
    }),
    maxQueueSize: 2048,
    maxExportBatchSize: 256,
    scheduledDelayMillis: 1000,
    exportTimeoutMillis: 3500,
  });
  const logProcessor = new BatchLogRecordProcessor({
    exporter: new OTLPLogExporter({
      url: base + "/v1/logs",
      headers,
      timeoutMillis: 3000,
    }),
    maxQueueSize: 1024,
    maxExportBatchSize: 128,
    scheduledDelayMillis: 1000,
    exportTimeoutMillis: 3500,
  });
  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: base + "/v1/metrics",
      headers,
      timeoutMillis: 3000,
    }),
    exportIntervalMillis: 15000,
    exportTimeoutMillis: 4000,
  });
  const sdk = new NodeSDK({
    autoDetectResources: false,
    resource: resourceFromAttributes({
      "service.name": process.env.OTEL_SERVICE_NAME ?? "harithsa-notes-web",
      "service.namespace": "harithsa-notes",
      "service.version": process.env.SERVICE_VERSION ?? "development",
      "deployment.environment.name": process.env.CMS_NAMESPACE ?? "preview",
      ...(process.env.SOURCE_REVISION
        ? { "vcs.ref.head.revision": process.env.SOURCE_REVISION }
        : {}),
      ...(process.env.K_SERVICE || process.env.CLOUD_RUN_JOB
        ? {
            "cloud.provider": "gcp",
            "cloud.platform": "gcp_cloud_run",
            "cloud.region": "us-east1",
          }
        : {}),
      "faas.name":
        process.env.K_SERVICE ?? process.env.CLOUD_RUN_JOB ?? "local",
      "faas.version":
        process.env.K_REVISION ?? process.env.SERVICE_VERSION ?? "development",
    }),
    spanProcessors: [spanProcessor],
    logRecordProcessors: [logProcessor],
    metricReaders: [metricReader],
    spanLimits: {
      attributeCountLimit: 64,
      attributeValueLengthLimit: 1024,
      eventCountLimit: 32,
    },
    instrumentations: [
      new HttpInstrumentation({
        disableIncomingRequestInstrumentation: true,
        ignoreOutgoingRequestHook: (request) =>
          /indiacs\.(?:live|apps)\.dynatrace\.com|metadata\.google\.internal|169\.254\.169\.254/.test(
            String(request.hostname ?? request.host ?? ""),
          ),
      }),
      new GrpcInstrumentation(),
    ],
  });
  sdk.start();
  globalThis.__harithsaTelemetry = {
    flush: async () => {
      await Promise.allSettled([
        spanProcessor.forceFlush(),
        logProcessor.forceFlush(),
        metricReader.forceFlush(),
      ]);
    },
    shutdown: () => sdk.shutdown(),
  };
  process.once("SIGTERM", () => {
    void sdk.shutdown().finally(() => process.exit(0));
  });
}

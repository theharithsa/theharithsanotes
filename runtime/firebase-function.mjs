import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

const ingest = defineSecret("harithsa-dynatrace-ingest");

/** @param {"live" | "preview"} namespace */
export function journalFunction(namespace) {
  let application;
  return onRequest(
    {
      region: "us-east1",
      memory: "512MiB",
      cpu: 1,
      minInstances: 0,
      maxInstances: namespace === "live" ? 2 : 1,
      concurrency: 40,
      timeoutSeconds: 60,
      serviceAccount:
        "harithsa-journal@the-harithsa-notes-94.iam.gserviceaccount.com",
      secrets: [ingest],
    },
    async (request, response) => {
      try {
        application ??= (async () => {
          process.env.CMS_NAMESPACE = namespace;
          process.env.CMS_DATA_SOURCE = "firestore";
          process.env.CMS_BUILD_TARGET = "firebase";
          if (process.env.FUNCTIONS_EMULATOR !== "true") {
            process.env.DYNATRACE_INGEST_TOKEN = ingest.value();
            process.env.OTEL_EXPORTER_OTLP_ENDPOINT =
              "https://indiacs.live.dynatrace.com/api/v2/otlp";
          }
          await import("./runtime/instrumentation.mts");
          return (await import("./dist/server/entry.mjs")).handler;
        })().catch((error) => {
          application = undefined;
          throw error;
        });
        const handler = await application;
        // The Functions framework consumes the stream before invoking Astro.
        // Pass its original bytes through for multipart forms and API writes.
        if (
          request.rawBody &&
          request.method !== "GET" &&
          request.method !== "HEAD"
        ) {
          request.body = request.rawBody;
        }
        await handler(request, response);
      } catch {
        if (!response.headersSent) {
          response.set("Cache-Control", "private,no-store");
          response
            .status(503)
            .send(
              "This page is temporarily unavailable. Please try again shortly.",
            );
        }
      }
    },
  );
}

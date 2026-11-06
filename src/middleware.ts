import { randomUUID } from "node:crypto";
import { defineMiddleware } from "astro:middleware";
import {
  context as otelContext,
  propagation,
  trace,
  SpanStatusCode,
  SpanKind,
} from "@opentelemetry/api";
import { authorize } from "./server/auth.ts";
import { firestoreEnabled } from "./server/config.ts";
import { CmsError } from "./server/models.ts";
import {
  auditEvent,
  enqueueAudit,
  errorCode,
  observe,
  operationalLog,
  requestContext,
  requestCount,
  requestDuration,
} from "./server/telemetry.ts";

const rootRoutes = new Set([
  "",
  "blogs",
  "books",
  "projects",
  "podcasts",
  "entertainment",
  "gallery",
  "meet-vish",
  "gogs",
  "about",
  "notes",
  "privacy",
  "admin",
  "people-and-journal",
  "account",
  "search",
  "sitemap.xml",
  "rss.xml",
  "robots.txt",
]);
function routeName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "api" && parts[1] === "search") return "/api/search";
  if (parts[0] === "api" && parts[1] === "reading")
    return "/api/reading/:collection/:post";
  if (parts[0] === "api")
    return `/api/${parts[1] === "v1" ? "v1" : "cms"}/${["health", "me", "session", "entries", "audit", "media", "ci", "delivery", "keys", "workspace"].includes(parts[2] ?? "") ? parts[2] : "unknown"}${parts.length > 3 ? "/:entry" : ""}`;
  if (parts[0] === "media") return "/media/:image/:variant";
  if (parts.length === 0) return "/";
  if (!rootRoutes.has(parts[0]!)) return "/:article";
  return `/${parts[0]}${parts.length > 1 ? "/:slug" : ""}`;
}
export const onRequest = defineMiddleware(async (context, next) => {
  if (!firestoreEnabled()) return next();
  const state = {
    requestId: randomUUID(),
    cache: new Map<string, Promise<unknown>>(),
    preview: undefined as { section: string; id: string } | undefined,
  };
  const method = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "PATCH",
  ].includes(context.request.method)
    ? context.request.method
    : "OTHER";
  const route = routeName(context.url.pathname);
  const start = performance.now();
  const parent = propagation.extract(otelContext.active(), {
    traceparent: context.request.headers.get("traceparent") ?? "",
    tracestate: (context.request.headers.get("tracestate") ?? "").slice(0, 512),
  });
  return requestContext.run(state, () =>
    otelContext.with(parent, async () => {
      const response = await observe(
        `HTTP ${method} ${route}`,
        {
          "http.request.method": method,
          "http.route": route,
          "request.id": state.requestId,
        },
        async () => {
          let response: Response;
          let code = "NONE";
          try {
            const preview = context.url.searchParams.get("preview");
            if (preview) {
              await authorize(context.request, true);
              const [section, id] = preview.split(":");
              if (
                !section ||
                !id ||
                !/^[a-z]+$/.test(section) ||
                !/^[a-zA-Z0-9_-]{1,100}$/.test(id)
              )
                throw new CmsError(
                  "INVALID_CONTENT",
                  400,
                  "Invalid draft preview",
                );
              state.preview = { section, id };
              context.locals.draftPreview = true;
            }
            response = await next();
          } catch (error) {
            code = errorCode(error);
            operationalLog(
              "http.request_failed",
              { "http.route": route, "error.type": code },
              error,
            );
            response = new Response(
              error instanceof CmsError
                ? error.message
                : "This page is temporarily unavailable. Please try again shortly.",
              { status: error instanceof CmsError ? error.status : 503 },
            );
          }
          const privateResponse =
            Boolean(state.preview) ||
            context.url.pathname.startsWith("/admin") ||
            context.url.pathname.startsWith("/api/") ||
            context.url.pathname.startsWith("/people-and-journal") ||
            context.url.pathname.startsWith("/account") ||
            context.url.pathname === "/search";
          response.headers.set("X-Request-ID", state.requestId);
          if (privateResponse) {
            response.headers.set("Cache-Control", "private,no-store");
            response.headers.set("X-Robots-Tag", "noindex,nofollow");
          } else if (
            !context.url.pathname.startsWith("/media/") &&
            !context.url.pathname.startsWith("/_image") &&
            !context.url.pathname.startsWith("/_astro/")
          )
            response.headers.set(
              "Cache-Control",
              response.status === 200
                ? "public,max-age=0,s-maxage=15,must-revalidate"
                : "private,no-store",
            );
          code = response.headers.get("X-App-Error") ?? code;
          trace.getActiveSpan()?.setAttributes({
            "http.response.status_code": response.status,
            "error.type": code,
          });
          if (response.status >= 400)
            trace.getActiveSpan()?.setStatus({ code: SpanStatusCode.ERROR });
          const seconds = (performance.now() - start) / 1000;
          const outcome = response.status >= 400 ? "failed" : "success";
          requestCount.add(1, { route, method, outcome, "error.type": code });
          requestDuration.record(seconds, { route, method, outcome });
          if (
            route !== "/api/cms/delivery" ||
            [401, 403].includes(response.status)
          )
            await enqueueAudit(
              auditEvent(
                "http.request",
                {
                  "http.route": route,
                  "http.method": method,
                  "http.status": response.status,
                  "request.payload.bytes": Number(
                    context.request.headers.get("content-length") ?? 0,
                  ),
                  "response.payload.bytes": Number(
                    response.headers.get("content-length") ?? -1,
                  ),
                  "duration.ms": Math.round(seconds * 1000),
                  outcome,
                  "error.type": code,
                },
                "server-observed",
              ),
            );
          return response;
        },
        [],
        SpanKind.SERVER,
      );
      if (globalThis.__harithsaTelemetry)
        await Promise.race([
          globalThis.__harithsaTelemetry.flush(),
          new Promise<void>((resolve) => {
            setTimeout(resolve, 1000).unref();
          }),
        ]);
      return response;
    }),
  );
});

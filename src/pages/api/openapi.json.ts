import type { APIRoute } from "astro";
import { openApiDocument } from "../../server/openapi.ts";
export const GET: APIRoute = () =>
  new Response(JSON.stringify(openApiDocument()), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });

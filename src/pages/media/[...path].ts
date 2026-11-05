import type { APIRoute } from "astro";
import { mediaResponse } from "../../server/media.ts";
import { CmsError } from "../../server/models.ts";
export function getStaticPaths() {
  return [];
}
export const GET: APIRoute = async ({ request, params }) => {
  try {
    const [id, variant] = String(params.path ?? "").split("/");
    return await mediaResponse(request, id ?? "", variant ?? "");
  } catch (error) {
    return new Response("Image unavailable", {
      status: error instanceof CmsError ? error.status : 503,
      headers: { "Cache-Control": "private,no-store" },
    });
  }
};

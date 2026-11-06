import type { APIRoute } from "astro";
import { searchApi } from "../../../server/search.ts";
export function getStaticPaths() {
  return [];
}
export const ALL: APIRoute = ({ request, params }) =>
  params.action === "query"
    ? searchApi(request)
    : new Response(null, { status: 404 });

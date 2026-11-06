import type { APIRoute } from "astro";
import { readingApi } from "../../../server/reading.ts";
export function getStaticPaths() {
  return [];
}
export const ALL: APIRoute = ({ request, params }) =>
  readingApi(request, params.path ?? "");

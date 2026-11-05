import type { APIRoute } from "astro";
import { handleCmsApi } from "../../../server/api.ts";
export function getStaticPaths() {
  return [];
}
const handle: APIRoute = ({ request, params }) =>
  handleCmsApi(request, params.path ?? "");
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;

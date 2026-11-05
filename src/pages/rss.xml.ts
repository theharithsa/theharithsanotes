import type { APIRoute } from "astro";
import { getArticles } from "../lib/journal";
import { site } from "../data/site";
function escapeXml(value: string): string {
  return value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[character] ?? character,
  );
}
export const GET: APIRoute = async () => {
  const articles = await getArticles();
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${site.title}</title><link>${site.url}</link><description>${escapeXml(site.description)}</description><language>en-in</language>${articles.map((article) => `<item><title>${escapeXml(article.title)}</title><link>${site.url}/${article.slug}</link><guid>${site.url}/${article.slug}</guid><pubDate>${new Date(article.date).toUTCString()}</pubDate><description>${escapeXml(article.description)}</description></item>`).join("")}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
};

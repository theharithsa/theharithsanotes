import type { APIRoute } from "astro";
import {
  getArticles,
  getBooks,
  getProjects,
  getListening,
  getScreenNotes,
  getGogs,
} from "../lib/journal";
import { site } from "../data/site";
export const GET: APIRoute = async () => {
  const [articles, books, projects, listening, screenNotes, gogs] =
    await Promise.all([
      getArticles(),
      getBooks(),
      getProjects(),
      getListening(),
      getScreenNotes(),
      getGogs(),
    ]);
  const paths = [
    "",
    "/blogs",
    "/books",
    "/projects",
    "/podcasts",
    "/podcasts/created",
    "/entertainment",
    "/meet-vish",
    "/gogs",
    "/gallery",
    "/privacy",
    ...books.map((book) => `/books/${book.slug}`),
    ...projects.map((project) => `/projects/${project.slug}`),
    ...listening.map(
      (note) =>
        `/podcasts/${note.kind === "created" ? "created" : "listening"}/${note.slug}`,
    ),
    ...screenNotes.map((note) => `/entertainment/${note.slug}`),
    ...articles.map((article) => `/${article.slug}`),
    ...gogs.map((note) => `/gogs/${note.slug}`),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map((path) => `<url><loc>${site.url}${path}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};

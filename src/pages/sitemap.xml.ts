import type { APIRoute } from "astro";
import { articles } from "../lib/content";
import { screenNotes } from "../data/screen-notes";
import { listening } from "../data/interests";
import { projects } from "../data/projects";
import { site } from "../data/site";
import { completedBooks } from "../data/books";
export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["", "/blogs", "/books", ...completedBooks.map((book) => `/books/${book.slug}`), "/podcasts", "/podcasts/created", ...listening.map((note) => `/podcasts/listening/${note.slug}`), "/entertainment", "/meet-vish", "/notes", "/about", "/projects", "/gallery", "/privacy", ...projects.map((project) => `/projects/${project.slug}`), ...screenNotes.map((note) => `/entertainment/${note.slug}`), ...articles.map((article) => `/${article.slug}`)].map((path) => `<url><loc>${site.url}${path}</loc></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );

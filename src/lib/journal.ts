import { pageDefaults, type JournalPage } from "../server/page-defaults.ts";
export { pageDefaults, type JournalPage } from "../server/page-defaults.ts";
import { articles, type Article } from "./content.ts";
import { books, type Book } from "../data/books.ts";
import { projects, type Project } from "../data/projects.ts";
import { listening, type ListeningNote } from "../data/interests.ts";
import { screenNotes, type ScreenNote } from "../data/screen-notes.ts";
import { gallery, type GalleryPhoto } from "../data/gallery.ts";
import { firestoreEnabled } from "../server/config.ts";
import { listPublished, publishedDetail } from "../server/repository.ts";
import type { Section } from "../server/models.ts";

export interface GogNote {
  slug: string;
  title: string;
  description: string;
  kind: "Game" | "Gadget";
  date: string;
  html: string;
  image: string;
  imageAlt: string;
  tags?: string[];
}
export function inferredTags(
  article: Pick<Article, "topic" | "title" | "description">,
): string[] {
  const text = `${article.title} ${article.description}`;
  const vocabulary: [RegExp, string][] = [
    [/dynatrace/i, "Dynatrace"],
    [/open.?telemetry|\botel\b/i, "OpenTelemetry"],
    [/\bmcp\b|model context protocol/i, "MCP"],
    [/\bai\b|artificial intelligence|agentic|machine learning/i, "AI"],
    [/cloud|aws|azure|firebase/i, "Cloud"],
    [/observab|monitor|telemetry|incident/i, "Observability"],
    [/code|software|engineering|developer/i, "Engineering"],
    [/learn|life|friend|purpose/i, "Learning"],
  ];
  const result = vocabulary
    .filter(([pattern]) => pattern.test(text))
    .map(([, label]) => label);
  return [...new Set([article.topic, ...result])].slice(0, 6);
}
function ordered<T>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      Number((a as { order?: number }).order ?? 0) -
      Number((b as { order?: number }).order ?? 0),
  );
}
async function entries<T>(section: Section, snapshot: T[]): Promise<T[]> {
  return firestoreEnabled() ? listPublished<T>(section) : snapshot;
}
export const getArticles = async () =>
  (
    await entries<Article>(
      "blogs",
      articles.map((article) => ({
        ...article,
        tags: article.tags ?? inferredTags(article),
      })),
    )
  ).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
export const getBooks = async () =>
  ordered(await entries<Book>("books", books));
export const getProjects = async () =>
  ordered(await entries<Project>("projects", projects));
export const getListening = async () =>
  ordered(await entries<ListeningNote>("podcasts", listening));
export const getScreenNotes = async () =>
  ordered(await entries<ScreenNote>("entertainment", screenNotes));
export const getGallery = async () =>
  ordered(await entries<GalleryPhoto>("photos", gallery)).sort(
    (a, b) =>
      (b.capturedAt ? Date.parse(b.capturedAt) : 0) -
      (a.capturedAt ? Date.parse(a.capturedAt) : 0),
  );
export const getGogs = async () =>
  (await entries<GogNote>("gogs", [])).sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );
export const getPages = async () => entries<JournalPage>("pages", pageDefaults);
export async function getJournalPage(slug: string): Promise<JournalPage> {
  const match = (await getPages()).find((page) => page.slug === slug);
  return (
    match ?? pageDefaults.find((page) => page.slug === slug) ?? pageDefaults[0]!
  );
}
export async function detail<T extends { slug?: string }>(
  section: Section,
  slug: string,
  snapshot: T[],
): Promise<{ data: T; canonical: string } | null> {
  if (firestoreEnabled()) return publishedDetail<T>(section, slug);
  const data = snapshot.find((item) => item.slug === slug);
  return data ? { data, canonical: slug } : null;
}

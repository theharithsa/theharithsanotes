import { sanitizePostHtml } from "./post-html.ts";
import coverArt from "../data/blog-art.json";
import raw from "../data/articles.json";
import medium from "../data/medium-articles.json";
import mediumSources from "../data/medium-sources.json";
import type { Topic } from "../data/site";

export interface Article {
  dateModified?: string;
  tags?: string[];
  slug: string;
  title: string;
  description: string;
  date: string;
  topic: Topic;
  image: string;
  imageAlt: string;
  minutes: number;
  html: string;
  source: string;
  sourceLabel?: string;
  sourcePublishedAt?: string;
  imageCredit?: string;
  alternateSources?: { label: string; href: string }[];
}

const artworkBySlug = new Map(coverArt.map((art) => [art.slug, art]));

export const articles: Article[] = [...raw, ...medium]
  .map((article) => ({
    ...article,
    ...artworkBySlug.get(article.slug),
    topic: article.topic as Topic,
    alternateSources: mediumSources
      .filter((entry) => entry.slug === article.slug)
      .map((entry) => ({ label: "Medium", href: entry.source })),
    html: sanitizePostHtml(article.html),
  }))
  .sort((left, right) => Date.parse(right.date) - Date.parse(left.date));

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

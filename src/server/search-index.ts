import sanitizeHtml from "sanitize-html";
import type { EntryData, Section } from "./models.ts";
import { entryPath } from "./repository.ts";

export interface SearchDocument {
  title: string;
  description: string;
  section: Section;
  href: string;
  text: string;
  private: boolean;
}
export const searchLabels: Partial<Record<Section, string>> = {
  blogs: "Blog",
  books: "Books",
  projects: "Projects",
  podcasts: "Podcasts",
  entertainment: "Entertainment",
  photos: "Photos",
  gogs: "GoGs",
  pages: "Pages",
  journal: "Journal",
  people: "People",
};
const plain = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const strings = (value: unknown): string =>
  typeof value === "string"
    ? value
    : Array.isArray(value)
      ? value.map(strings).join(" ")
      : "";
/** Explicit display fields only: no source metadata, credentials or unpublished drafts. */
export function searchDocument(
  section: Section,
  slug: string,
  data: EntryData,
): SearchDocument {
  const title = plain(strings(data.title));
  const description = plain(
    strings(data.description || data.note || data.caption || data.heading),
  );
  const review =
    data.goodreads && typeof data.goodreads === "object"
      ? strings((data.goodreads as EntryData).review)
      : "";
  const text = plain(
    [
      title,
      description,
      ...[
        "html",
        "paragraphs",
        "author",
        "show",
        "tags",
        "genres",
        "category",
        "topic",
        "lessons",
        "story",
        "features",
        "stack",
      ].map((key) => strings(data[key])),
      review,
    ].join(" "),
  );
  return {
    title,
    description: description.slice(0, 240),
    section,
    href:
      section === "podcasts" && data.kind === "created"
        ? `/podcasts/created/${slug}`
        : entryPath(section, slug),
    text,
    private: section === "journal" || section === "people",
  };
}
const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase();
export function findSearchResults(
  documents: SearchDocument[],
  query: string,
  section: string,
  offset: number,
) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = documents
    .filter(
      (doc) =>
        (!section || doc.section === section) &&
        words.every((word) => normalize(doc.text).includes(word)),
    )
    .map((doc) => ({
      doc,
      score: words.reduce(
        (score, word) =>
          score +
          (normalize(doc.title).includes(word) ? 5 : 0) +
          (normalize(doc.description).includes(word) ? 2 : 0),
        0,
      ),
    }))
    .sort(
      (a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title),
    );
  return {
    total: matches.length,
    results: matches.slice(offset, offset + 20).map(({ doc }) => ({
      title: doc.title,
      description: doc.description,
      section: doc.section,
      label: searchLabels[doc.section],
      href: doc.href,
      private: doc.private,
    })),
    next: offset + 20 < matches.length ? offset + 20 : null,
  };
}

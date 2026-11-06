import { z } from "zod";
import { sanitizePostHtml } from "../lib/post-html.ts";

export const sections = [
  "blogs",
  "books",
  "projects",
  "podcasts",
  "entertainment",
  "photos",
  "gogs",
  "pages",
  "tags",
  "journal",
  "people",
] as const;
export type Section = (typeof sections)[number];
export const isRestrictedSection = (
  section: string,
): section is "journal" | "people" =>
  section === "journal" || section === "people";
export type EntryData = Record<string, unknown>;
export interface Entry {
  id: string;
  section: Section;
  data: EntryData;
  draftRevision: number;
  publishedRevision: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
export interface PublishedEntry {
  mediaIds?: string[];
  id: string;
  section: Section;
  slug: string;
  revision: number;
  data: EntryData;
  updatedAt: string;
}
export interface AuditEvent {
  id: string;
  type: string;
  time: string;
  authority: "server-confirmed" | "server-observed" | "ci-reported";
  data: Record<string, string | number | boolean | null>;
}
export class CmsError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) {
    super(message);
    this.name = "CmsError";
    this.code = code;
    this.status = status;
  }
}
export const isSection = (value: string): value is Section =>
  sections.includes(value as Section);
export const identifier = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const text = z.string().max(12000);
const url = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("/images/") ||
      value.startsWith("/media/") ||
      /^https?:\/\/[^\s]+$/.test(value),
    "Use a complete web link or a local media path",
  );
const tags = z.array(z.string().trim().min(1).max(64)).max(40);
const slug = z
  .string()
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const date = z
  .string()
  .max(40)
  .refine(
    (value) =>
      value === "" ||
      (/^\d{4}(?:-\d{2}(?:-\d{2}(?:T[0-9:.+-]+Z?)?)?)?$/.test(value) &&
        Number.isFinite(Date.parse(value))),
    "Use an ISO date such as 2026-11-06",
  );
const base = {
  title: z.string().trim().min(1).max(240),
  slug: slug.optional(),
};
export const pageSlugs = [
  "home",
  "meet-vish",
  "blogs",
  "books",
  "projects",
  "podcasts",
  "entertainment",
  "gallery",
  "gogs",
  "privacy",
] as const;
const schemas: Record<Section, z.ZodType> = {
  journal: z
    .object({
      ...base,
      slug,
      description: text,
      date,
      tags: tags.optional(),
      image: url,
      imageAlt: text,
      html: z.string().max(460000),
      audience: z.literal("invited").default("invited"),
    })
    .catchall(z.unknown()),
  people: z
    .object({
      ...base,
      slug,
      description: text,
      date,
      tags: tags.optional(),
      image: url,
      imageAlt: text,
      html: z.string().max(460000),
      relationship: z.string().max(100).default(""),
      species: z.string().max(50).default("Human"),
      audience: z.literal("invited").default("invited"),
    })
    .catchall(z.unknown()),
  blogs: z
    .object({
      ...base,
      slug,
      description: text,
      date,
      topic: z.string().min(1).max(80),
      tags: tags.optional(),
      image: url,
      imageAlt: text,
      minutes: z.number().int().min(1).max(999),
      html: z.string().max(460000),
      source: url.default(""),
    })
    .catchall(z.unknown()),
  books: z
    .object({
      ...base,
      slug,
      author: z.string().max(240),
      status: z.literal("Read"),
      genres: tags,
      colour: z.string().max(30),
      goodreads: z
        .object({
          rating: z.number().int().min(0).max(5),
          review: z.string().max(300000),
        })
        .catchall(z.unknown())
        .optional(),
    })
    .catchall(z.unknown()),
  projects: z
    .object({
      ...base,
      slug,
      category: z.string().max(80),
      description: text,
      href: url,
      source: url,
      image: url,
      imageAlt: text,
      colour: z.string().max(30),
      overview: z.array(text).max(100),
      features: z.array(z.object({ title: text, description: text })).max(100),
      stack: tags,
      linkLabel: text,
    })
    .catchall(z.unknown()),
  podcasts: z
    .object({
      ...base,
      slug,
      artLabel: text,
      show: text,
      status: z.enum(["Listened", "On my list", "Created"]),
      kind: z.enum(["listening", "created"]).optional(),
      href: url,
      note: text,
      image: url.optional(),
    })
    .catchall(z.unknown()),
  entertainment: z
    .object({
      ...base,
      slug,
      kind: z.enum(["Movie", "Series"]),
      date,
      headline: text,
      description: text,
      lesson: text,
      paragraphs: z.array(text).max(200),
      artwork: text,
      officialUrl: url,
      linkLabel: text,
      poster: z.object({
        src: url,
        alt: text,
        width: z.number().positive(),
        height: z.number().positive(),
        credit: text,
        source: url,
      }),
    })
    .catchall(z.unknown()),
  photos: z
    .object({
      ...base,
      src: url,
      caption: text,
      alt: text,
      width: z.number().positive().max(20000),
      height: z.number().positive().max(20000),
      shape: z.enum(["wide", "portrait", "square"]),
      capturedAt: date.optional(),
      order: z.number().optional(),
    })
    .catchall(z.unknown()),
  gogs: z
    .object({
      ...base,
      slug,
      kind: z.enum(["Game", "Gadget"]),
      date,
      description: text,
      html: z.string().max(460000),
      image: url,
      imageAlt: text,
      tags: tags.optional(),
    })
    .catchall(z.unknown()),
  pages: z
    .object({
      ...base,
      slug: z.enum(pageSlugs),
      description: text,
      paragraphs: z.array(text).max(100),
      html: z.string().max(460000).optional(),
      image: url.optional(),
      imageAlt: text.optional(),
      portraitImage: url.optional(),
      portraitImageAlt: text.optional(),
      heading: z.string().max(500).optional(),
      featuredProjects: z.array(slug).max(20).optional(),
    })
    .catchall(z.unknown()),
  tags: z
    .object({ ...base, slug, kind: z.enum(["topic", "genre", "tag"]) })
    .catchall(z.unknown()),
};
export function contentSchema(section: Section) {
  return z.toJSONSchema(schemas[section], {
    target: "draft-2020-12",
    unrepresentable: "any",
  });
}

export function cleanHtml(value: string): string {
  return sanitizePostHtml(value);
}
export function validateData(
  section: Section,
  value: unknown,
  publish = false,
): EntryData {
  let properties = 0;
  function inspect(item: unknown, depth = 0): void {
    if (depth > 16 || ++properties > 12000)
      throw new CmsError(
        "INVALID_CONTENT",
        400,
        "Content is too deeply nested or contains too many fields",
      );
    if (item && typeof item === "object")
      for (const child of Object.values(item)) inspect(child, depth + 1);
  }
  inspect(value);
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new CmsError("INVALID_CONTENT", 400, "Content must be valid JSON");
  }
  if (!serialized || Buffer.byteLength(serialized) > 600 * 1024)
    throw new CmsError(
      "INVALID_CONTENT",
      413,
      "This entry exceeds the 600 KiB content limit",
    );
  if (/"(?:__proto__|prototype|constructor)"\s*:/.test(serialized))
    throw new CmsError("INVALID_CONTENT", 400, "Unsupported property name");
  const result = schemas[section].safeParse(value);
  if (!result.success)
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      result.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  const data = result.data as EntryData;
  if (
    publish &&
    isRestrictedSection(section) &&
    !/^\/media\/[a-f0-9]{64}\/(?:400|800|1600)\.webp$/.test(String(data.image))
  )
    throw new CmsError(
      "INVALID_MEDIA",
      400,
      "Upload a private cover for this collection before publishing",
    );
  if (
    publish &&
    new Set(
      [...serialized.matchAll(/\/media\/([a-f0-9]{64})\//g)].map(
        (match) => match[1],
      ),
    ).size > 100
  )
    throw new CmsError(
      "INVALID_CONTENT",
      413,
      "Use at most 100 uploaded images in one entry",
    );
  if (publish && section === "photos" && (!data.src || !data.alt))
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Add a photograph and descriptive alternative text",
    );
  if (publish && section === "entertainment") {
    const poster = data.poster as EntryData;
    if (!poster.src || !poster.alt)
      throw new CmsError(
        "INVALID_CONTENT",
        400,
        "Add the real poster and its alternative text before publishing",
      );
  }
  if (
    section === "pages" &&
    !pageSlugs.includes(String(data.slug) as (typeof pageSlugs)[number])
  )
    throw new CmsError("INVALID_CONTENT", 400, "Choose an existing core page");
  if (typeof data.html === "string") data.html = cleanHtml(data.html);
  if (
    publish &&
    ["blogs", "gogs", "journal", "people"].includes(section) &&
    !(data.html as string).replace(/<[^>]*>/g, "").trim()
  )
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Write some content before publishing",
    );
  if (publish && typeof data.date === "string" && !data.date)
    throw new CmsError("INVALID_CONTENT", 400, "Choose a publication date");
  if (typeof data.date === "string" && data.date && data.date.length < 10)
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Use a complete publication date",
    );
  if (
    publish &&
    ["blogs", "projects", "gogs", "journal", "people"].includes(section) &&
    (!data.image || !data.imageAlt)
  )
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Add a cover image and its descriptive alternative text",
    );
  if (
    section === "blogs" &&
    [
      "admin",
      "api",
      "media",
      "blogs",
      "books",
      "projects",
      "podcasts",
      "entertainment",
      "meet-vish",
      "gogs",
      "gallery",
      "privacy",
      "about",
      "notes",
      "preview",
      "people-and-journal",
      "account",
      "search",
    ].includes(String(data.slug))
  )
    throw new CmsError(
      "SLUG_CONFLICT",
      409,
      "That address is reserved for the site",
    );
  return data;
}

export function summaryData(section: Section, data: EntryData): EntryData {
  const result = structuredClone(data);
  if (isRestrictedSection(section)) {
    for (const field of Object.keys(result))
      if (
        ![
          "title",
          "slug",
          "description",
          "date",
          "tags",
          "image",
          "imageAlt",
          "relationship",
          "species",
          "audience",
        ].includes(field)
      )
        delete result[field];
  }
  if ("html" in result) result.html = "";
  if (
    section === "books" &&
    result.goodreads &&
    typeof result.goodreads === "object"
  ) {
    const review = result.goodreads as EntryData;
    review.review = String(review.review ?? "").slice(0, 300);
  }
  return result;
}

import sanitizeHtml from "sanitize-html";
import raw from "../data/articles.json";
import type { Topic } from "../data/site";

export interface Article {
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
}

export const articles: Article[] = raw.map((article) => ({
  ...article,
  topic: article.topic as Topic,
  html: sanitizeHtml(article.html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height", "loading"],
      code: ["class"],
      pre: ["class"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      ol: ["start", "reversed"],
      li: ["value"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
    },
  }),
}));

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

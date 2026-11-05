export const sectionMeta = {
  home: {
    light: "#f9f6ef",
    dark: "#181c1b",
    description:
      "Notes on observability, artificial intelligence, books, projects and the everyday discoveries of Vishruth Harithsa, an engineer and builder in Bengaluru.",
  },
  blogs: {
    light: "#dfe9ec",
    dark: "#26353c",
    description:
      "Explore Vishruth Harithsa’s essays on observability, AI, engineering, creativity and life, with original illustrations and personal reflections.",
  },
  books: {
    light: "#efe1ce",
    dark: "#3c3228",
    description:
      "Explore 50 books read by Vishruth Harithsa. Browse by genre, discover personal ratings, and read original notes from the reading journal.",
  },
  projects: {
    light: "#f5f0e8",
    dark: "#302b25",
    description:
      "Browse Vishruth Harithsa’s projects by topic: AI tools, observability, money and planning, and products for people and places.",
  },
  podcasts: {
    light: "#e5e0ef",
    dark: "#332c3d",
    description:
      "Listening notes, conversations and ideas from the podcasts in Vishruth Harithsa’s life, with a space for future original episodes.",
  },
  entertainment: {
    light: "#f0dda9",
    dark: "#413821",
    description:
      "Personal reflections on films and series: the stories Vishruth Harithsa watches and the lessons that stay after the credits.",
  },
  "meet-vish": {
    light: "#efe1ce",
    dark: "#3c3228",
    description:
      "Meet Vishruth Harithsa, a Senior Customer Success Engineer at Dynatrace in Bengaluru, builder, reader and curious lifelong learner.",
  },
  gallery: {
    light: "#e1e8d7",
    dark: "#2c3629",
    description:
      "Life in photographs: people, places and everyday moments from Vishruth Harithsa’s personal gallery.",
  },
  gogs: {
    light: "#dbe5ef",
    dark: "#283442",
    description:
      "Games and Gadget (GoGs): Vishruth Harithsa’s new space for games, gadgets and personal experiences.",
  },
  privacy: {
    light: "#f9f6ef",
    dark: "#181c1b",
    description:
      "How The Harithsa Notes handles privacy, optional analytics, local preferences and your choices.",
  },
} as const;
export function canonicalPath(path: string): string {
  const normalized = path === "/" ? "/" : path.replace(/\/$/, "");
  return normalized === "/notes"
    ? "/blogs"
    : normalized === "/about"
      ? "/meet-vish"
      : normalized;
}
export function pageMeta(path: string, article = false) {
  const section = article
    ? "blogs"
    : canonicalPath(path).split("/")[1] || "home";
  return sectionMeta[section as keyof typeof sectionMeta] ?? sectionMeta.home;
}

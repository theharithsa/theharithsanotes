export const site = {
  title: "The Harithsa Notes",
  author: "Vishruth Harithsa",
  url: "https://theharithsanotes.com",
  description:
    "Notes on observability, artificial intelligence, and a life of learning. A personal journal by Vishruth Harithsa, from Bengaluru.",
  github: "https://github.com/theharithsa",
  linkedin: "https://www.linkedin.com/in/theharithsa/",
  mentoring: "https://topmate.io/theharithsa",
};

export const topics = [
  "All notes",
  "Observability",
  "AI & building",
  "Life & learning",
] as const;
export type Topic = (typeof topics)[number];

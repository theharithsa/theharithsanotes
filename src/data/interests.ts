export { books } from "./books.ts";
export type { Book } from "./books.ts";

export interface ListeningNote {
  html?: string;
  slug: string;
  artLabel: string;
  title: string;
  show: string;
  status: "Listened" | "On my list" | "Created";
  kind?: "listening" | "created";
  image?: string;
  href: string;
  note: string;
}
export const listening: ListeningNote[] = [
  {
    slug: "strong-friendships",
    artLabel: "Human connection",
    title: "Why strong friendships matter",
    show: "Simon Sinek · The Diary of a CEO",
    status: "Listened",
    href: "https://open.spotify.com/episode/0TFCthQHSsDut7LSMPGpJo",
    note: "Friendships need intention and acts of service to stay alive. A conversation about connection, community, and making room for people.",
  },
  {
    slug: "vibe-coding-agentic-engineering",
    artLabel: "Ideas in code",
    title: "From Vibe Coding to Agentic Engineering",
    show: "Andrej Karpathy · Sequoia Capital",
    status: "Listened",
    href: "https://youtu.be/96jN2OCOfLs",
    note: "You can outsource thinking, never understanding. A useful distinction as AI takes on more of the work of building software.",
  },
  {
    slug: "stoic-friendship",
    artLabel: "A good friend",
    title: "How to Be a Better Friend, According to the Stoics",
    show: "Ryan Holiday · The Daily Stoic",
    status: "Listened",
    href: "https://open.spotify.com/episode/3E1Kq5STewyhgU3yf3NaBL",
    note: "Fortune and fate do not target us personally. A short reflection on friendship and the way we interpret what happens to us.",
  },
  {
    slug: "amazon-blue-origin",
    artLabel: "Long horizons",
    title: "Amazon and Blue Origin",
    show: "Jeff Bezos · Lex Fridman Podcast #405",
    status: "On my list",
    href: "https://youtu.be/DcWqzZ3I2cY",
    note: "Amazon’s origins, space exploration, leadership principles, and thinking about the future of humanity.",
  },
  {
    slug: "software-fundamentals",
    artLabel: "Build to understand",
    title: "Software Fundamentals Matter More Than Ever",
    show: "Matt Pocock · YouTube",
    status: "On my list",
    href: "https://youtu.be/v4F1gFy-hqg",
    note: "A conversation on engineering fundamentals and why building with AI still calls for a strong understanding of software.",
  },
];

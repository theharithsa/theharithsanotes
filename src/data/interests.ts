export interface Book {
  title: string;
  author: string;
  status: "Reading" | "Read" | "To read";
  colour: string;
}
export const books: Book[] = [
  {
    title: "DevOps for Dummies",
    author: "Emily Freeman",
    status: "Reading",
    colour: "blue",
  },
  {
    title: "The Rules of Work",
    author: "Richard Templar",
    status: "Reading",
    colour: "sage",
  },
  { title: "Adiyogi", author: "Sadhguru", status: "Reading", colour: "ochre" },
  {
    title: "The Power of Positive Thinking",
    author: "Norman Vincent Peale",
    status: "Reading",
    colour: "peach",
  },
  {
    title: "Freedom from the Known",
    author: "J. Krishnamurti",
    status: "Read",
    colour: "lilac",
  },
  {
    title: "The Heart of Success",
    author: "Om Swami",
    status: "Read",
    colour: "peach",
  },
  {
    title: "Who Will Cry When You Die?",
    author: "Robin Sharma",
    status: "Read",
    colour: "sage",
  },
  {
    title: "The Seven Spiritual Laws of Success",
    author: "Deepak Chopra",
    status: "Read",
    colour: "blue",
  },
  {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    status: "Read",
    colour: "ochre",
  },
  {
    title: "Eat That Frog!",
    author: "Brian Tracy",
    status: "Read",
    colour: "lilac",
  },
  {
    title: "The Decision Book",
    author: "Mikael Krogerus & Roman Tschäppeler",
    status: "To read",
    colour: "sage",
  },
  {
    title: "The Question Book",
    author: "Mikael Krogerus & Roman Tschäppeler",
    status: "To read",
    colour: "peach",
  },
];
export interface ListeningNote {
  title: string;
  show: string;
  status: "Listened" | "On my list";
  href: string;
  note: string;
}
export const listening: ListeningNote[] = [
  {
    title: "Why strong friendships matter",
    show: "Simon Sinek · The Diary of a CEO",
    status: "Listened",
    href: "https://open.spotify.com/episode/0TFCthQHSsDut7LSMPGpJo",
    note: "Friendships need intention and acts of service to stay alive. A conversation about connection, community, and making room for people.",
  },
  {
    title: "From Vibe Coding to Agentic Engineering",
    show: "Andrej Karpathy · Sequoia Capital",
    status: "Listened",
    href: "https://youtu.be/96jN2OCOfLs",
    note: "You can outsource thinking, never understanding. A useful distinction as AI takes on more of the work of building software.",
  },
  {
    title: "How to Be a Better Friend, According to the Stoics",
    show: "Ryan Holiday · The Daily Stoic",
    status: "Listened",
    href: "https://open.spotify.com/episode/3E1Kq5STewyhgU3yf3NaBL",
    note: "Fortune and fate do not target us personally. A short reflection on friendship and the way we interpret what happens to us.",
  },
  {
    title: "Amazon and Blue Origin",
    show: "Jeff Bezos · Lex Fridman Podcast #405",
    status: "On my list",
    href: "https://youtu.be/DcWqzZ3I2cY",
    note: "Amazon’s origins, space exploration, leadership principles, and thinking about the future of humanity.",
  },
  {
    title: "Software Fundamentals Matter More Than Ever",
    show: "Matt Pocock · YouTube",
    status: "On my list",
    href: "https://youtu.be/v4F1gFy-hqg",
    note: "A conversation on engineering fundamentals and why building with AI still calls for a strong understanding of software.",
  },
];

import importedBooks from "./goodreads-books.json" with { type: "json" };

export interface GoodreadsEntry {
  sourceReviewId: string;
  title: string;
  author: string;
  rating: number;
  shelves: string[];
  review: string;
  dateRead: string[];
  goodreadsUrl: string;
  reviewUrl: string;
}
export interface Book {
  title: string;
  author: string;
  status: "Reading" | "Read" | "To read";
  colour: string;
  slug?: string;
  goodreads?: GoodreadsEntry;
}
const colours = ["blue", "peach", "lilac", "sage", "ochre"];
export const completedBooks: Book[] = importedBooks.map((entry, index) => ({
  title: entry.title,
  author: entry.author.includes(",")
    ? entry.author
        .split(",")
        .reverse()
        .map((part) => part.trim())
        .join(" ")
    : entry.author,
  status: "Read",
  colour: colours[index % colours.length]!,
  slug:
    entry.goodreadsUrl
      .split("/")
      .pop()!
      .replace(/^\d+[.-]?/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || entry.sourceReviewId,
  goodreads: entry,
}));
// Preserve the remaining Notion shelf without duplicating completed Goodreads books.
export const books: Book[] = [
  ...completedBooks,
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

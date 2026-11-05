import importedBooks from "./goodreads-books.json" with { type: "json" };
import bookGenres from "./book-genres.json" with { type: "json" };

export const genres = [
  "Science & nature",
  "Personal growth",
  "Mindfulness & spirituality",
  "Business & leadership",
  "Creativity",
  "Biography",
  "Fiction",
  "Communication",
];
const genresByReview: Record<string, string[]> = bookGenres;

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
  status: "Read";
  genres: string[];
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
  genres: genresByReview[entry.sourceReviewId] ?? [],
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
export const books = completedBooks;

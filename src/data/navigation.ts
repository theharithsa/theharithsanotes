export const navigation = [
  {
    label: "Blog",
    href: "/blogs",
    tone: "blue",
    title: "Ideas worth a closer look.",
    description: "Observability, AI, and lessons from work and life.",
    image: "/images/navigation/blogs-portrait-v1.png",
    links: [
      { label: "All articles", href: "/blogs" },
      { label: "Observability", href: "/blogs?topic=Observability" },
      { label: "AI & building", href: "/blogs?topic=AI%20%26%20building" },
      { label: "Life & learning", href: "/blogs?topic=Life%20%26%20learning" },
    ],
  },
  {
    label: "Books",
    href: "/books",
    tone: "peach",
    title: "Another page, another perspective.",
    description: "A home for reading notes and the library I’m building.",
    image: "/images/navigation/books-portrait-v1.png",
    links: [
      { label: "The reading room", href: "/books" },
      {
        label: "Manahsmriti Books ↗",
        href: "https://manahsmriti-books.web.app",
      },
    ],
  },
  {
    label: "Podcasts",
    href: "/podcasts",
    tone: "lilac",
    title: "Make room for a good conversation.",
    description: "A place for episodes, ideas, and listening notes.",
    image: "/images/navigation/podcasts-portrait-v1.png",
    links: [
      { label: "Listening", href: "/podcasts" },
      { label: "Created", href: "/podcasts/created" },
    ],
  },
  {
    label: "Projects",
    href: "/projects",
    tone: "sage",
    title: "From a question to something useful.",
    description:
      "Small experiments, open-source tools, and products for everyday life.",
    image: "/images/navigation/projects-portrait-v1.png",
    links: [
      { label: "All projects", href: "/projects" },
      { label: "SalesDrone", href: "/projects/salesdrone" },
      { label: "Aroha Retreat", href: "/projects/aroha-retreat" },
      { label: "FinVision AI", href: "/projects/finvision-ai" },
      { label: "Budget Buddy", href: "/projects/budget-buddy" },
      { label: "Open source", href: "/projects#open-source" },
    ],
  },
  {
    label: "Entertainment",
    href: "/entertainment",
    tone: "ochre",
    title: "The story after the credits.",
    description: "Movies, series, and the lessons that follow us into life.",
    image: "/images/navigation/entertainment-portrait-v1.png",
    links: [
      { label: "Screen notes", href: "/entertainment" },
      { label: "Subservience", href: "/entertainment/subservience" },
      { label: "Made in Korea", href: "/entertainment/made-in-korea" },
      {
        label: "Oh My Ghost Clients",
        href: "/entertainment/oh-my-ghost-clients",
      },
      {
        label: "Lessons from Senna",
        href: "/chasing-greatness-lessons-from-ayrton-senna-for-navigating-corporate-life",
      },
    ],
  },
  {
    label: "Meet Vish",
    href: "/meet-vish",
    tone: "peach",
    title: "Hello. I’m Vishruth.",
    description: "Engineer, builder, and a person with plenty left to learn.",
    image: "/images/navigation/meet-vish-portrait-v1.png",
    links: [
      { label: "My story", href: "/meet-vish" },
      { label: "Life in photographs", href: "/gallery" },
      { label: "Let’s connect ↗", href: "https://topmate.io/theharithsa" },
    ],
  },
] as const;

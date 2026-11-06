export interface JournalPage {
  slug: string;
  title: string;
  description: string;
  paragraphs: string[];
  image?: string;
  heading?: string;
  featuredProjects?: string[];
}
export const pageDefaults: JournalPage[] = [
  {
    slug: "home",
    title: "The Harithsa Notes",
    heading: "So much to be curious about.",
    description: "Technology. Stories. Everyday discoveries.",
    paragraphs: ["Welcome to my little corner of the internet."],
    featuredProjects: ["aroha-retreat", "copilot-otel"],
    image: "/images/curiosity-editorial.webp",
  },
  {
    slug: "meet-vish",
    title: "Meet Vish",
    heading: "Call me Vish.",
    description: "Engineer. Builder. Still a student of the world.",
    paragraphs: [
      "I’m a Senior Customer Success Engineer at Dynatrace. My work brings together observability, OpenTelemetry, and AI tooling—helping engineers make sense of what’s happening inside their software.",
      "Outside that, you’ll find me building side projects, reading, listening to long conversations, or writing down a thought before it disappears. These pages bring those parts of my life together.",
    ],
    image: "/images/gallery/portrait-seated.webp",
  },
];
pageDefaults.push(
  {
    slug: "blogs",
    title: "Blog",
    heading: "Blog",
    description:
      "Making sense of systems, technology, and the occasional life lesson.",
    paragraphs: [],
  },
  {
    slug: "books",
    title: "Books",
    heading: "A whole world.\nOne page away.",
    description:
      "Books read, and plenty of ideas still unfolding. My ratings, notes from the margins, and new perspectives to return to.",
    paragraphs: [],
  },
  {
    slug: "projects",
    title: "Projects",
    heading: "A few ideas.\nOut in the world.",
    description:
      "Some start with a problem. Others with a little curiosity. These are the products, tools and experiments I keep coming back to.",
    paragraphs: [],
  },
  {
    slug: "podcasts",
    title: "Podcasts",
    heading: "Pull up a chair.\nStay for a conversation.",
    description:
      "Ideas I’ve listened to, a few takeaways, and the episodes on my list.",
    paragraphs: [],
  },
  {
    slug: "entertainment",
    title: "Entertainment",
    heading: "Entertainment",
    description: "The story ends. The thinking doesn’t.",
    paragraphs: [],
  },
  {
    slug: "gallery",
    title: "Photos",
    heading: "Life,\nin frames.",
    description:
      "The people, conversations, and small moments that don’t quite fit into a technical article. A few pages from my camera roll.",
    paragraphs: [],
  },
  {
    slug: "gogs",
    title: "Games and Gadget",
    heading: "Press pause.\nFind a little wonder.",
    description:
      "A space for the games I play, the gadgets I use, and the little experiences that make life more interesting.",
    paragraphs: [],
  },
  {
    slug: "privacy",
    title: "Privacy",
    heading: "A note on privacy.",
    description: "Your visit, your choice.",
    paragraphs: [],
  },
);

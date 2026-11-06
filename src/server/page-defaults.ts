export interface JournalPage {
  slug: string;
  title: string;
  description: string;
  paragraphs: string[];
  html?: string;
  image?: string;
  imageAlt?: string;
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
    description: "Curious about life. Still learning what to make of it.",
    paragraphs: [
      "I like understanding things. Sometimes that means figuring out why a piece of code refuses to work. Sometimes it means listening to someone’s story, getting lost in a book, or sitting with a question about my own life. Many of the things I build and write begin with those questions.",
      "Between 2016 and 2019, I lived away from home while trying to start a business. I was young, hot-headed, and impatient to make something of myself. I put myself into the rush of the world before I understood how harsh it could be. Those years taught me about technology, surviving without money, and the consequences of my own decisions. What we do in a difficult moment can stay with us long after that moment has passed.",
      "But I also experienced beautiful friendships. There were people who supported me, conversations that changed my thinking, and things I learned that I still use today. When I look back at those three years, I remember the chaos and the people who helped me live through it.",
      "Spoorthi was my best friend during that time. She was discovering her creativity then, and I’ve seen her grow into an accomplished creative person. Her way of seeing things has stayed with me. That friendship, and the creativity it brought into my life, is a memory I want to carry forward.",
      "Today, I’m a Lead Technical Account Manager at Dynatrace, based in Bengaluru. I work with observability, OpenTelemetry, AI, and customer success—helping people understand their systems and find a way through problems. I’m also enjoying coding again. I built SalesDrone because my uncle needed a better way to manage his sales leads, and I’m the tech partner for my friend Mithun’s Aroha Retreat at Hrudhi Farms. I love making something that helps the people around me.",
      "This website brings those parts of my life together through artistic design and illustrations. The blog artwork is my dedication to those three years away from home. The bright oranges, rising suns, technology, and human connections represent how that time feels in my memory: a bright, restless mind meeting a world that could be cruel, while still finding friendship, support, and reasons to keep learning. Spoorthi’s creativity is part of the inspiration behind that expression.",
      "The quieter design around those illustrations reflects where I am now. I wanted smoother shapes, calmer spaces, and a site you could explore without feeling overwhelmed. Somewhere you could read, find your way around, and get to know me at your own pace.",
      "I recently moved into my new home, Manahsmriti. Hearing that name makes me feel pure, happy, peaceful, and calm. After a long time, I’ve started to feel great again. That feeling belongs here too.",
      "I write so you can feel something of what I felt, learn from my experiences and research, and find something useful for your own life. These pages hold the questions, friendships, mistakes, and discoveries that have shaped me—and the things I’m still trying to understand.",
    ],
    html: '<p><strong>I like understanding things.</strong> Sometimes that means figuring out why a piece of code refuses to work. Sometimes it means listening to someone’s story, getting lost in a book, or sitting with a question about my own life. Many of the things I build and write begin with those questions.</p>\n<p><strong>Between 2016 and 2019</strong>, I lived away from home while trying to start a business. I was young, hot-headed, and impatient to make something of myself. I put myself into the rush of the world before I understood how harsh it could be. Those years taught me about technology, surviving without money, and the consequences of my own decisions. What we do in a difficult moment can stay with us long after that moment has passed.</p>\n<p>But I also experienced <em>beautiful friendships</em>. There were people who supported me, conversations that changed my thinking, and things I learned that I still use today. When I look back at those three years, I remember the chaos and the people who helped me live through it.</p>\n<p><a href="https://unsplash.com/@sayspoorthi">Spoorthi</a> was my best friend during that time. She was discovering her creativity then, and I’ve seen her grow into an accomplished creative person. Her way of seeing things has stayed with me. That friendship, and the creativity it brought into my life, is a memory I want to carry forward.</p>\n<p>Today, I’m a <strong>Lead Technical Account Manager at Dynatrace</strong>, based in Bengaluru. I work with observability, OpenTelemetry, AI, and customer success—helping people understand their systems and find a way through problems. I’m also enjoying coding again. I built <strong>SalesDrone</strong> because my uncle needed a better way to manage his sales leads, and I’m the tech partner for my friend Mithun’s <strong>Aroha Retreat at Hrudhi Farms</strong>. I love making something that helps the people around me.</p>\n<p>This website brings those parts of my life together through <strong>artistic design and illustrations</strong>. The blog artwork is my dedication to those three years away from home. The bright oranges, rising suns, technology, and human connections represent how that time feels in my memory: a bright, restless mind meeting a world that could be cruel, while still finding friendship, support, and reasons to keep learning. Spoorthi’s creativity is part of the inspiration behind that expression.</p>\n<p><em>The quieter design</em> around those illustrations reflects where I am now. I wanted smoother shapes, calmer spaces, and a site you could explore without feeling overwhelmed. Somewhere you could read, find your way around, and get to know me at your own pace.</p>\n<p>I recently moved into my new home, <strong>Manahsmriti</strong>. Hearing that name makes me feel <em>pure, happy, peaceful, and calm</em>. After a long time, I’ve started to feel great again. That feeling belongs here too.</p>\n<blockquote><p>I write so you can feel something of what I felt, learn from my experiences and research, and find something useful for your own life. These pages hold the questions, friendships, mistakes, and discoveries that have shaped me—and the things I’m still trying to understand.</p></blockquote>',
    image: "/images/vish-watercolor-portrait.webp",
    imageAlt:
      "Expressive watercolor portrait of Vishruth smiling in glasses and a casual T-shirt",
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

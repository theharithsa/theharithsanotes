export interface Project {
  slug: string;
  title: string;
  category: string;
  description: string;
  href: string;
  source?: string;
  image?: string;
  imageAlt?: string;
  colour: string;
}
export const projects: Project[] = [
  {
    slug: "salesdrone",
    title: "SalesDrone",
    category: "AI & tools",
    description:
      "A sales workspace that carries the story behind every enquiry—from the first conversation to the next follow-up. Built with React, Firebase, and Gemini.",
    href: "https://sales-drone-avinya.firebaseapp.com",
    source: "https://github.com/theharithsa/SalesDrone",
    image: "/images/projects/salesdrone.jpg",
    imageAlt: "SalesDrone dashboard displaying fictional demonstration leads",
    colour: "blue",
  },
  {
    slug: "aroha-retreat",
    title: "Aroha Retreat",
    category: "People & places",
    description:
      "A living, photographic website for a retreat, with a nature-led experience and a host studio for content and bookings.",
    href: "https://aroha-retreat.web.app",
    source: "https://github.com/ArohaRetreat/website",
    image: "/images/projects/aroha.webp",
    imageAlt: "The natural landscape featured on the Aroha Retreat website",
    colour: "sage",
  },
  {
    slug: "finvision-ai",
    title: "FinVision AI",
    category: "Money & planning",
    description:
      "A financial planning tool for modern India: explore wealth projections, tax planning, and the life goals you’re working towards.",
    href: "https://finvision-ai.web.app/",
    image: "/images/projects/planning-editorial.webp",
    imageAlt:
      "Original editorial illustration of a growing tree, rupee coins, a compass, and a paper boat travelling towards the horizon",
    colour: "ochre",
  },
  {
    slug: "budget-buddy",
    title: "Budget Buddy / FinBuddy",
    category: "Money & planning",
    description:
      "Making everyday money easier to understand. Expense tracking, budgets, shared spending, and a KautilyaAI assistant in one personal finance app.",
    href: "https://myfinbuddy.in",
    source: "https://github.com/theharithsa/budget-buddy",
    image: "/images/curiosity-editorial.webp",
    imageAlt:
      "Original notebook illustration representing curiosity, learning, and making plans",
    colour: "terracotta",
  },
  {
    slug: "dt-mac-agent",
    title: "dt-mac-agent",
    category: "Observability",
    description:
      "Lightweight macOS monitoring built with Bash and system tools. Collects CPU, memory, disk, network, battery, processes, and running apps, and sends health signals to Dynatrace.",
    href: "https://github.com/theharithsa/dt-mac-agent",
    colour: "blue",
  },
  {
    slug: "chaicart",
    title: "ChaiCart",
    category: "People & places",
    description:
      "Learn cloud computing by building a chai startup—and keeping it alive through outages, surprises, and a little friendly competition.",
    href: "https://theharithsa.github.io/chaicart-cloud-workshop/",
    source: "https://github.com/theharithsa/chaicart-cloud-workshop",
    colour: "ochre",
  },
  {
    slug: "inspiredlearning",
    title: "InspiredLearning",
    category: "People & places",
    description:
      "A lasting home for workshop learners, bringing participation, quiz results, learning credits, and certificates into a personal learning journey.",
    href: "https://inspiredlearning-vh.web.app",
    source: "https://github.com/theharithsa/inspiredlearning",
    colour: "blue",
  },
  {
    slug: "copilot-otel",
    title: "Copilot, meet OpenTelemetry",
    category: "Observability",
    description:
      "Reusable instrumentation that helps developers see the model calls, tool execution, token usage, and latency inside Copilot SDK agents.",
    href: "https://github.com/theharithsa/github_copilot_otel",
    colour: "sage",
  },
  {
    slug: "salesdrone-mcp",
    title: "SalesDrone MCP",
    category: "AI & tools",
    description:
      "A scoped, read-only bridge between a sales workspace and compatible AI assistants, built on the same permission-aware SalesDrone API.",
    href: "https://github.com/theharithsa/salesdrone-mcp",
    colour: "terracotta",
  },
  {
    slug: "manahsmriti",
    title: "Manahsmriti Books",
    category: "People & places",
    description:
      "A little home for a love of books: a searchable shared catalog and a private, synced library for each reader.",
    href: "https://manahsmriti-books.web.app",
    source: "https://github.com/theharithsa/manahsmriti",
    colour: "sage",
  },
  {
    slug: "app-launchpad",
    title: "App Launchpad",
    category: "AI & tools",
    description:
      "An application foundation that makes decisions, delivery evidence, and observability part of building from the very beginning.",
    href: "https://github.com/theharithsa/app-launchpad-template",
    colour: "blue",
  },
  {
    slug: "dynatrace-mcp",
    title: "Dynatrace MCP",
    category: "Observability",
    description:
      "Open-source contributions connecting AI assistants with observability context, including work on the Dynatrace MCP server.",
    href: "https://github.com/dynatrace-oss/dynatrace-mcp",
    colour: "blue",
  },
];

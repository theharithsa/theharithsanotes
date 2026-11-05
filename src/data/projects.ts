export interface Project {
  slug: string;
  title: string;
  category: string;
  description: string;
  href: string;
  source: string;
  image: string;
  imageAlt: string;
  colour: string;
  overview: string[];
  features: { title: string; description: string }[];
  stack: string[];
  linkLabel: string;
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
    image: "/images/projects/salesdrone-editorial-v2.png",
    imageAlt:
      "An illustrated conversation flows from a phone call to a follow-up calendar",
    colour: "blue",
    overview: [
      "SalesDrone keeps the context behind an enquiry together: who you spoke to, what they said, where the lead stands and what needs to happen next. It is a sales workspace for founders and small teams who need more continuity than a spreadsheet can offer.",
      "The app combines a searchable lead list with conversation timelines, tasks and dashboard views. Gemini can turn recorded notes into suggested follow-ups, while people review the dates and decide what to do.",
    ],
    features: [
      {
        title: "Conversation history",
        description:
          "Calls, comments and stage changes stay attached to the lead, so the next conversation starts with context.",
      },
      {
        title: "Import and organize",
        description:
          "Map spreadsheet fields, bring in leads and filter the workspace by the information your team uses.",
      },
      {
        title: "Follow through",
        description:
          "Manage reminders and tasks; review AI suggestions with the ability to edit or undo them.",
      },
      {
        title: "Controlled integrations",
        description:
          "Google sign-in, server-enforced membership and scoped access tokens support the workspace and its integrations.",
      },
    ],
    stack: ["React", "TypeScript", "Firebase", "Gemini"],
    linkLabel: "Visit SalesDrone",
  },
  {
    slug: "aroha-retreat",
    title: "Aroha Retreat",
    category: "People & places",
    description:
      "A living, photographic website for a retreat, with a nature-led experience and a host studio for content and bookings.",
    href: "https://aroha-retreat.web.app",
    source: "https://github.com/ArohaRetreat/website",
    image: "/images/projects/aroha-retreat-editorial-v2.png",
    imageAlt:
      "An imagined guesthouse through an open doorway, with a booking calendar and key",
    colour: "sage",
    overview: [
      "Aroha Retreat brings the experience of a place and the work of hosting into one website. The public journey introduces the retreat through photographs and visit information; the authenticated Host Studio gives hosts a place to manage content and bookings.",
      "The booking system distinguishes day visits, shared stays, private rooms and event enquiries. Requests pass through host approval, so availability and offers remain a conversation with the people running the retreat.",
    ],
    features: [
      {
        title: "Discover the retreat",
        description:
          "A photographic public website introduces the place and the ways guests can visit.",
      },
      {
        title: "Request a visit",
        description:
          "Different booking journeys support day outings, overnight stays and exclusive events.",
      },
      {
        title: "Host operations",
        description:
          "A permission-controlled studio brings calendars, room readiness, offers and content editing together.",
      },
      {
        title: "Separate responsibilities",
        description:
          "The website and Firebase API live here; Natura owns the separate design standards and farm-atlas tooling.",
      },
    ],
    stack: [
      "Firebase Hosting",
      "Firebase Authentication",
      "Cloud Functions",
      "Host Studio",
    ],
    linkLabel: "Visit Aroha Retreat",
  },
  {
    slug: "finvision-ai",
    title: "FinVision AI",
    category: "Money & planning",
    description:
      "A financial planning tool for modern India: explore wealth projections, tax planning, and the life goals you’re working towards.",
    href: "https://finvision-ai.web.app/",
    source: "https://github.com/spmsuhas/finvision-ai",
    image: "/images/projects/finvision-ai-editorial-v2.png",
    imageAlt:
      "A reader studies a financial map with alternative paths and goal markers",
    colour: "ochre",
    overview: [
      "FinVision AI is a visual financial-planning workspace. Instead of looking at investments, liabilities, expenses and goals in isolation, it brings them into a plan that can be explored over time.",
      "The application combines deterministic financial calculations with a Gemini-powered AI Advisor. Its year-by-year projections account for expenses, salary growth and asset allocation; charts and downloadable reports make the plan easier to explore. The open-source repository is maintained at spmsuhas/finvision-ai.",
    ],
    features: [
      {
        title: "Build a financial picture",
        description:
          "Organize personal details, investments, liabilities, assets, expenses and life goals.",
      },
      {
        title: "Explore scenarios",
        description:
          "Compare a base plan with projections and inspect a year-by-year trajectory.",
      },
      {
        title: "Connect goals and funding",
        description:
          "See goal allocations, contributions and remaining funding gaps together.",
      },
      {
        title: "Review the plan",
        description:
          "The interface provides tax comparison, report export and a beta AI Advisor.",
      },
    ],
    stack: [
      "JavaScript",
      "Vite",
      "Tailwind CSS",
      "Chart.js",
      "Firebase",
      "Gemini",
    ],
    linkLabel: "Open FinVision AI",
  },
  {
    slug: "budget-buddy",
    title: "Budget Buddy / FinBuddy",
    category: "Money & planning",
    description:
      "Making everyday money easier to understand. Expense tracking, budgets, shared spending, and a KautilyaAI assistant in one personal finance app.",
    href: "https://myfinbuddy.in",
    source: "https://github.com/theharithsa/budget-buddy",
    image: "/images/projects/budget-buddy-editorial-v2.png",
    imageAlt:
      "A hand sorts rupee coins into budget envelopes beside a receipt and spending chart",
    colour: "terracotta",
    overview: [
      "Budget Buddy grew into FinBuddy: a personal finance app for understanding everyday spending, setting budgets and keeping shared expenses in view. The focus is the relationship between small transactions and the bigger monthly picture.",
      "Alongside expense and budget tools, KautilyaAI adds a conversational layer inspired by Arthashastra principles. A metrics explorer offers different ways to break down spending, using filters and visualizations.",
    ],
    features: [
      {
        title: "Capture spending",
        description:
          "Record expenses, attach receipts and use recurring templates for repeated entries.",
      },
      {
        title: "Budget with context",
        description:
          "Track category budgets over different periods and review earlier months.",
      },
      {
        title: "Share the picture",
        description: "Track people and split costs with friends or family.",
      },
      {
        title: "Explore patterns",
        description:
          "Use spending charts, custom metrics and KautilyaAI questions to investigate the recorded data.",
      },
    ],
    stack: ["React", "TypeScript", "Firebase", "Gemini"],
    linkLabel: "Visit FinBuddy",
  },
  {
    slug: "dt-mac-agent",
    title: "dt-mac-agent",
    category: "Observability",
    description:
      "Lightweight macOS monitoring built with Bash and system tools. Collects CPU, memory, disk, network, battery, processes, and running apps, and sends health signals to Dynatrace.",
    href: "https://github.com/theharithsa/dt-mac-agent/blob/main/README.md",
    colour: "blue",
    image: "/images/projects/dt-mac-agent-editorial-v2.png",
    imageAlt:
      "A laptop observatory connects a CPU, disk and battery to monitoring signals",
    overview: [
      "dt-mac-agent brings macOS health signals into Dynatrace using Bash and tools already available on the machine. It collects CPU, memory, disk, network, battery, process and application information without adding a heavyweight runtime.",
      "A launchd daemon performs collection, while a separate watchdog checks that the agent is alive. The repository also includes a MacOS Health Center dashboard and command-line controls for inspecting the local agent.",
    ],
    features: [
      {
        title: "Machine health",
        description:
          "Collect resource usage, battery health, top processes and running application measurements.",
      },
      {
        title: "Resilient collection",
        description:
          "Buffer failed batches locally and retry them within the documented retention window.",
      },
      {
        title: "Agent operations",
        description:
          "Inspect status and metrics through dtmacctl, with local logs for troubleshooting.",
      },
      {
        title: "Dynatrace context",
        description:
          "Attach host dimensions and use the bundled dashboard to explore the collected signals.",
      },
    ],
    stack: ["Bash", "macOS", "launchd", "Dynatrace"],
    linkLabel: "Read the agent guide",
    source: "https://github.com/theharithsa/dt-mac-agent",
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
    image: "/images/projects/chaicart-editorial-v2.png",
    imageAlt:
      "A chai stall and its customers connected to cloud servers and an outage warning",
    overview: [
      "ChaiCart turns cloud computing into something you can run, break and understand. In this two-day workshop, engineering students become founders of a fictional ten-minute chai delivery startup.",
      "The first day is about building in the cloud. The second introduces outages, cost surprises and an observability murder mystery. Slides, printable activities and a companion demo make the technical ideas tangible.",
    ],
    features: [
      {
        title: "Build a cloud business",
        description:
          "Explore service models, architecture and cloud-native ideas through the chai startup.",
      },
      {
        title: "Investigate an outage",
        description:
          "Use logs, metrics, traces and change evidence in the Who Killed Checkout? activity.",
      },
      {
        title: "Run the room",
        description:
          "Facilitator guides, activity cards and reference quizzes support the workshop.",
      },
      {
        title: "Keep learning",
        description:
          "The materials link to a separate live workshop workspace and the permanent learner portal.",
      },
    ],
    stack: ["HTML / CSS", "JavaScript", "Node.js demo", "Azure / Dynatrace"],
    linkLabel: "Explore the workshop",
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
    image: "/images/projects/inspiredlearning-editorial-v2.png",
    imageAlt: "A learner follows workshop and quiz steps towards a certificate",
    overview: [
      "InspiredLearning gives workshop participation a lasting home. A learner can return to their account to see reviewed results, personal quiz outcomes, learning credits and issued certificates after the workshop ends.",
      "The portal separates a learner’s record from the staff workflow that verifies attendance and publishes completion. Certificate verification is optional and public only when the learner enables it.",
    ],
    features: [
      {
        title: "A lasting record",
        description:
          "Keep participation history, individual outcomes and activity summaries in one account.",
      },
      {
        title: "Credits with history",
        description:
          "Reviewed workshop results and signed adjustments contribute to a unified credit total.",
      },
      {
        title: "Certificates",
        description:
          "Download authenticated certificate PDFs and optionally enable public verification.",
      },
      {
        title: "Reviewed corrections",
        description:
          "Staff permissions and learner requests support attendance review, corrections and revocation.",
      },
    ],
    stack: ["React", "Vite", "Firebase", "Cloud Functions"],
    linkLabel: "Open the learner portal",
  },
  {
    slug: "copilot-otel",
    title: "Copilot, meet OpenTelemetry",
    category: "Observability",
    description:
      "Reusable instrumentation that helps developers see the model calls, tool execution, token usage, and latency inside Copilot SDK agents.",
    href: "https://www.npmjs.com/package/@theharithsa/github_copilot_otel",
    colour: "sage",
    image: "/images/projects/copilot-otel-editorial-v2.png",
    imageAlt:
      "A magnifying glass reveals agent traces, tools, tokens and latency",
    overview: [
      "Copilot, meet OpenTelemetry is reusable instrumentation for applications built with the GitHub Copilot SDK. It makes the work inside an AI agent visible: model calls, tool executions, token usage and response time.",
      "The package subscribes to SDK session events and turns them into OpenTelemetry spans and metrics. A session-level span connects the model and tool activity, with OTLP export to Dynatrace.",
    ],
    features: [
      {
        title: "Trace the agent",
        description:
          "Follow the session from a user prompt through model responses and tool execution.",
      },
      {
        title: "Measure usage",
        description: "Record token usage by model and direction.",
      },
      {
        title: "Understand latency",
        description:
          "Capture response-time histograms and tool outcomes alongside traces.",
      },
      {
        title: "Control content capture",
        description:
          "Prompt and completion text capture is opt-in rather than enabled by default.",
      },
    ],
    stack: ["Node.js", "Copilot SDK", "OpenTelemetry", "OTLP"],
    linkLabel: "Explore the package",
    source: "https://github.com/theharithsa/github_copilot_otel",
  },
  {
    slug: "salesdrone-mcp",
    title: "SalesDrone MCP",
    category: "AI & tools",
    description:
      "A scoped, read-only bridge between a sales workspace and compatible AI assistants, built on the same permission-aware SalesDrone API.",
    href: "https://www.npmjs.com/package/@theharithsa/salesdrone-mcp",
    colour: "terracotta",
    image: "/images/projects/salesdrone-mcp-editorial-v2.png",
    imageAlt: "Sales records cross a locked read-only bridge to an assistant",
    overview: [
      "SalesDrone MCP lets compatible local AI assistants read the current sales workspace through a scoped API. It is a separate package from the SalesDrone app, connected over the Model Context Protocol.",
      "Its tools read leads, tasks, recorded activity and permitted workspace information. The API enforces token scopes and current membership; the adapter does not offer arbitrary requests or writes to business records.",
    ],
    features: [
      {
        title: "Read with context",
        description:
          "Retrieve lead details, journeys, tasks and recorded conversations.",
      },
      {
        title: "Respect permissions",
        description:
          "Use the same scoped HTTP API as SalesDrone, with expiry and revocation enforced there.",
      },
      {
        title: "Connect locally",
        description:
          "Run as a local stdio MCP server from a compatible assistant.",
      },
      {
        title: "Keep interpretation honest",
        description:
          "Team activity describes recorded work, not online presence or an employee rating.",
      },
    ],
    stack: ["Node.js", "TypeScript", "MCP / stdio", "SalesDrone API"],
    linkLabel: "View the npm package",
    source: "https://github.com/theharithsa/salesdrone-mcp",
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
    image: "/images/projects/manahsmriti-editorial-v2.png",
    imageAlt: "A hand finds a book through a catalog and shelf-location cards",
    overview: [
      "Manahsmriti Books is a home for keeping track of a real book collection. It combines a searchable shared catalog with a separate private library for each signed-in reader.",
      "The practical details matter here: shelf locations, verification status, search, sorting and a wardrobe map help connect the catalog to physical books. Firestore synchronizes changes across devices.",
    ],
    features: [
      {
        title: "Find a book",
        description:
          "Search titles and authors, sort the catalog and filter by shelf.",
      },
      {
        title: "Keep a private library",
        description:
          "Copy shared entries into a personal catalog with access scoped to the signed-in reader.",
      },
      {
        title: "Locate the physical copy",
        description:
          "Use shelf locations and the wardrobe map to connect records with the collection.",
      },
      {
        title: "Move your data",
        description:
          "JSON import/export and CSV export support catalog maintenance.",
      },
    ],
    stack: ["JavaScript", "Firebase Authentication", "Firestore", "Vite"],
    linkLabel: "Visit Manahsmriti Books",
  },
  {
    slug: "app-launchpad",
    title: "App Launchpad",
    category: "AI & tools",
    description:
      "An application foundation that makes decisions, delivery evidence, and observability part of building from the very beginning.",
    href: "https://github.com/theharithsa/app-launchpad-template/blob/main/README.md",
    colour: "blue",
    image: "/images/projects/app-launchpad-editorial-v2.png",
    imageAlt:
      "People assemble an application from code, discovery and testing sheets",
    overview: [
      "App Launchpad is a reusable foundation for building and enhancing applications with deliberate decisions, service context and delivery evidence. It starts with how a project is understood and maintained, before prescribing a product stack.",
      "The template is stack-neutral and opinionated about Dynatrace observability. Agent instructions, service skills, discovery checks and issue-linked delivery make the project easier to continue across people and sessions.",
    ],
    features: [
      {
        title: "Start with decisions",
        description:
          "Record product, architecture and hosting choices before dependent implementation.",
      },
      {
        title: "Keep service context",
        description:
          "Service skills and continuation notes connect code with current operating knowledge.",
      },
      {
        title: "Deliver with evidence",
        description:
          "Issue forms, PR guidance and execution records distinguish checks from deployments.",
      },
      {
        title: "Adapt the foundation",
        description:
          "Choose the application stack and add its real build, test and release checks.",
      },
    ],
    stack: [
      "Repository template",
      "Python checks",
      "GitHub Actions",
      "Dynatrace guidance",
    ],
    linkLabel: "Explore the template",
    source: "https://github.com/theharithsa/app-launchpad-template",
  },
  {
    slug: "dynatrace-mcp",
    title: "Dynatrace MCP",
    category: "Observability",
    description:
      "Open-source contributions connecting AI assistants with observability context, including work on the Dynatrace MCP server.",
    href: "https://github.com/dynatrace-oss/dynatrace-mcp/blob/main/README.md",
    colour: "blue",
    image: "/images/projects/dynatrace-mcp-editorial-v2.png",
    imageAlt:
      "Collaborators connect an assistant to service nodes, traces and logs",
    overview: [
      "This open-source work connects AI assistants with Dynatrace observability context through the Model Context Protocol. It sits alongside my wider interest in instrumentation, investigation and bringing useful operational context into developer tools.",
      "The local server exposes tools for querying data, finding entities and investigating problems. This is a shared dynatrace-oss project, rather than an app I claim to have built alone.",
    ],
    features: [
      {
        title: "Bring context to an assistant",
        description:
          "Make observability information available inside a compatible MCP client.",
      },
      {
        title: "Investigate signals",
        description:
          "Explore problems, entities, logs and traces with the server’s documented tools.",
      },
      {
        title: "Work with DQL",
        description:
          "The project includes query execution, verification and natural-language assistance.",
      },
      {
        title: "Understand its lifecycle",
        description:
          "The README marks this local server deprecated at version 2.1.2 and links to maintained alternatives.",
      },
    ],
    stack: ["TypeScript", "Node.js", "MCP", "Dynatrace"],
    linkLabel: "Read the project documentation",
    source: "https://github.com/dynatrace-oss/dynatrace-mcp",
  },
];

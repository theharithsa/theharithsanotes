/** Owner profiles: existing site data, Medium imports and public GitHub profile links. */
export const socialProfiles = [
  { name: "GitHub", href: "https://github.com/theharithsa", icon: "github" },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/theharithsa/",
    icon: "linkedin",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/theharithsa",
    icon: "instagram",
  },
  {
    name: "Unsplash",
    href: "https://unsplash.com/@harithsa",
    icon: "unsplash",
  },
  { name: "X", href: "https://twitter.com/theharithsa", icon: "x" },
  { name: "Medium", href: "https://medium.com/@theharithsa", icon: "medium" },
  { name: "DEV", href: "https://dev.to/theharithsa", icon: "dev" },
  { name: "npm", href: "https://www.npmjs.com/~theharithsa", icon: "npm" },
  { name: "Topmate", href: "https://topmate.io/theharithsa", icon: "topmate" },
] as const;
export type SocialIconName = (typeof socialProfiles)[number]["icon"] | "rss";

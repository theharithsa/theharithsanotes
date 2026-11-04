export interface GalleryPhoto {
  src: string;
  title: string;
  caption: string;
  alt: string;
  width: number;
  height: number;
  shape: "wide" | "portrait" | "square";
}
export const portrait = "/images/gallery/portrait-seated.webp";
export const avatar = "/images/gallery/portrait-close.webp";
export const gallery: GalleryPhoto[] = [
  {
    src: "/images/gallery/innovate-team.webp",
    title: "Better, together.",
    caption: "A moment with the team at Dynatrace Innovate, Mumbai.",
    alt: "Vishruth and colleagues sharing a lighthearted moment at a Dynatrace event",
    width: 1800,
    height: 1350,
    shape: "wide",
  },
  {
    src: "/images/gallery/portrait-close.webp",
    title: "The person behind the notes.",
    caption: "A pause from the usual tabs, terminals, and to-do lists.",
    alt: "Studio portrait of Vishruth smiling in a light jacket",
    width: 800,
    height: 800,
    shape: "square",
  },
  {
    src: "/images/gallery/cafe-moment.webp",
    title: "The conversations in between.",
    caption: "Some of the best ideas begin away from a screen.",
    alt: "Vishruth smiling during a conversation at a café table",
    width: 1200,
    height: 1594,
    shape: "portrait",
  },
  {
    src: "/images/gallery/innovate-stage.webp",
    title: "Out of the notebook.",
    caption: "People, ideas, and the energy of being in the room.",
    alt: "Vishruth with colleagues on the Dynatrace Innovate stage",
    width: 1600,
    height: 1519,
    shape: "square",
  },
  {
    src: "/images/gallery/people-and-perspective.webp",
    title: "More than the work.",
    caption: "Good company. A different kind of perspective.",
    alt: "Vishruth and friends gathered together at an evening venue",
    width: 1600,
    height: 1067,
    shape: "wide",
  },
  {
    src: "/images/gallery/cafe-conversation.webp",
    title: "Time for a proper catch-up.",
    caption: "The small moments belong in the story too.",
    alt: "Vishruth and a companion seated at a café table",
    width: 1200,
    height: 1600,
    shape: "portrait",
  },
];

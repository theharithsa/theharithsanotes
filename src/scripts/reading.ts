import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { firebaseConfig } from "../lib/firebase-config";

const auth = getAuth(getApps()[0] ?? initializeApp(firebaseConfig));
const node = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const message = node("reader-message");
let generation = 0;
interface Post {
  id: string;
  title: string;
  slug: string;
  date: string;
  description: string;
  image: string;
  imageAlt: string;
  html?: string;
  tags?: string[];
}
async function api<T>(path: string, method = "GET"): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in with the Google account Vish invited.");
  const response = await fetch(`/api/reading/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error?.message ?? "The reading room could not load. Try again.",
    );
  return result as T;
}
function clear(forgetAccess = false) {
  document
    .querySelectorAll<HTMLAnchorElement>(".reading-entry-link")
    .forEach((link) => {
      link.textContent = "Sign in";
      link.setAttribute("aria-label", "Sign in to the private reading room");
    });
  try {
    if (forgetAccess) localStorage.removeItem("harithsa.reader-ready");
  } catch {}
  node("reading-posts").replaceChildren();
  node("reading-body").replaceChildren();
  for (const id of ["reading-title", "reading-description", "reading-date"])
    node(id).textContent = "";
  node<HTMLImageElement>("reading-cover").removeAttribute("src");
  node("reading-content").hidden = true;
  node("reading-gate").hidden = false;
}
async function load() {
  const own = ++generation;
  clear();
  if (!auth.currentUser) {
    clear(true);
    message.textContent = "By invitation, with a little room for curiosity.";
    return;
  }
  message.textContent = "Opening your invitation…";
  try {
    await api("session", "POST");
    try {
      localStorage.setItem("harithsa.reader-ready", "true");
    } catch {}
    document
      .querySelectorAll<HTMLAnchorElement>(".reading-entry-link")
      .forEach((link) => {
        link.textContent = "People & Journal";
        link.setAttribute("aria-label", "Open People and Journal");
      });
    const segments = location.pathname.split("/").filter(Boolean);
    const section = segments[1] === "people" ? "people" : "journal";
    const slug = segments[2];
    if (slug) {
      const preview = new URLSearchParams(location.search).get("preview");
      const { post } = await api<{ post: Post }>(
        `${section}/${encodeURIComponent(slug)}${preview ? "?preview=" + encodeURIComponent(preview) : ""}`,
      );
      if (own !== generation) return;
      if (!preview && post.slug !== slug) {
        location.replace(
          `/people-and-journal/${section}/${encodeURIComponent(post.slug)}`,
        );
        return;
      }
      node("reading-title").textContent = post.title;
      node("reading-description").textContent = post.description;
      node("reading-date").textContent = formatDate(post.date);
      const cover = node<HTMLImageElement>("reading-cover");
      cover.src = post.image;
      cover.alt = post.imageAlt;
      node("reading-body").innerHTML = post.html ?? "";
      node<HTMLAnchorElement>("reader-back").href =
        `/people-and-journal/${section}`;
      node("reading-post").hidden = false;
      node("reading-posts").hidden = true;
    } else {
      const { posts } = await api<{ posts: Post[] }>(section);
      if (own !== generation) return;
      posts.sort((a, b) =>
        section === "journal"
          ? b.date.localeCompare(a.date)
          : a.title.localeCompare(b.title),
      );
      const grid = node("reading-posts");
      grid.hidden = false;
      node("reading-post").hidden = true;
      const timeline = document.createElement("nav");
      timeline.className = "journal-timeline private-timeline";
      timeline.setAttribute("aria-label", "Journal archive by year");
      const dated = document.createElement("div");
      const groups = new Map<string, HTMLElement>();
      const years = new Set<string>();
      grid.className =
        section === "journal" ? "blog-time-layout" : "notes-grid";
      if (section === "journal" && posts.length) grid.append(timeline, dated);
      for (const post of posts) {
        let destination = grid;
        if (section === "journal") {
          const month = post.date.slice(0, 7);
          let monthGrid = groups.get(month);
          if (!monthGrid) {
            const group = document.createElement("section");
            group.className = "blog-month-group";
            group.id = `private-month-${month}`;
            const heading = document.createElement("h2");
            heading.className = "archive-date-heading";
            heading.textContent = new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(new Date(`${month}-01T00:00:00Z`));
            monthGrid = document.createElement("div");
            monthGrid.className = "notes-grid";
            group.append(heading, monthGrid);
            dated.append(group);
            groups.set(month, monthGrid);
            const year = month.slice(0, 4);
            if (!years.has(year)) {
              const link = document.createElement("a");
              link.className = "timeline-year-button";
              link.href = `#${group.id}`;
              link.textContent = year;
              timeline.append(link);
              years.add(year);
            }
          }
          destination = monthGrid;
        }
        const card = document.createElement("article");
        card.className = "note-card";
        const href = `/people-and-journal/${section}/${encodeURIComponent(post.slug)}`;
        const cover = document.createElement("a");
        cover.className = "card-image-link";
        cover.href = href;
        cover.tabIndex = -1;
        cover.setAttribute("aria-hidden", "true");
        const image = document.createElement("img");
        image.src = post.image;
        image.alt = "";
        image.loading = "lazy";
        image.width = 1536;
        image.height = 1024;
        cover.append(image);
        const copy = document.createElement("div");
        copy.className = "card-copy";
        const category = document.createElement("span");
        category.className = "eyebrow";
        category.textContent =
          section === "journal" ? "From my journal" : "People in my story";
        const title = document.createElement("h3");
        const link = document.createElement("a");
        link.href = href;
        link.textContent = post.title;
        title.append(link);
        const intro = document.createElement("p");
        intro.textContent = post.description;
        const date = document.createElement("time");
        date.className = "note-meta";
        date.dateTime = post.date;
        date.textContent = formatDate(post.date);
        copy.append(category, title, intro, date);
        card.append(cover, copy);
        destination.append(card);
      }
      if (!posts.length) {
        const empty = document.createElement("p");
        empty.textContent =
          "This page of the notebook is still waiting to be written.";
        grid.append(empty);
      }
    }
    node("reading-gate").hidden = true;
    node("reading-content").hidden = false;
    document
      .querySelector<HTMLAnchorElement>(
        `.reading-categories a[href="/people-and-journal/${section}"]`,
      )
      ?.setAttribute("aria-current", "page");
  } catch (error) {
    if (own !== generation) return;
    clear(true);
    message.textContent =
      error instanceof Error ? error.message : "Try signing in again.";
  }
}
function formatDate(date: string) {
  const value = new Date(date);
  return Number.isFinite(value.getTime())
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(value)
    : "A note worth keeping";
}
node("reader-signin").addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  } catch {
    message.textContent = "Sign-in did not finish. You can try again.";
  }
});
node("reader-signout").addEventListener("click", async () => {
  generation++;
  clear(true);
  try {
    await fetch("/api/reading/session", {
      method: "DELETE",
      credentials: "same-origin",
    });
    await signOut(auth);
    message.textContent = "You’re signed out.";
  } catch {
    message.textContent = "Your sign-out could not finish. Please try again.";
  }
});
onAuthStateChanged(auth, () => void load());
window.addEventListener("pagehide", () => {
  generation++;
  clear();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) void load();
});

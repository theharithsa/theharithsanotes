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
function clear() {
  document
    .querySelectorAll<HTMLAnchorElement>(".reading-entry-link")
    .forEach((link) => {
      link.textContent = "Sign in";
      link.setAttribute("aria-label", "Sign in to the private reading room");
    });
  try {
    localStorage.removeItem("harithsa.reader-ready");
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
      for (const post of posts) {
        const link = document.createElement("a");
        link.className = "reading-card";
        link.href = `/people-and-journal/${section}/${encodeURIComponent(post.slug)}`;
        const image = document.createElement("img");
        image.src = post.image;
        image.alt = post.imageAlt;
        image.loading = "lazy";
        image.width = 1536;
        image.height = 1024;
        const copy = document.createElement("div");
        const date = document.createElement("small");
        date.textContent = formatDate(post.date);
        const title = document.createElement("h2");
        title.textContent = post.title;
        const intro = document.createElement("p");
        intro.textContent = post.description;
        copy.append(date, title, intro);
        link.append(image, copy);
        grid.append(link);
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
        `.reading-nav a[href="/people-and-journal/${section}"]`,
      )
      ?.setAttribute("aria-current", "page");
  } catch (error) {
    if (own !== generation) return;
    clear();
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
  clear();
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

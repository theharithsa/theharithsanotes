import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseConfig } from "../lib/firebase-config";

const auth = getAuth(getApps()[0] ?? initializeApp(firebaseConfig));
const node = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const message = node("reader-message");
let generation = 0;
let pendingRead: AbortController | undefined;
let signingOut = false;
let signOutFailed = false;
const sessions = new Set<Promise<unknown>>();
type Phase = "loading" | "ready" | "signed-out" | "denied" | "error";
function phase(value: Phase, detail?: string) {
  node("reading-room").dataset.state = value;
  node("reading-room").setAttribute("aria-busy", String(value === "loading"));
  node("reading-loading").hidden = value !== "loading" && value !== "error";
  node("reading-gate").hidden = value !== "signed-out" && value !== "denied";
  node("reading-content").hidden = value !== "ready";
  node("reader-retry").hidden = value !== "error";
  node("reader-loading-message").textContent =
    detail ?? "Opening your notebook…";
}
class ReaderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
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
async function api<T>(
  path: string,
  user: User,
  signal?: AbortSignal,
  method = "GET",
): Promise<T> {
  const token = await user.getIdToken();
  signal?.throwIfAborted();
  const response = await fetch(`/api/reading/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
    cache: "no-store",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
      : AbortSignal.timeout(30000),
  });
  const result = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new ReaderError(
      result.error?.message ?? "The reading room could not load. Try again.",
      response.status,
    );
  return result as T;
}
function clear(forgetAccess = false) {
  if (forgetAccess) {
    document
      .querySelectorAll<HTMLAnchorElement>(".reading-entry-link")
      .forEach((link) => {
        link.textContent = "Sign in";
        link.setAttribute("aria-label", "Sign in to the private reading room");
      });
  }
  try {
    if (forgetAccess) localStorage.removeItem("harithsa.reader-ready");
  } catch {}
  node("reading-posts").replaceChildren();
  node("reading-body").replaceChildren();
  for (const id of ["reading-title", "reading-description", "reading-date"])
    node(id).textContent = "";
  node<HTMLImageElement>("reading-cover").removeAttribute("src");
}
async function load() {
  const own = ++generation;
  pendingRead?.abort();
  pendingRead = new AbortController();
  const signal = pendingRead.signal;
  clear();
  phase("loading");
  if (signingOut) return;
  await auth.authStateReady();
  if (own !== generation) return;
  const user = auth.currentUser;
  if (!user) {
    clear(true);
    message.textContent = "By invitation, with a little room for curiosity.";
    phase("signed-out");
    return;
  }
  try {
    const session = api("session", user, undefined, "POST");
    sessions.add(session);
    void session.then(
      () => sessions.delete(session),
      () => sessions.delete(session),
    );
    const segments = location.pathname.split("/").filter(Boolean);
    const section = segments[1] === "people" ? "people" : "journal";
    const slug = segments[2];
    if (slug) {
      const preview = new URLSearchParams(location.search).get("preview");
      const [, { post }] = await Promise.all([
        session,
        api<{ post: Post }>(
          `${section}/${encodeURIComponent(slug)}${preview ? "?preview=" + encodeURIComponent(preview) : ""}`,
          user,
          signal,
        ),
      ]);
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
      const [, { posts }] = await Promise.all([
        session,
        api<{ posts: Post[] }>(section, user, signal),
      ]);
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
    if (own !== generation) return;
    try {
      localStorage.setItem("harithsa.reader-ready", "true");
    } catch {}
    document
      .querySelectorAll<HTMLAnchorElement>(".reading-entry-link")
      .forEach((link) => {
        link.textContent = "People & Journal";
        link.setAttribute("aria-label", "Open People and Journal");
      });
    phase("ready");
    document
      .querySelector<HTMLAnchorElement>(
        `.reading-categories a[href="/people-and-journal/${section}"]`,
      )
      ?.setAttribute("aria-current", "page");
  } catch (error) {
    if (own !== generation) return;
    pendingRead?.abort();
    clear();
    if (
      error instanceof ReaderError &&
      (error.status === 401 || error.status === 403)
    ) {
      clear(true);
      message.textContent = error.message;
      phase(error.status === 401 ? "signed-out" : "denied");
    } else {
      phase("error", "The notebook could not load. Please try again.");
    }
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
    const before = generation;
    await signInWithPopup(auth, provider);
    if (before === generation) void load();
  } catch {
    message.textContent = "Sign-in did not finish. You can try again.";
  }
});
node("reader-retry").addEventListener(
  "click",
  () => void (signOutFailed ? endSession() : load()),
);
async function endSession() {
  signingOut = true;
  generation++;
  pendingRead?.abort();
  clear(true);
  phase("loading", "Signing out…");
  try {
    await signOut(auth);
    // Let already-started session responses settle before deleting their cookie.
    await Promise.allSettled([...sessions]);
    const response = await fetch("/api/reading/session", {
      method: "DELETE",
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error("Session cleanup failed");
    signOutFailed = false;
    message.textContent = "You’re signed out.";
    phase("signed-out");
  } catch {
    signOutFailed = true;
    phase("error", "Your sign-out could not finish. Please try again.");
  } finally {
    signingOut = false;
  }
}
node("reader-signout").addEventListener("click", () => void endSession());
phase("loading");
onAuthStateChanged(auth, () => void load());
window.addEventListener("pagehide", () => {
  generation++;
  pendingRead?.abort();
  clear();
  phase("loading");
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) void load();
});

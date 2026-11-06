import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { AuthRestoration, type AuthPhase } from "../lib/auth-restoration";
import { firebaseConfig } from "../lib/firebase-config";
import type { Entry, EntryData, Section } from "../server/models";
import type { Editor } from "@tiptap/core";
import { setEditingAvailability } from "../lib/editor-state";
import { developerSettings } from "./developer-settings";

const auth = getAuth(getApps()[0] ?? initializeApp(firebaseConfig));
const descriptions: Record<
  Section,
  { title: string; kicker: string; description: string }
> = {
  journal: {
    title: "Journal",
    kicker: "THE PRIVATE NOTEBOOK",
    description: "Personal notes, shared only with people you invite.",
  },
  people: {
    title: "People",
    kicker: "THE PEOPLE IN YOUR STORY",
    description:
      "People, companions, and the stories you choose to share with invited readers.",
  },
  blogs: {
    title: "Blog",
    kicker: "THE WRITTEN WORD",
    description: "Ideas, essays, and the things you’re making sense of.",
  },
  books: {
    title: "Books",
    kicker: "THE READING ROOM",
    description:
      "The books you’ve finished, your ratings, and the notes you want to keep.",
  },
  projects: {
    title: "Projects",
    kicker: "FROM THE WORKBENCH",
    description: "What you’re building, how it works, and the story behind it.",
  },
  podcasts: {
    title: "Podcasts",
    kicker: "GOOD CONVERSATIONS",
    description:
      "Listening notes and conversations you create. Choose the collection inside each entry.",
  },
  entertainment: {
    title: "Entertainment",
    kicker: "AFTER THE CREDITS",
    description:
      "Films, series, and the lessons that find their way back into life.",
  },
  photos: {
    title: "Photos",
    kicker: "LIFE, IN FRAMES",
    description:
      "Add a moment, a caption, and a date when you know it. Undated photos stay undated.",
  },
  gogs: {
    title: "GoGs",
    kicker: "GAMES & GADGETS",
    description:
      "Your experiences with the worlds you play in and the things you live with.",
  },
  pages: {
    title: "Pages",
    kicker: "THE JOURNAL ITSELF",
    description: "Edit your section introductions, homepage and Meet Vish.",
  },
  tags: {
    title: "Tags",
    kicker: "A LITTLE ORGANISATION",
    description:
      "Keep useful topic, genre and tag labels for the entries you write.",
  },
};
const element = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const dialog = element<HTMLDialogElement>("cms-editor-dialog");
const form = element<HTMLFormElement>("cms-entry-fields");
const signin = element<HTMLButtonElement>("cms-signin");
const signout = element<HTMLButtonElement>("cms-signout");
const publishButton = element<HTMLButtonElement>("cms-publish");
const notice = element<HTMLElement>("cms-notice");
const search = element<HTMLInputElement>("cms-search");
const statusFilter = element<HTMLSelectElement>("cms-status");
let section: Section = "blogs";
let rows: Entry[] = [];
let nextCursor: string | null = null;
let current: Entry | null = null;
let rich: Editor | null = null;
let saveBlocked = false;
let dirtyVersion = 0;
let savedVersion = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saving: Promise<boolean> | null = null;
let loadingGeneration = 0;
let editorGeneration = 0;
let recoveryUid: string | null = null;
const sessionRequests = new Set<Promise<unknown>>();
let workspaceReady = false;
let busyAction = false;
let uploadTarget: string | ((url: string, alt: string) => void) | null = null;
const publishKeys = new Map<string, string>();
const developer = developerSettings(api);
let labelRows: Entry[] = [];
async function refreshWorkspace() {
  try {
    const result = await api<{ counts: Record<string, number> }>("workspace");
    document
      .querySelectorAll<HTMLElement>("[data-cms-count]")
      .forEach((node) => {
        node.textContent = String(result.counts[node.dataset.cmsCount!] ?? 0);
      });
    let cursor: string | null = null;
    labelRows = [];
    do {
      const result: { entries: Entry[]; next: string | null } = await api<{
        entries: Entry[];
        next: string | null;
      }>(
        "entries/tags" +
          (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""),
      );
      labelRows.push(...result.entries);
      cursor = result.next;
    } while (cursor && labelRows.length < 1000);
  } catch {
    message("Collection counts could not refresh. Your saved content is safe.");
  }
}
async function showWorkspace() {
  if (!workspaceReady) return;
  const dev = location.hash === "#developer";
  const visible =
    element("cms-restoring").closest<HTMLElement>(".cms-main")!.dataset
      .authState === "ready";
  element("cms-developer").hidden = !dev || !visible;
  element("cms-collection").hidden = dev || !visible;
  document
    .querySelector<HTMLElement>('[data-cms-view="developer"]')!
    .setAttribute("aria-current", dev ? "page" : "false");
  if (dev) {
    loadingGeneration++;
    collectionPhase("idle");
    element("cms-breadcrumb").textContent = "Developer Settings";
    document
      .querySelectorAll("[data-cms-section]")
      .forEach((link) => link.removeAttribute("aria-current"));
    await developer.open();
  } else {
    developer.clear();
    section = currentSection();
    await loadCollection();
  }
}
class RequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}
function message(value: string) {
  notice.textContent = value;
  notice.hidden = false;
}
function editorMessage(value: string) {
  element("cms-entry-message").textContent = value;
}
function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(date)
    : "—";
}
function today() {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Kolkata",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}
function status(
  entry: Entry,
): "draft" | "published" | "changes" | "unpublished" {
  return entry.publishedRevision === null
    ? entry.publishedAt
      ? "unpublished"
      : "draft"
    : entry.publishedRevision === entry.draftRevision
      ? "published"
      : "changes";
}
const stateLabels = {
  draft: "Draft",
  published: "Published",
  changes: "Published · draft changes",
  unpublished: "Unpublished",
};
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user)
    throw new RequestError("Sign in to continue", "UNAUTHENTICATED", 401);
  const authVersion = workspaceSession.version;
  const token = await user.getIdToken();
  if (
    authVersion !== workspaceSession.version ||
    user.uid !== auth.currentUser?.uid
  )
    throw new RequestError("Your session changed", "UNAUTHENTICATED", 401);
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`/api/cms/${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new RequestError(
      "The workspace is offline. Your unsaved changes are kept in this tab.",
      "OFFLINE",
      0,
    );
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error =
      result && typeof result === "object" && "error" in result
        ? (result as { error: { message?: string; code?: string } }).error
        : null;
    throw new RequestError(
      error?.message ??
        "This operation could not be completed. Try again shortly.",
      error?.code ?? "INTERNAL",
      response.status,
    );
  }
  if (
    authVersion !== workspaceSession.version ||
    user.uid !== auth.currentUser?.uid
  )
    throw new RequestError("Your session changed", "UNAUTHENTICATED", 401);
  return result as T;
}
function storageKey(id: string) {
  return `harithsa.cms.${recoveryUid ?? auth.currentUser?.uid ?? "signedout"}.${id}`;
}
function keepCopy() {
  if (!current) return;
  try {
    sessionStorage.setItem(
      storageKey(current.id),
      JSON.stringify({ revision: current.draftRevision, data: current.data }),
    );
  } catch {
    editorMessage(
      "Your browser cannot keep a recovery copy. Leave this tab open until the draft is saved.",
    );
  }
}
function removeCopy(id: string) {
  try {
    sessionStorage.removeItem(storageKey(id));
  } catch {}
}
function updateState() {
  form
    .querySelectorAll<
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
      | HTMLButtonElement
    >("input,textarea,select,button")
    .forEach((input) => (input.disabled = busyAction));
  setEditingAvailability(rich, busyAction);
  const dirty = dirtyVersion !== savedVersion;
  const label = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : current?.publishedRevision === current?.draftRevision
        ? "Published · saved"
        : "Saved draft";
  element("cms-save-state").textContent = label;
  publishButton.disabled =
    Boolean(saving) ||
    busyAction ||
    !current ||
    (!dirty && current.publishedRevision === current.draftRevision);
  publishButton.textContent =
    current?.publishedRevision === current?.draftRevision && !dirty
      ? "Published"
      : busyAction
        ? "Publishing…"
        : "Publish";
  element<HTMLButtonElement>("cms-save").disabled = !dirty || Boolean(saving);
  element<HTMLButtonElement>("cms-unpublish").hidden =
    !current ||
    current.publishedRevision === null ||
    current.section === "pages";
  element<HTMLButtonElement>("cms-preview").disabled =
    current?.section === "tags";
  element<HTMLButtonElement>("cms-preview").title =
    current?.section === "tags"
      ? "Labels appear in collection filters, not standalone pages"
      : "Preview the saved draft";
  if (current) {
    element("cms-entry-heading").textContent = String(
      current.data.title ?? "Untitled",
    );
    element("cms-publication-info").textContent =
      current.publishedRevision === null
        ? "Private draft. Only you can see it."
        : `Public revision ${current.publishedRevision} · ${dateLabel(current.publishedAt ?? current.updatedAt)}`;
  }
}
function getValue(path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      current?.data,
    );
}
function setValue(path: string, value: unknown) {
  if (!current) return;
  const keys = path.split(".");
  let target: Record<string, unknown> = current.data;
  for (const key of keys.slice(0, -1)) {
    if (!target[key] || typeof target[key] !== "object") target[key] = {};
    target = target[key] as Record<string, unknown>;
  }
  if (JSON.stringify(target[keys.at(-1)!]) === JSON.stringify(value)) return;
  target[keys.at(-1)!] = value;
  dirtyVersion++;
  keepCopy();
  updateState();
  clearTimeout(saveTimer);
  if (!saveBlocked)
    saveTimer = setTimeout(() => {
      void saveDraft();
    }, 850);
}
async function saveDraft(): Promise<boolean> {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (saving) return saving;
  if (!current || dirtyVersion === savedVersion) return true;
  const entry = current;
  const version = dirtyVersion;
  const data = structuredClone(entry.data);
  const operation = (async () => {
    try {
      const updated = await api<Entry>(`entries/${entry.section}/${entry.id}`, {
        method: "PUT",
        body: JSON.stringify({ data, expectedRevision: entry.draftRevision }),
      });
      if (current?.id === entry.id) {
        current.draftRevision = updated.draftRevision;
        current.updatedAt = updated.updatedAt;
        current.publishedRevision = updated.publishedRevision;
        current.publishedAt = updated.publishedAt;
        savedVersion = version;
        if (dirtyVersion === version) {
          current.data = updated.data;
          removeCopy(current.id);
        }
        editorMessage("");
      }
      const index = rows.findIndex((row) => row.id === updated.id);
      if (index >= 0) rows[index] = updated;
      renderRows();
      return true;
    } catch (error) {
      const failure =
        error instanceof RequestError
          ? error
          : new RequestError("The draft could not be saved", "INTERNAL", 500);
      editorMessage(failure.message);
      element("cms-save-state").textContent =
        failure.code === "OFFLINE"
          ? "Offline · kept in this tab"
          : failure.code === "REVISION_CONFLICT"
            ? "Conflict · reload latest"
            : "Not saved yet";
      if (failure.code === "REVISION_CONFLICT") {
        saveBlocked = true;
        showRecoveryButton();
      } else if (
        failure.status >= 400 &&
        failure.status < 500 &&
        failure.status !== 429
      )
        saveBlocked = true;
      else if (
        failure.status === 0 ||
        failure.status === 429 ||
        failure.status >= 500
      ) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(
          () => {
            void saveDraft();
          },
          failure.status === 429 ? 60000 : 15000,
        );
      }
      return false;
    } finally {
      saving = null;
      updateState();
      if (
        current?.id === entry.id &&
        dirtyVersion !== savedVersion &&
        !saveTimer &&
        !saveBlocked
      )
        saveTimer = setTimeout(() => {
          void saveDraft();
        }, 1000);
    }
  })();
  saving = operation;
  updateState();
  return operation;
}
async function flushSave(): Promise<boolean> {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  if (saving && !(await saving)) return false;
  if (dirtyVersion !== savedVersion && !(await saveDraft())) return false;
  return dirtyVersion === savedVersion;
}
function showRecoveryButton() {
  if (element("cms-entry-message").querySelector("button")) return;
  const button = document.createElement("button");
  button.className = "cms-quiet-button";
  button.type = "button";
  button.textContent = "Download my unsaved copy";
  button.addEventListener("click", () => {
    if (!current) return;
    const file = new Blob([JSON.stringify(current.data, null, 2)], {
      type: "application/json",
    });
    const href = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${String(current.data.slug ?? current.id)}-unsaved.json`;
    link.click();
    URL.revokeObjectURL(href);
  });
  element("cms-entry-message").append(" ", button);
  const reload = document.createElement("button");
  reload.className = "cms-quiet-button";
  reload.type = "button";
  reload.textContent = "Reload the saved version";
  reload.addEventListener("click", async () => {
    if (!current) return;
    const fresh = await api<Entry>(`entries/${current.section}/${current.id}`);
    current = fresh;
    saveBlocked = false;
    dirtyVersion = 0;
    savedVersion = 0;
    removeCopy(fresh.id);
    await renderEditor();
    editorMessage(
      "Reloaded the current saved draft. Use your downloaded copy to recover any text you still need.",
    );
  });
  element("cms-entry-message").append(" ", reload);
}
function renderRows() {
  if (element("cms-table-region").dataset.state === "loading") return;
  const body = element<HTMLTableSectionElement>("cms-rows");
  body.replaceChildren();
  const query = search.value.trim().toLowerCase();
  const filter = statusFilter.value;
  const visible = rows
    .filter(
      (row) =>
        (filter === "all" || status(row) === filter) &&
        JSON.stringify([
          row.data.title,
          row.data.description,
          row.data.author,
          row.data.category,
          row.data.tags,
        ])
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const row of visible) {
    const tr = document.createElement("tr");
    const name = document.createElement("td");
    const link = document.createElement("button");
    link.className = "cms-entry-link";
    link.type = "button";
    link.textContent = String(row.data.title ?? "Untitled");
    link.addEventListener("click", () => {
      void openEntry(row).catch(() =>
        editorMessage(
          "The editor could not open. Your saved content is unchanged. Refresh and try again.",
        ),
      );
    });
    name.append(link);
    tr.append(name);
    const state = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "cms-status-pill";
    pill.dataset.state = status(row);
    pill.textContent = stateLabels[status(row)];
    state.append(pill);
    tr.append(state);
    for (const value of [
      row.data.category ??
        row.data.topic ??
        row.data.kind ??
        row.data.author ??
        row.section,
      dateLabel(row.updatedAt),
      `v${row.draftRevision}`,
    ]) {
      const td = document.createElement("td");
      td.textContent = String(value);
      tr.append(td);
    }
    body.append(tr);
  }
  element("cms-row-count").textContent =
    `${visible.length} ${visible.length === 1 ? "entry" : "entries"}${nextCursor ? " · more available" : ""}`;
  element("cms-empty").hidden = visible.length !== 0;
  element<HTMLButtonElement>("cms-more").hidden = !nextCursor;
}
function collectionPhase(
  state: "idle" | "loading" | "appending" | "ready" | "error",
) {
  const pending = state === "loading" || state === "appending";
  element("cms-table-region").dataset.state = state;
  element("cms-table-region").setAttribute("aria-busy", String(pending));
  element("cms-collection-loading").hidden = !pending;
  element<HTMLButtonElement>("cms-more").disabled = pending;
}
async function loadCollection(append = false) {
  if (!workspaceReady) return;
  const generation = ++loadingGeneration;
  const target = section;
  const description = descriptions[target];
  element("cms-breadcrumb").textContent = description.title;
  element("cms-table-title").textContent = description.title;
  element("cms-table-kicker").textContent = description.kicker;
  element("cms-table-description").textContent = description.description;
  element<HTMLButtonElement>("cms-new").hidden = target === "pages";
  document
    .querySelectorAll<HTMLAnchorElement>("[data-cms-section]")
    .forEach((link) =>
      link.setAttribute(
        "aria-current",
        link.dataset.cmsSection === target ? "page" : "false",
      ),
    );
  if (!append) {
    rows = [];
    nextCursor = null;
    element("cms-rows").replaceChildren();
    element("cms-empty").hidden = true;
    element("cms-more").hidden = true;
  }
  collectionPhase(append ? "appending" : "loading");
  element("cms-row-count").textContent = append
    ? "Loading more entries…"
    : `Opening ${description.title}…`;
  try {
    const result = await api<{ entries: Entry[]; next: string | null }>(
      `entries/${target}${append && nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : ""}`,
    );
    if (generation !== loadingGeneration || !workspaceReady) return;
    rows = append ? [...rows, ...result.entries] : result.entries;
    nextCursor = result.next;
    collectionPhase("ready");
    renderRows();
    notice.hidden = true;
  } catch (error) {
    if (generation !== loadingGeneration || !workspaceReady) return;
    collectionPhase("error");
    message(error instanceof Error ? error.message : "Entries could not load");
    element("cms-row-count").textContent =
      "Could not load entries. Try Refresh.";
  }
}
function currentSection(): Section {
  const value = location.hash.slice(1);
  return Object.hasOwn(descriptions, value) ? (value as Section) : "blogs";
}
function defaultData(target: Section): EntryData {
  const slug = `untitled-${crypto.randomUUID().slice(0, 8)}`;
  const base = { title: "Untitled", slug };
  switch (target) {
    case "journal":
    case "people":
      return {
        ...base,
        date: today(),
        description: "",
        html: "",
        image: "",
        imageAlt: "",
        tags: [],
        audience: "invited",
        ...(target === "people" ? { relationship: "", species: "Human" } : {}),
      };
    case "blogs":
      return {
        ...base,
        description: "",
        date: today(),
        topic: "Life & learning",
        tags: [],
        image: "",
        imageAlt: "",
        minutes: 1,
        html: "",
        source: "",
        sourceLabel: "",
      };
    case "books":
      return {
        ...base,
        author: "",
        status: "Read",
        genres: [],
        colour: "blue",
        goodreads: {
          sourceReviewId: `manual-${crypto.randomUUID()}`,
          title: "Untitled",
          author: "",
          rating: 0,
          shelves: ["read"],
          review: "",
          dateRead: [],
          goodreadsUrl: "",
          reviewUrl: "",
        },
      };
    case "projects":
      return {
        ...base,
        category: "AI & tools",
        description: "",
        href: "",
        source: "",
        image: "",
        imageAlt: "",
        colour: "blue",
        overview: [],
        features: [],
        stack: [],
        linkLabel: "Explore the project",
      };
    case "podcasts":
      return {
        ...base,
        kind: "listening",
        artLabel: "A good conversation",
        show: "",
        status: "Listened",
        href: "",
        note: "",
        image: "",
      };
    case "entertainment":
      return {
        ...base,
        kind: "Movie",
        date: today(),
        headline: "",
        description: "",
        lesson: "",
        paragraphs: [],
        tone: "ochre",
        artwork: "A story worth keeping.",
        motif: "orbit",
        officialUrl: "",
        linkLabel: "About this title",
        poster: {
          src: "",
          alt: "",
          width: 1200,
          height: 1800,
          credit: "",
          source: "",
        },
      };
    case "photos":
      return {
        ...base,
        src: "",
        caption: "",
        alt: "",
        width: 1200,
        height: 800,
        shape: "wide",
        capturedAt: "",
        order: Date.now(),
      };
    case "gogs":
      return {
        ...base,
        kind: "Game",
        date: today(),
        description: "",
        html: "",
        image: "",
        imageAlt: "",
        tags: [],
      };
    case "tags":
      return { ...base, kind: "tag" };
    case "pages":
      return { ...base, description: "", paragraphs: [] };
  }
}
type Field = {
  path: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "tags"
    | "paragraphs"
    | "number"
    | "date"
    | "image"
    | "select";
  options?: string[];
  help?: string;
};
function fieldsFor(target: Section): Field[] {
  const base: Field[] = [
    { path: "title", label: target === "tags" ? "Label" : "Title" },
    {
      path: "slug",
      label: "Address",
      help: "A published address stays reserved. Older addresses redirect after you change it.",
    },
  ];
  switch (target) {
    case "journal":
    case "people":
      return [
        ...base,
        { path: "description", label: "Introduction", type: "textarea" },
        {
          path: "date",
          label:
            target === "people" ? "Known since / entry date" : "Entry date",
          type: "date",
        },
        { path: "tags", label: "Private tags", type: "tags" },
        { path: "image", label: "Private illustrated cover", type: "image" },
        { path: "imageAlt", label: "Describe the illustration" },
        ...(target === "people"
          ? [
              { path: "relationship", label: "Relationship" },
              {
                path: "species",
                label: "Companion",
                type: "select" as const,
                options: ["Human", "Dog", "Cat", "Other"],
              },
            ]
          : []),
      ];
    case "blogs":
      return [
        ...base,
        { path: "description", label: "Short introduction", type: "textarea" },
        { path: "date", label: "Publication date", type: "date" },
        { path: "topic", label: "Topic" },
        {
          path: "tags",
          label: "Tags",
          type: "tags",
          help: "Separate labels with commas.",
        },
        { path: "image", label: "Cover illustration", type: "image" },
        { path: "imageAlt", label: "Cover description" },
        { path: "minutes", label: "Reading time", type: "number" },
        { path: "source", label: "Original article link" },
        { path: "sourceLabel", label: "Original publication" },
      ];
    case "books":
      return [
        ...base,
        { path: "author", label: "Author" },
        { path: "genres", label: "Genres", type: "tags" },
        {
          path: "goodreads.rating",
          label: "My rating",
          type: "select",
          options: ["0", "1", "2", "3", "4", "5"],
          help: "0 means not rated; it is never shown as a score.",
        },
        {
          path: "goodreads.dateRead",
          label: "Finished",
          type: "tags",
          help: "Use your actual reading date, or leave it blank.",
        },
        { path: "goodreads.goodreadsUrl", label: "Goodreads link" },
        { path: "goodreads.reviewUrl", label: "Review source link" },
        {
          path: "colour",
          label: "Jacket colour",
          type: "select",
          options: ["blue", "peach", "lilac", "sage", "ochre"],
        },
        { path: "goodreads.review", label: "My review", type: "textarea" },
      ];
    case "projects":
      return [
        ...base,
        { path: "category", label: "Topic" },
        { path: "description", label: "Introduction", type: "textarea" },
        { path: "image", label: "Project illustration", type: "image" },
        { path: "imageAlt", label: "Image description" },
        {
          path: "overview",
          label: "Project story",
          type: "paragraphs",
          help: "Separate paragraphs with a blank line.",
        },
        { path: "stack", label: "Built with", type: "tags" },
        { path: "href", label: "Live project link" },
        { path: "linkLabel", label: "Link wording" },
        { path: "source", label: "GitHub repository" },
      ];
    case "podcasts":
      return [
        ...base,
        {
          path: "kind",
          label: "Collection",
          type: "select",
          options: ["listening", "created"],
        },
        { path: "show", label: "Show / creator" },
        { path: "href", label: "Episode link" },
        {
          path: "status",
          label: "Status",
          type: "select",
          options: ["Listened", "On my list", "Created"],
        },
        { path: "artLabel", label: "Artwork label" },
        {
          path: "image",
          label: "Cover image",
          type: "image",
          help: "Leave blank to use the journal’s record artwork.",
        },
        { path: "note", label: "Listening / episode notes", type: "textarea" },
      ];
    case "entertainment":
      return [
        ...base,
        {
          path: "kind",
          label: "Type",
          type: "select",
          options: ["Movie", "Series"],
        },
        { path: "date", label: "Journal date", type: "date" },
        { path: "headline", label: "Reflection headline" },
        { path: "description", label: "Introduction", type: "textarea" },
        { path: "lesson", label: "What stayed with me", type: "textarea" },
        { path: "paragraphs", label: "The reflection", type: "paragraphs" },
        { path: "officialUrl", label: "Official title link" },
        { path: "linkLabel", label: "Link wording" },
        { path: "poster.src", label: "Real poster", type: "image" },
        { path: "poster.alt", label: "Poster description" },
        { path: "poster.credit", label: "Poster credit" },
        { path: "poster.source", label: "Poster source" },
        { path: "artwork", label: "Archive artwork wording" },
        {
          path: "tone",
          label: "Archive tone",
          type: "select",
          options: ["sage", "ochre", "blue", "lilac", "peach"],
        },
        {
          path: "motif",
          label: "Archive motif",
          type: "select",
          options: ["sunrise", "orbit", "steps", "balance", "conversation"],
        },
      ];
    case "photos":
      return [
        base[0]!,
        { path: "src", label: "Photograph", type: "image" },
        { path: "alt", label: "Image description" },
        { path: "caption", label: "Caption", type: "textarea" },
        {
          path: "capturedAt",
          label: "Taken on",
          help: "YYYY-MM-DD, YYYY-MM or YYYY. Leave blank if you don’t know.",
        },
        { path: "order", label: "Journal order", type: "number" },
        {
          path: "shape",
          label: "Shape",
          type: "select",
          options: ["wide", "portrait", "square"],
        },
      ];
    case "gogs":
      return [
        ...base,
        {
          path: "kind",
          label: "Collection",
          type: "select",
          options: ["Game", "Gadget"],
        },
        { path: "date", label: "Experience date", type: "date" },
        { path: "description", label: "Introduction", type: "textarea" },
        { path: "image", label: "Cover", type: "image" },
        { path: "imageAlt", label: "Image description" },
        { path: "tags", label: "Tags", type: "tags" },
      ];
    case "pages":
      return [
        { path: "title", label: "Page name" },
        {
          path: "heading",
          label: "Main heading",
          type: "textarea",
          help: "Separate headline lines with a line break.",
        },
        {
          path: "description",
          label: "Welcome / introduction",
          type: "textarea",
        },
        ...(current?.data.slug === "meet-vish"
          ? []
          : [
              {
                path: "paragraphs",
                label: "Page paragraphs",
                type: "paragraphs" as const,
              },
            ]),
        {
          path: "image",
          label: "Page / social image",
          type: "image",
          help: "Home and Meet Vish use this on the page; other sections use it for their social preview.",
        },
        { path: "imageAlt", label: "Image description" },
        ...(current?.data.slug === "home"
          ? [
              {
                path: "portraitImage",
                label: "Personal portrait",
                type: "image" as const,
                help: "A square image for Home’s Meet Vish section. The full image stays visible on desktop and mobile.",
              },
              {
                path: "portraitImageAlt",
                label: "Personal portrait description",
              },
              {
                path: "featuredProjects",
                label: "Featured projects",
                type: "tags" as const,
                help: "Project addresses, separated with commas. The first two appear on Home.",
              },
            ]
          : []),
      ];
    case "tags":
      return [
        ...base,
        {
          path: "kind",
          label: "Label type",
          type: "select",
          options: ["topic", "genre", "tag"],
        },
      ];
  }
}
function createField(field: Field) {
  const wrapper = document.createElement("div");
  wrapper.className = "cms-field";
  const label = document.createElement("label");
  const id = `cms-field-${field.path.replaceAll(".", "-")}`;
  label.htmlFor = id;
  label.textContent = field.label;
  wrapper.append(label);
  const holder = document.createElement("div");
  const value = getValue(field.path);
  let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  if (field.type === "textarea" || field.type === "paragraphs") {
    input = document.createElement("textarea");
    input.rows = field.path === "goodreads.review" ? 12 : 4;
  } else if (field.type === "select") {
    input = document.createElement("select");
    for (const option of field.options ?? []) {
      const item = document.createElement("option");
      item.value = option;
      item.textContent =
        option === "0" && field.path.includes("rating") ? "Not rated" : option;
      input.append(item);
    }
  } else {
    input = document.createElement("input");
    input.type =
      field.type === "number"
        ? "number"
        : field.type === "date"
          ? "date"
          : "text";
  }
  input.id = id;
  if (
    input instanceof HTMLInputElement &&
    ["tags", "genres", "topic", "category"].includes(field.path)
  ) {
    const list = document.createElement("datalist");
    list.id = id + "-options";
    for (const row of labelRows) {
      const option = document.createElement("option");
      option.value = String(row.data.title);
      list.append(option);
    }
    holder.append(list);
    input.setAttribute("list", list.id);
  }
  input.name = field.path;
  input.value = Array.isArray(value)
    ? value.join(field.type === "paragraphs" ? "\n\n" : ", ")
    : field.type === "date"
      ? String(value ?? "").slice(0, 10)
      : String(value ?? "");
  input.addEventListener(field.type === "select" ? "change" : "input", () => {
    let result: unknown = input.value;
    if (field.type === "tags")
      result = input.value
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    if (field.type === "paragraphs")
      result = input.value
        .split(/\n\s*\n/)
        .map((value) => value.trim())
        .filter(Boolean);
    if (field.type === "number" || field.path === "goodreads.rating")
      result = Number(input.value);
    setValue(field.path, result);
    if (field.path === "kind" && current?.section === "podcasts")
      setValue("status", input.value === "created" ? "Created" : "Listened");
  });
  if (field.path === "title")
    input.addEventListener("blur", () => {
      if (
        current?.publishedRevision === null &&
        String(current.data.slug ?? "").startsWith("untitled-") &&
        input.value.trim() !== "Untitled"
      ) {
        const slug = slugify(input.value) || String(current.data.slug);
        setValue("slug", slug);
        const slugInput = element<HTMLInputElement>("cms-field-slug");
        if (slugInput) slugInput.value = slug;
      }
    });
  if (field.type === "image") {
    const row = document.createElement("div");
    row.className = "cms-image-row";
    row.append(input);
    const upload = document.createElement("button");
    upload.type = "button";
    upload.className = "cms-quiet-button";
    upload.textContent = "Upload";
    upload.addEventListener("click", () => {
      uploadTarget = field.path;
      element<HTMLInputElement>("cms-file").click();
    });
    row.append(upload);
    holder.append(row);
    if (typeof value === "string" && value) {
      const img = document.createElement("img");
      img.src = value;
      img.alt = "Current image preview";
      img.className = "cms-image-preview";
      holder.append(img);
    }
  } else holder.append(input);
  if (field.help) {
    const help = document.createElement("small");
    help.textContent = field.help;
    holder.append(help);
  }
  wrapper.append(holder);
  form.append(wrapper);
}
function createFeatures() {
  const wrapper = document.createElement("div");
  wrapper.className = "cms-field";
  const label = document.createElement("label");
  label.textContent = "Features";
  wrapper.append(label);
  const list = document.createElement("div");
  list.className = "cms-feature-list";
  const values = Array.isArray(getValue("features"))
    ? (getValue("features") as Array<{ title: string; description: string }>)
    : [];
  values.forEach((feature, index) => {
    const card = document.createElement("div");
    card.className = "cms-feature-card";
    const name = document.createElement("input");
    name.value = feature.title;
    name.placeholder = "Feature name";
    name.setAttribute("aria-label", `Feature ${index + 1} name`);
    name.addEventListener("input", () =>
      setValue(`features.${index}.title`, name.value),
    );
    const description = document.createElement("textarea");
    description.value = feature.description;
    description.placeholder = "What does it do?";
    description.setAttribute("aria-label", `Feature ${index + 1} description`);
    description.addEventListener("input", () =>
      setValue(`features.${index}.description`, description.value),
    );
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "cms-quiet-button";
    remove.textContent = "Remove feature";
    remove.addEventListener("click", () => {
      setValue(
        "features",
        (
          getValue("features") as Array<{ title: string; description: string }>
        ).filter((_, i) => i !== index),
      );
      void renderEditor();
    });
    card.append(name, description, remove);
    list.append(card);
  });
  const add = document.createElement("button");
  add.type = "button";
  add.className = "cms-quiet-button";
  add.textContent = "+ Add a feature";
  add.addEventListener("click", () => {
    setValue("features", [
      ...(getValue("features") as Array<{
        title: string;
        description: string;
      }>),
      { title: "", description: "" },
    ]);
    void renderEditor();
  });
  list.append(add);
  wrapper.append(list);
  form.append(wrapper);
}
async function createRichEditor(generation: number) {
  const [
    { Editor, Node, Extension },
    { default: StarterKit },
    { default: Image },
    { TableKit },
    { default: Placeholder },
  ] = await Promise.all([
    import("@tiptap/core"),
    import("@tiptap/starter-kit"),
    import("@tiptap/extension-image"),
    import("@tiptap/extension-table"),
    import("@tiptap/extension-placeholder"),
  ]);
  if (!current || !dialog.open || generation !== editorGeneration) return;
  const editingId = current.id;
  const field = document.createElement("div");
  field.className = "cms-rich-field";
  const label = document.createElement("label");
  label.textContent = "The story";
  const toolbar = document.createElement("div");
  toolbar.className = "cms-rich-toolbar";
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Article formatting");
  const host = document.createElement("div");
  host.className = "cms-rich-editor";
  field.append(label, toolbar, host);
  form.append(field);
  const Figure = Node.create({
    name: "journalFigure",
    group: "block",
    content: "block+",
    parseHTML: () => [{ tag: "figure" }],
    renderHTML: () => ["figure", 0],
  });
  const Caption = Node.create({
    name: "journalCaption",
    group: "block",
    content: "inline*",
    parseHTML: () => [{ tag: "figcaption" }],
    renderHTML: () => ["figcaption", 0],
  });
  const Anchors = Extension.create({
    name: "journalAnchors",
    addGlobalAttributes: () => [
      {
        types: ["heading"],
        attributes: {
          id: {
            default: null,
            parseHTML: (element) => element.getAttribute("id"),
            renderHTML: (attributes) =>
              attributes.id ? { id: attributes.id } : {},
          },
        },
      },
    ],
  });
  rich = new Editor({
    element: host,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false },
      }),
      Image,
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({
        placeholder: "Start with a thought. Give it some room.",
      }),
      Figure,
      Caption,
      Anchors,
    ],
    content: String(
      current.data.html ??
        (current.section === "pages" && Array.isArray(current.data.paragraphs)
          ? current.data.paragraphs
              .map((text) => {
                const paragraph = document.createElement("p");
                paragraph.textContent = String(text);
                return paragraph.outerHTML;
              })
              .join("")
          : ""),
    ),
    editorProps: {
      attributes: {
        "aria-label": "Article content",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => {
      if (current?.id !== editingId) return;
      setValue("html", editor.getHTML());
      if (current.section === "pages") {
        const paragraphs: string[] = [];
        editor.state.doc.forEach((node) => {
          if (node.textContent.trim()) paragraphs.push(node.textContent);
        });
        setValue("paragraphs", paragraphs);
      }
      if (current.section === "blogs")
        setValue(
          "minutes",
          Math.max(
            1,
            Math.ceil(
              editor.getText().split(/\s+/).filter(Boolean).length / 220,
            ),
          ),
        );
    },
  });
  const commands: Array<[string, (editor: Editor) => void]> = [
    [
      "Text",
      (editor) => {
        editor.chain().focus().setParagraph().run();
      },
    ],
    [
      "Heading",
      (editor) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      },
    ],
    [
      "Small heading",
      (editor) => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      },
    ],
    [
      "Bold",
      (editor) => {
        editor.chain().focus().toggleBold().run();
      },
    ],
    [
      "Italic",
      (editor) => {
        editor.chain().focus().toggleItalic().run();
      },
    ],
    [
      "List",
      (editor) => {
        editor.chain().focus().toggleBulletList().run();
      },
    ],
    [
      "Numbered",
      (editor) => {
        editor.chain().focus().toggleOrderedList().run();
      },
    ],
    [
      "Quote",
      (editor) => {
        editor.chain().focus().toggleBlockquote().run();
      },
    ],
    [
      "Code",
      (editor) => {
        editor.chain().focus().toggleCodeBlock().run();
      },
    ],
    [
      "Divider",
      (editor) => {
        editor.chain().focus().setHorizontalRule().run();
      },
    ],
    [
      "Link",
      (editor) => {
        const href = prompt(
          "Paste a web link",
          String(editor.getAttributes("link").href ?? ""),
        );
        if (href === null) return;
        if (href && !/^(https?:\/\/|mailto:)/.test(href)) {
          editorMessage("Use a complete https:// link.");
          return;
        }
        if (href) editor.chain().focus().setLink({ href }).run();
        else editor.chain().focus().unsetLink().run();
      },
    ],
    [
      "Table",
      (editor) => {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    ],
    [
      "Image",
      (editor) => {
        uploadTarget = (url, alt) => {
          if (!editor.isDestroyed)
            editor.chain().focus().setImage({ src: url, alt }).run();
        };
        element<HTMLInputElement>("cms-file").click();
      },
    ],
  ];
  for (const [name, run] of commands) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.setAttribute("aria-label", name);
    button.addEventListener("click", () => {
      if (rich) run(rich);
    });
    toolbar.append(button);
  }
}
async function renderEditor() {
  const generation = ++editorGeneration;
  rich?.destroy();
  rich = null;
  form.replaceChildren();
  if (!current) return;
  element("cms-editor-collection").textContent =
    descriptions[current.section].title;
  element("cms-revision-list").hidden = true;
  fieldsFor(current.section).forEach(createField);
  if (current.section === "projects") createFeatures();
  if (
    ["blogs", "gogs", "journal", "people"].includes(current.section) ||
    (current.section === "pages" && current.data.slug === "meet-vish")
  )
    await createRichEditor(generation);
  updateState();
}
async function openEntry(entry: Entry) {
  if (current && dialog.open && !(await flushSave())) return;
  clearTimeout(saveTimer);
  saveTimer = undefined;
  current = structuredClone(entry);
  saveBlocked = false;
  dirtyVersion = 0;
  savedVersion = 0;
  editorMessage("");
  try {
    const recovery = JSON.parse(
      sessionStorage.getItem(storageKey(entry.id)) ?? "null",
    ) as { revision: number; data: EntryData } | null;
    if (recovery && recovery.revision === entry.draftRevision) {
      current.data = recovery.data;
      dirtyVersion = 1;
      editorMessage(
        "Recovered unsaved changes from this tab. Save the draft to keep them.",
      );
    }
  } catch {}
  if (!dialog.open) dialog.showModal();
  await renderEditor();
}
async function closeEditor() {
  if (busyAction) return;
  if (!(await flushSave())) return;
  rich?.destroy();
  rich = null;
  dialog.close();
  current = null;
}
async function refreshAudit() {
  try {
    const state = await api<{
      pending: number;
      blocked: number;
      configured: boolean;
    }>("audit");
    element("cms-audit-status").textContent = state.blocked
      ? `Audit delivery needs attention · ${state.blocked} blocked · ${state.pending} queued`
      : state.pending
        ? `${state.pending} audit events queued for delivery`
        : state.configured
          ? "Audit queue clear"
          : "Audit transport is not configured";
    element<HTMLButtonElement>("cms-audit-retry").hidden = state.blocked === 0;
  } catch {
    element("cms-audit-status").textContent =
      "Audit delivery status is temporarily unavailable";
  }
}
function publicPath(entry: Entry) {
  const slug = String(entry.data.slug ?? entry.id);
  if (["journal", "people"].includes(entry.section))
    return `/people-and-journal/${entry.section}/${slug}`;
  return entry.section === "blogs"
    ? `/${slug}`
    : entry.section === "photos"
      ? "/gallery"
      : entry.section === "pages"
        ? slug === "home"
          ? "/"
          : `/${slug}`
        : entry.section === "podcasts"
          ? `/podcasts/${entry.data.kind === "created" ? "created" : "listening"}/${slug}`
          : entry.section === "tags"
            ? "/blogs"
            : `/${entry.section}/${slug}`;
}

element<HTMLButtonElement>("cms-new").addEventListener("click", async () => {
  try {
    const entry = await api<Entry>(`entries/${section}`, {
      method: "POST",
      body: JSON.stringify({ data: defaultData(section) }),
    });
    rows.unshift(entry);
    renderRows();
    await openEntry(entry);
  } catch (error) {
    message(
      error instanceof Error ? error.message : "The entry could not be created",
    );
  }
});
element<HTMLButtonElement>("cms-save").addEventListener("click", () => {
  void flushSave();
});
element<HTMLButtonElement>("cms-close").addEventListener("click", () => {
  void closeEditor();
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  void closeEditor();
});
publishButton.addEventListener("click", async () => {
  if (!current || busyAction || !(await flushSave())) return;
  const entry = current;
  busyAction = true;
  updateState();
  const key = `${entry.id}:${entry.draftRevision}`;
  const idempotency = publishKeys.get(key) ?? crypto.randomUUID();
  publishKeys.set(key, idempotency);
  try {
    const updated = await api<Entry>(
      `entries/${entry.section}/${entry.id}/publish`,
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotency },
        body: JSON.stringify({ expectedRevision: entry.draftRevision }),
      },
    );
    current = updated;
    const index = rows.findIndex((row) => row.id === updated.id);
    if (index >= 0) rows[index] = updated;
    editorMessage(
      `Published revision ${updated.publishedRevision}. Public pages refresh within 30 seconds.`,
    );
    renderRows();
    void refreshAudit();
  } catch (error) {
    editorMessage(
      error instanceof Error
        ? error.message
        : "Publication could not be confirmed. Your draft is safe.",
    );
  } finally {
    busyAction = false;
    updateState();
  }
});
element<HTMLButtonElement>("cms-preview").addEventListener(
  "click",
  async () => {
    if (!current) return;
    const preview = window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    if (!(await flushSave())) {
      preview?.close();
      return;
    }
    const url = new URL(publicPath(current), location.origin);
    url.searchParams.set("preview", `${current.section}:${current.id}`);
    if (preview) preview.location.replace(url);
    else editorMessage("Allow pop-ups to open your private preview.");
  },
);
element<HTMLButtonElement>("cms-unpublish").addEventListener(
  "click",
  async () => {
    if (!current || busyAction || !(await flushSave())) return;
    if (
      !confirm(
        "Remove this entry from public pages? Your draft and revision history will stay in the workspace.",
      )
    )
      return;
    busyAction = true;
    try {
      updateState();
      current = await api<Entry>(
        `entries/${current.section}/${current.id}/unpublish`,
        {
          method: "POST",
          body: JSON.stringify({ expectedRevision: current.draftRevision }),
        },
      );
      rows = rows.map((row) => (row.id === current!.id ? current! : row));
      editorMessage(
        "Unpublished. Public caches expire within 30 seconds; your draft remains here.",
      );
      renderRows();
      void refreshAudit();
    } catch (error) {
      editorMessage(
        error instanceof Error
          ? error.message
          : "This entry could not be unpublished",
      );
    } finally {
      busyAction = false;
      updateState();
    }
  },
);
element<HTMLButtonElement>("cms-history").addEventListener(
  "click",
  async () => {
    if (!current || !(await flushSave())) return;
    const list = element("cms-revision-list");
    list.replaceChildren();
    list.hidden = false;
    try {
      const result = await api<{
        revisions: Array<{
          revision: number;
          createdAt: string;
          title: string;
        }>;
      }>(`entries/${current.section}/${current.id}/revisions`);
      for (const revision of result.revisions) {
        const row = document.createElement("div");
        const label = document.createElement("span");
        label.textContent = `Revision ${revision.revision} · ${revision.title}`;
        const time = document.createElement("small");
        time.textContent = dateLabel(revision.createdAt);
        label.append(time);
        const restore = document.createElement("button");
        restore.type = "button";
        restore.className = "cms-quiet-button";
        restore.textContent = "Restore to draft";
        restore.addEventListener("click", async () => {
          if (!current || busyAction || !(await flushSave())) return;
          busyAction = true;
          updateState();
          try {
            current = await api<Entry>(
              `entries/${current.section}/${current.id}/restore`,
              {
                method: "POST",
                body: JSON.stringify({
                  revision: revision.revision,
                  expectedRevision: current.draftRevision,
                }),
              },
            );
            dirtyVersion = 0;
            savedVersion = 0;
            await renderEditor();
            editorMessage(
              "Restored as a private draft. Publish when you’re ready.",
            );
          } catch (error) {
            editorMessage(
              error instanceof Error
                ? error.message
                : "This revision could not be restored",
            );
          } finally {
            busyAction = false;
            updateState();
          }
        });
        row.append(label, restore);
        list.append(row);
      }
    } catch (error) {
      editorMessage(
        error instanceof Error ? error.message : "History is unavailable",
      );
    }
  },
);
element<HTMLInputElement>("cms-file").addEventListener(
  "change",
  async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    const target = uploadTarget;
    input.value = "";
    if (!file || !target || !current) return;
    const id = current.id;
    editorMessage("Preparing your image…");
    try {
      const alt = String(current.data.imageAlt ?? current.data.alt ?? "");
      const data = new FormData();
      data.set("section", current.section);
      data.set("file", file);
      data.set("title", file.name);
      data.set("alt", alt);
      const result = await api<{ url: string; width: number; height: number }>(
        "media",
        { method: "POST", body: data },
      );
      if (current?.id !== id) return;
      if (typeof target === "function") target(result.url, alt);
      else {
        setValue(target, result.url);
        if (current.section === "photos") {
          setValue("width", result.width);
          setValue("height", result.height);
        }
        if (target === "poster.src") {
          setValue("poster.width", result.width);
          setValue("poster.height", result.height);
        }
        await renderEditor();
      }
      editorMessage(
        "Image ready. It stays private until this entry is published.",
      );
    } catch (error) {
      editorMessage(
        error instanceof Error
          ? error.message
          : "Image upload failed. Your draft is safe.",
      );
    }
  },
);
search.addEventListener("input", renderRows);
statusFilter.addEventListener("change", renderRows);
element<HTMLButtonElement>("cms-more").addEventListener("click", () => {
  void loadCollection(true);
});
element<HTMLButtonElement>("cms-refresh").addEventListener("click", () => {
  void loadCollection();
  void refreshAudit();
  void refreshWorkspace();
});
element<HTMLButtonElement>("cms-sync-catalog").addEventListener(
  "click",
  async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true;
    try {
      const result = await api<{ added: { tags: number; pages: number } }>(
        "workspace",
        { method: "POST", body: "{}" },
      );
      await refreshWorkspace();
      await loadCollection();
      message(
        `Added ${result.added.tags} missing labels and ${result.added.pages} pages. Existing entries were preserved.`,
      );
    } catch (error) {
      message(
        error instanceof Error
          ? error.message
          : "Labels could not sync. Try again.",
      );
    } finally {
      button.disabled = false;
    }
  },
);
element<HTMLButtonElement>("cms-audit-retry").addEventListener(
  "click",
  async () => {
    try {
      await api("audit", { method: "POST", body: "{}" });
      await refreshAudit();
    } catch (error) {
      message(error instanceof Error ? error.message : "Audit retry failed");
    }
  },
);
window.addEventListener("hashchange", () => {
  section = currentSection();
  search.value = "";
  statusFilter.value = "all";
  void showWorkspace();
});
window.addEventListener("online", () => {
  if (current) void saveDraft();
});
window.addEventListener("beforeunload", (event) => {
  if (current && dirtyVersion !== savedVersion) {
    keepCopy();
    event.preventDefault();
  }
});
signin.addEventListener("click", async () => {
  signin.disabled = true;
  try {
    const before = workspaceSession.version;
    await signInWithPopup(auth, new GoogleAuthProvider());
    if (before === workspaceSession.version) void workspaceSession.restore();
  } catch (error) {
    element("cms-login-message").textContent =
      error instanceof Error &&
      "code" in error &&
      String(error.code).includes("popup")
        ? "Allow the Google sign-in window, then try again."
        : "Google sign-in could not finish. Please try again.";
  } finally {
    signin.disabled = false;
  }
});
signout.addEventListener("click", async () => {
  if (!(await flushSave())) return;
  const uid = auth.currentUser?.uid;
  workspaceSession.suspend();
  workspacePhase("loading", "Signing out…");
  try {
    await Promise.allSettled([...sessionRequests]);
    await api("session", { method: "DELETE" });
    try {
      for (const key of Object.keys(sessionStorage))
        if (key.startsWith(`harithsa.cms.${uid}.`))
          sessionStorage.removeItem(key);
    } catch {}
    await firebaseSignOut(auth);
  } catch (error) {
    workspacePhase(
      "error",
      error instanceof Error
        ? error.message
        : "Sign-out could not finish. Reconnect and try again.",
    );
  }
});
function workspacePhase(state: AuthPhase, detail?: string) {
  element("cms-restoring").hidden = state !== "loading" && state !== "error";
  element("cms-login").hidden = state !== "signed-out" && state !== "denied";
  element("cms-auth-retry").hidden = state !== "error";
  element("cms-restoring-message").textContent =
    detail ?? "Opening your workspace…";
  element("cms-login-message").textContent =
    detail ?? "Sign in with the journal owner’s Google account.";
  element("cms-restoring").closest<HTMLElement>(
    ".cms-main",
  )!.dataset.authState = state;
  document.querySelector<HTMLElement>(".cms-account")!.hidden =
    state !== "ready";
  const dev = location.hash === "#developer";
  element("cms-collection").hidden = state !== "ready" || dev;
  element("cms-developer").hidden = state !== "ready" || !dev;
}
function clearWorkspace() {
  if (current && dirtyVersion !== savedVersion) keepCopy();
  workspaceReady = false;
  loadingGeneration++;
  collectionPhase("idle");
  editorGeneration++;
  if (saveTimer) clearTimeout(saveTimer);
  developer.clear();
  rich?.destroy();
  rich = null;
  if (dialog.open) dialog.close();
  current = null;
  rows = [];
  labelRows = [];
  nextCursor = null;
  recoveryUid = null;
  form.reset();
  element("cms-rows").replaceChildren();
  form
    .querySelectorAll<HTMLImageElement>("img")
    .forEach((img) => img.removeAttribute("src"));
  document
    .querySelectorAll<HTMLElement>("[data-cms-count]")
    .forEach((node) => (node.textContent = "—"));
}
const workspaceSession = new AuthRestoration({
  ready: () => auth.authStateReady(),
  user: () => auth.currentUser,
  clear: clearWorkspace,
  show: workspacePhase,
  verify: async () => {
    const cookie = api("session", {
      method: "POST",
      body: "{}",
      signal: AbortSignal.timeout(30000),
    });
    sessionRequests.add(cookie);
    void cookie.then(
      () => sessionRequests.delete(cookie),
      () => sessionRequests.delete(cookie),
    );
    const [me] = await Promise.all([
      api<{ environment: string; name: string }>("me", {
        signal: AbortSignal.timeout(30000),
      }),
      cookie,
    ]);
    return me;
  },
  enter: async (me) => {
    const version = workspaceSession.version;
    workspaceReady = true;
    recoveryUid = auth.currentUser!.uid;
    element("cms-environment").textContent =
      me.environment === "live" ? "PRIVATE WORKSPACE" : "PREVIEW WORKSPACE";
    section = currentSection();
    await Promise.all([refreshWorkspace(), showWorkspace()]);
    if (version === workspaceSession.version && workspaceReady)
      void refreshAudit();
  },
  denied: (error) =>
    error instanceof RequestError && [401, 403].includes(error.status),
  message: (error) =>
    error instanceof RequestError
      ? error.message
      : "Your workspace could not open. Try again.",
});
element("cms-auth-retry").addEventListener(
  "click",
  () => void workspaceSession.restore(),
);
onAuthStateChanged(auth, () => void workspaceSession.restore());
window.addEventListener("pagehide", () => workspaceSession.suspend());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) void workspaceSession.restore();
});

const cmsTheme = element<HTMLButtonElement>("cms-theme");
const syncTheme = () => {
  const dark = document.documentElement.dataset.theme === "dark";
  cmsTheme.setAttribute("aria-pressed", String(dark));
  cmsTheme.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} mode`,
  );
};
cmsTheme.addEventListener("click", () =>
  document.querySelector<HTMLButtonElement>("[data-theme-toggle]")?.click(),
);
new MutationObserver(syncTheme).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
syncTheme();

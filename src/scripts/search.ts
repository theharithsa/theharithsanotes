import { SearchSession, type SearchResponse } from "../lib/search-session";
import { revealElement } from "../lib/public-motion";
const node = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const dialog = node<HTMLDialogElement>("site-search");
const form = node<HTMLFormElement>("global-search-form");
const input = node<HTMLInputElement>("global-query");
const scope = node<HTMLSelectElement>("global-section");
const results = node<HTMLUListElement>("global-search-results");
const status = node("global-search-status");
const loading = node("spotlight-loading");
const start = node("spotlight-start");
const retry = node<HTMLButtonElement>("spotlight-retry");
const more = node<HTMLButtonElement>("global-search-more");
const privateStatus = node("global-private-status");
const root = document.documentElement;
const viewStyle = node<HTMLStyleElement>("public-page-transitions");
const viewRule = viewStyle?.textContent ?? "";
let next: number | null = null;
let returnFocus: HTMLElement | null = null;
let closing: ReturnType<typeof setTimeout> | undefined;
let leaving = false;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function resetResults(): void {
  results.replaceChildren();
  next = null;
  more.hidden = true;
  retry.hidden = true;
  results.setAttribute("aria-busy", "false");
  loading.hidden = true;
  privateStatus.textContent = "Search the published notebook.";
  document
    .querySelectorAll<HTMLOptionElement>("[data-private-search]")
    .forEach((option) => (option.hidden = true));
}
const session = new SearchSession({
  request: async (query, section, offset, signal) => {
    const response = await fetch("/api/search/query", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, section, offset }),
    });
    if (
      !response.ok ||
      !response.headers.get("Content-Type")?.includes("application/json")
    )
      throw new Error("SEARCH_UNAVAILABLE");
    const data = (await response.json()) as SearchResponse;
    if (!Array.isArray(data.results) || !Number.isFinite(data.total))
      throw new Error("SEARCH_RESPONSE_INVALID");
    return data;
  },
  idle: () => {
    resetResults();
    start.hidden = false;
    status.textContent =
      input.value.trim().length === 1
        ? "Type one more character to search."
        : "Search titles, topics and ideas across the notebook.";
  },
  loading: (append) => {
    if (!append) resetResults();
    start.hidden = true;
    retry.hidden = true;
    more.hidden = true;
    loading.hidden = false;
    results.setAttribute("aria-busy", "true");
    status.textContent = "Looking through the notebook…";
  },
  ready: (data, append) => {
    if (!dialog.open) return;
    if (!data.privateAvailable && ["journal", "people"].includes(scope.value)) {
      scope.value = "";
      void session.run(input.value, "");
      return;
    }
    if (!append) results.replaceChildren();
    for (const result of data.results) {
      if (
        typeof result.href !== "string" ||
        !result.href.startsWith("/") ||
        result.href.startsWith("//")
      )
        continue;
      let url: URL;
      try {
        url = new URL(result.href, location.origin);
      } catch {
        continue;
      }
      if (url.origin !== location.origin) continue;
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = result.href;
      link.className = "spotlight-result";
      const label = document.createElement("span");
      label.className = "spotlight-result-label";
      label.textContent = `${result.label}${result.private ? " · By invitation" : ""}`;
      const title = document.createElement("strong");
      title.textContent = result.title;
      const description = document.createElement("span");
      description.className = "spotlight-result-description";
      description.textContent = result.description;
      link.append(label, title, description);
      item.append(link);
      results.append(item);
    }
    loading.hidden = true;
    results.setAttribute("aria-busy", "false");
    status.textContent = data.total
      ? `${data.total} ${data.total === 1 ? "match" : "matches"}`
      : "No matches. Try another word or section.";
    privateStatus.textContent = data.privateAvailable
      ? "Includes your invited People & Journal posts."
      : "Searching the public notebook.";
    document
      .querySelectorAll<HTMLOptionElement>("[data-private-search]")
      .forEach((option) => (option.hidden = !data.privateAvailable));
    next = data.next;
    more.hidden = next === null;
    revealElement(results, reduced());
  },
  failed: () => {
    resetResults();
    start.hidden = true;
    status.textContent = "Search couldn’t finish. Please try again.";
    retry.hidden = false;
  },
});
function openSearch(trigger?: HTMLElement): void {
  if (document.querySelector("dialog[open]") && !dialog.open) return;
  clearTimeout(closing);
  delete dialog.dataset.closing;
  returnFocus =
    trigger ??
    (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
  session.reset();
  input.value = "";
  scope.value = "";
  // An open search may contain invited results: opt out before rendering any.
  if (viewStyle)
    viewStyle.textContent = "@view-transition { navigation: none; }";
  root.dataset.searchOpen = "true";
  if (!dialog.open) dialog.showModal();
  input.focus({ preventScroll: true });
}
function finishClose(): void {
  clearTimeout(closing);
  session.reset();
  input.value = "";
  scope.value = "";
  delete root.dataset.searchOpen;
  delete dialog.dataset.closing;
  if (!leaving && viewStyle) viewStyle.textContent = viewRule;
  if (
    !leaving &&
    returnFocus?.isConnected &&
    !document.querySelector("dialog[open]")
  )
    returnFocus.focus({ preventScroll: true });
}
function closeSearch(immediate = false): void {
  session.reset();
  input.value = "";
  clearTimeout(closing);
  if (!dialog.open) {
    finishClose();
    return;
  }
  dialog.dataset.closing = "true";
  const close = () => {
    if (dialog.open) dialog.close();
    finishClose();
  };
  if (immediate || reduced()) close();
  else closing = setTimeout(close, 150);
}
dialog.addEventListener("close", () => {
  if (!dialog.open) finishClose();
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeSearch();
});
node("spotlight-close").addEventListener("click", () => closeSearch());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
    closeSearch();
});
document
  .querySelectorAll<HTMLElement>("[data-open-search]")
  .forEach((button) =>
    button.addEventListener("click", () => openSearch(button)),
  );
input.addEventListener("input", () =>
  session.schedule(input.value, scope.value),
);
scope.addEventListener(
  "change",
  () => void session.run(input.value, scope.value),
);
retry.addEventListener(
  "click",
  () => void session.run(input.value, scope.value),
);
more.addEventListener(
  "click",
  () => void session.run(input.value, scope.value, next),
);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const first = results.querySelector<HTMLAnchorElement>("a");
  if (first) first.click();
  else void session.run(input.value, scope.value);
});
document
  .querySelectorAll<HTMLButtonElement>("[data-search-suggestion]")
  .forEach((button) =>
    button.addEventListener("click", () => {
      input.value = button.dataset.searchSuggestion ?? "";
      input.focus();
      void session.run(input.value, scope.value);
    }),
  );
dialog.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  if (event.target instanceof HTMLSelectElement) return;
  const links = [...results.querySelectorAll<HTMLAnchorElement>("a")];
  if (!links.length) return;
  const index = links.findIndex((link) => link === document.activeElement);
  const target =
    event.key === "ArrowDown"
      ? (index + 1) % links.length
      : index <= 0
        ? -1
        : index - 1;
  event.preventDefault();
  (target < 0 ? input : links[target])?.focus({ preventScroll: true });
  if (target >= 0)
    links[target]?.scrollIntoView({ block: "nearest", behavior: "instant" });
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    if (document.querySelector("dialog[open]") && !dialog.open) return;
    event.preventDefault();
    if (dialog.open) input.focus();
    else openSearch();
  }
});
window.addEventListener("pagehide", () => {
  leaving = true;
  closeSearch(true);
});
window.addEventListener("pageshow", () => {
  leaving = false;
  if (viewStyle && !dialog.open) viewStyle.textContent = viewRule;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && dialog.open) closeSearch(true);
});
window.addEventListener("storage", (event) => {
  if (event.key === "harithsa.reader-ready" && dialog.open) closeSearch(true);
});
window.addEventListener("focus", () => {
  if (dialog.open) void session.run(input.value, scope.value);
});
if (location.pathname === "/search") openSearch();

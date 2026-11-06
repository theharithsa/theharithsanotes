export {};
interface Result {
  title: string;
  description: string;
  label: string;
  href: string;
  private: boolean;
}
interface ResponseData {
  results: Result[];
  total: number;
  next: number | null;
  privateAvailable: boolean;
  error?: { message: string };
}
const form = document.querySelector<HTMLFormElement>("#global-search-form")!;
const input = document.querySelector<HTMLInputElement>("#global-query")!;
const section = document.querySelector<HTMLSelectElement>("#global-section")!;
const results = document.querySelector<HTMLElement>("#global-search-results")!;
const searchStatus = document.querySelector<HTMLElement>(
  "#global-search-status",
)!;
const privateStatus = document.querySelector<HTMLElement>(
  "#global-private-status",
)!;
const more = document.querySelector<HTMLButtonElement>("#global-search-more")!;
let controller: AbortController | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let next: number | null = null;
let generation = 0;
async function search(append = false): Promise<void> {
  controller?.abort();
  const own = ++generation;
  if (!append) results.replaceChildren();
  more.hidden = true;
  const query = input.value.trim();
  if (query.length < 2) {
    searchStatus.textContent = "Enter at least two characters to begin.";
    results.setAttribute("aria-busy", "false");
    return;
  }
  controller = new AbortController();
  results.setAttribute("aria-busy", "true");
  searchStatus.textContent = "Looking through the notebook…";
  try {
    const response = await fetch("/api/search/query", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        section: section.value,
        offset: append ? next : 0,
      }),
    });
    if (!response.headers.get("Content-Type")?.includes("application/json"))
      throw new Error("Search is temporarily unavailable. Please try again.");
    const data = (await response.json()) as ResponseData;
    if (own !== generation) return;
    if (!response.ok)
      throw new Error(
        data.error?.message ?? "Search could not finish. Please try again.",
      );
    for (const result of data.results) {
      // Links are local, server-owned published addresses; text never becomes HTML.
      if (!result.href.startsWith("/") || result.href.startsWith("//"))
        continue;
      const card = document.createElement("article");
      card.className = "global-search-result";
      const label = document.createElement("span");
      label.className = "eyebrow";
      label.textContent = `${result.label}${result.private ? " · By invitation" : ""}`;
      const title = document.createElement("h2");
      const link = document.createElement("a");
      link.href = result.href;
      link.textContent = result.title;
      title.append(link);
      const description = document.createElement("p");
      description.textContent = result.description;
      card.append(label, title, description);
      results.append(card);
    }
    searchStatus.textContent = data.total
      ? `${data.total} ${data.total === 1 ? "result" : "results"} · ${results.childElementCount} shown`
      : "No matches yet. Try another word or a different section.";
    privateStatus.textContent = data.privateAvailable
      ? "Your invited People and Journal posts are included."
      : "Searching the public notebook. Sign in to People and Journal to include your invited posts.";
    document
      .querySelectorAll<HTMLOptionElement>("[data-private-search]")
      .forEach((option) => {
        option.hidden = !data.privateAvailable;
      });
    next = data.next;
    more.hidden = next === null;
  } catch (error) {
    if (
      own !== generation ||
      (error instanceof DOMException && error.name === "AbortError")
    )
      return;
    // Remove prior private results on any failed authorization/network attempt.
    results.replaceChildren();
    searchStatus.textContent =
      error instanceof Error
        ? error.message
        : "Search could not finish. Try again.";
  } finally {
    if (own === generation) results.setAttribute("aria-busy", "false");
  }
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearTimeout(timer);
  void search();
});
input.addEventListener("input", () => {
  controller?.abort();
  generation++;
  results.replaceChildren();
  more.hidden = true;
  clearTimeout(timer);
  timer = setTimeout(() => void search(), 400);
});
section.addEventListener("change", () => {
  clearTimeout(timer);
  void search();
});
more.addEventListener("click", () => void search(true));
window.addEventListener("pagehide", () => {
  controller?.abort();
  clearTimeout(timer);
  generation++;
  results.replaceChildren();
  input.value = "";
  more.hidden = true;
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    results.replaceChildren();
    searchStatus.textContent = "Enter a word to search the notebook.";
  }
});

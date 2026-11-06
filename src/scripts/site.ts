const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
const navSections = [
  ...document.querySelectorAll<HTMLElement>("[data-nav-section]"),
];
const menuAnimations = new WeakMap<HTMLElement, Animation>();
let menuCloseTimer: ReturnType<typeof setTimeout> | undefined;
function animatePanel(panel: HTMLElement, opening: boolean): void {
  menuAnimations.get(panel)?.cancel();
  panel.inert = !opening;
  panel.dataset.closing = String(!opening);
  if (opening) panel.hidden = false;
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    typeof panel.animate !== "function"
  ) {
    panel.hidden = !opening;
    return;
  }
  const animation = panel.animate(
    opening
      ? [
          { opacity: 0, transform: "translateY(-10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ]
      : [
          { opacity: 1, transform: "translateY(0)" },
          { opacity: 0, transform: "translateY(-8px)" },
        ],
    { duration: opening ? 200 : 140, easing: "cubic-bezier(.2,.7,.2,1)" },
  );
  menuAnimations.set(panel, animation);
  void animation.finished.then(
    () => {
      if (!opening && panel.dataset.closing === "true") panel.hidden = true;
    },
    () => undefined,
  );
}
function closeSectionMenus(except?: HTMLElement, immediate = false): void {
  navSections.forEach((section) => {
    if (section === except) return;
    section.querySelector("button")?.setAttribute("aria-expanded", "false");
    delete section.dataset.openMethod;
    const panel = section.querySelector<HTMLElement>(".mega-menu");
    if (
      !panel ||
      panel.hidden ||
      (panel.dataset.closing === "true" && !immediate)
    )
      return;
    if (immediate) {
      menuAnimations.get(panel)?.cancel();
      panel.hidden = true;
      panel.inert = true;
    } else animatePanel(panel, false);
  });
}
function openSectionMenu(
  section: HTMLElement,
  method: "hover" | "click" | "keyboard" = "hover",
): void {
  if (!window.matchMedia("(min-width: 981px)").matches) return;
  clearTimeout(menuCloseTimer);
  closeSectionMenus(section, true);
  const panel = section.querySelector<HTMLElement>(".mega-menu");
  const wasOpen = !panel?.hidden && panel?.dataset.closing !== "true";
  section.querySelector("button")?.setAttribute("aria-expanded", "true");
  if (method !== "hover" || !section.dataset.openMethod)
    section.dataset.openMethod = method;
  if (panel && !wasOpen) animatePanel(panel, true);
}
navSections.forEach((section) => {
  section.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") openSectionMenu(section);
  });
  section.addEventListener("pointerleave", () => {
    if (section.contains(document.activeElement)) return;
    menuCloseTimer = setTimeout(() => closeSectionMenus(), 160);
  });
  section.addEventListener("focusin", () => clearTimeout(menuCloseTimer));
  section.addEventListener("focusout", (event) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !section.contains(event.relatedTarget)
    )
      closeSectionMenus();
  });
  const button = section.querySelector<HTMLButtonElement>(".nav-disclosure");
  button?.addEventListener("click", (event) => {
    const open = button.getAttribute("aria-expanded") === "true";
    if (open && (event.detail === 0 || section.dataset.openMethod !== "hover"))
      closeSectionMenus();
    else openSectionMenu(section, event.detail === 0 ? "keyboard" : "click");
  });
  button?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    openSectionMenu(section, "keyboard");
    section.querySelector<HTMLAnchorElement>(".mega-links a")?.focus();
  });
});
document.addEventListener("click", (event) => {
  if (
    event.target instanceof Node &&
    !document.querySelector(".site-header")?.contains(event.target)
  )
    closeSectionMenus();
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const section = navSections.find(
    (item) =>
      item.querySelector("button")?.getAttribute("aria-expanded") === "true",
  );
  section?.querySelector("button")?.focus();
  closeSectionMenus();
});
window.addEventListener("resize", () => {
  closeSectionMenus(undefined, true);
  closeMenu();
});
const articleContents = document.querySelector<HTMLDetailsElement>(
  ".article-outline details",
);
if (articleContents && window.matchMedia("(min-width: 981px)").matches)
  articleContents.open = true;
const menu = document.querySelector<HTMLElement>("#mobile-menu");
function closeMenu(): void {
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open navigation");
  menu.hidden = true;
  toggle.textContent = "Menu";
}
toggle?.addEventListener("click", () => {
  if (!menu) return;
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  menu.hidden = !open;
  toggle.textContent = open ? "Close" : "Menu";
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    toggle?.getAttribute("aria-expanded") === "true"
  ) {
    closeMenu();
    toggle.focus();
  }
});

const search = document.querySelector<HTMLInputElement>("#search");
const filters = document.querySelectorAll<HTMLButtonElement>("[data-filter]");
const notes = document.querySelectorAll<HTMLElement>("[data-note]");
const tagButtons =
  document.querySelectorAll<HTMLButtonElement>("[data-blog-tag]");
let selectedTag = new URLSearchParams(window.location.search).get("tag") ?? "";
if (![...tagButtons].some((button) => button.dataset.blogTag === selectedTag))
  selectedTag = "";

let selected =
  new URLSearchParams(window.location.search).get("topic") ?? "All notes";
if (![...filters].some((filter) => filter.dataset.filter === selected))
  selected = "All notes";
function filterNotes(): void {
  const query = search?.value.toLowerCase().trim() ?? "";
  let count = 0;
  notes.forEach((note) => {
    const visible =
      (selected === "All notes" || note.dataset.topic === selected) &&
      (!selectedTag ||
        (JSON.parse(note.dataset.tags ?? "[]") as string[]).includes(
          selectedTag,
        )) &&
      (note.dataset.search ?? "").includes(query);
    note.hidden = !visible;
    if (visible) count += 1;
  });
  filters.forEach((filter) =>
    filter.setAttribute(
      "aria-pressed",
      String(filter.dataset.filter === selected),
    ),
  );
  const results = document.querySelector<HTMLElement>("#result-count");
  if (results)
    results.textContent = `${count} ${count === 1 ? "article" : "articles"}`;
  const empty = document.querySelector<HTMLElement>("#empty-state");
  if (empty) empty.hidden = count !== 0;
  tagButtons.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.blogTag === selectedTag),
    ),
  );
  if (notes.length && tagButtons.length) {
    const url = new URL(location.href);
    for (const [key, value] of [
      ["q", search?.value.trim() ?? ""],
      ["tag", selectedTag],
      ["topic", selected === "All notes" ? "" : selected],
    ]) {
      if (value) url.searchParams.set(key!, value);
      else url.searchParams.delete(key!);
    }
    history.replaceState(null, "", url);
  }
  document.dispatchEvent(new CustomEvent("journal:filtered"));
}
tagButtons.forEach((button) =>
  button.addEventListener("click", () => {
    selectedTag =
      button.dataset.blogTag === selectedTag
        ? ""
        : (button.dataset.blogTag ?? "");
    filterNotes();
  }),
);
search?.addEventListener("input", filterNotes);
filters.forEach((filter) =>
  filter.addEventListener("click", () => {
    selected = filter.dataset.filter ?? "All notes";
    filterNotes();
  }),
);
document.querySelector("[data-reset-search]")?.addEventListener("click", () => {
  if (search) search.value = "";
  selected = "All notes";
  selectedTag = "";
  filterNotes();
  search?.focus();
});
if (notes.length && filters.length) filterNotes();

const genreFilters = document.querySelectorAll<HTMLButtonElement>(
  "[data-genre-filter]",
);
const bookCards = document.querySelectorAll<HTMLElement>("[data-book]");
const bookSearch = document.querySelector<HTMLInputElement>("#book-search");
const bookRatingFilter = document.querySelector<HTMLSelectElement>(
  "#book-rating-filter",
);
let selectedGenre = "All genres";
function filterBooks(): void {
  const query = (bookSearch?.value ?? "").trim().toLocaleLowerCase();
  const rating = bookRatingFilter?.value ?? "all";
  let count = 0;
  bookCards.forEach((book) => {
    book.hidden =
      (selectedGenre !== "All genres" &&
        !(JSON.parse(book.dataset.genres ?? "[]") as string[]).includes(
          selectedGenre,
        )) ||
      (rating !== "all" && book.dataset.rating !== rating) ||
      !(book.dataset.bookSearch ?? "").toLocaleLowerCase().includes(query);
    if (!book.hidden) count++;
  });
  const countLabel = document.querySelector("#shelf-count");
  if (countLabel)
    countLabel.textContent = `${count} ${count === 1 ? "book" : "books"}`;
  const empty = document.querySelector<HTMLElement>("#book-empty");
  if (empty) empty.hidden = count > 0;
}
genreFilters.forEach((button) =>
  button.addEventListener("click", () => {
    selectedGenre = button.dataset.genreFilter ?? "All genres";
    genreFilters.forEach((filter) =>
      filter.setAttribute("aria-pressed", String(filter === button)),
    );
    filterBooks();
  }),
);
bookSearch?.addEventListener("input", filterBooks);
bookRatingFilter?.addEventListener("change", filterBooks);

const projectFilters = document.querySelectorAll<HTMLButtonElement>(
  "[data-project-filter]",
);
const projectCards = document.querySelectorAll<HTMLElement>("[data-project]");
const projectGrid = document.querySelector<HTMLElement>("#project-results");
function filterProjects(topic: string): void {
  let count = 0;
  projectCards.forEach((card) => {
    card.hidden = topic !== "All projects" && card.dataset.topic !== topic;
    card.classList.remove("filter-lead");
    if (!card.hidden) count++;
  });
  projectFilters.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.projectFilter === topic),
    ),
  );
  if (projectGrid)
    projectGrid.dataset.filtered = String(topic !== "All projects");
  if (topic !== "All projects" && count >= 3)
    [...projectCards]
      .find((card) => !card.hidden)
      ?.classList.add("filter-lead");
  const label = document.querySelector("#project-count");
  if (label)
    label.textContent = `${count} ${count === 1 ? "project" : "projects"}`;
}
projectFilters.forEach((button) =>
  button.addEventListener("click", () =>
    filterProjects(button.dataset.projectFilter ?? "All projects"),
  ),
);

const screenFilters = document.querySelectorAll<HTMLButtonElement>(
  "[data-screen-filter]",
);
document
  .querySelectorAll<HTMLImageElement>("[data-poster-image]")
  .forEach((image) => {
    const showFallback = (): void => {
      image.hidden = true;
      const fallback = image.parentElement?.querySelector<HTMLElement>(
        "[data-poster-fallback]",
      );
      if (fallback) fallback.hidden = false;
    };
    image.addEventListener("error", showFallback);
    if (image.complete && image.naturalWidth === 0) showFallback();
  });
const screenCards =
  document.querySelectorAll<HTMLElement>("[data-screen-note]");
screenFilters.forEach((button) =>
  button.addEventListener("click", () => {
    let count = 0;
    screenCards.forEach((card) => {
      card.hidden =
        button.dataset.screenFilter !== "All notes" &&
        card.dataset.kind !==
          (button.dataset.screenFilter === "Movies" ? "Movie" : "Series");
      if (!card.hidden) count++;
    });
    screenFilters.forEach((filter) =>
      filter.setAttribute("aria-pressed", String(filter === button)),
    );
    const countLabel = document.querySelector("#screen-count");
    if (countLabel)
      countLabel.textContent = `${count} ${count === 1 ? "reflection" : "reflections"}`;
  }),
);

document
  .querySelector("[data-copy-link]")
  ?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;
    try {
      await navigator.clipboard.writeText(window.location.href.split("#")[0]);
      button.textContent = "Link copied ✓";
    } catch {
      button.textContent = "Copy the address from your browser";
    }
  });

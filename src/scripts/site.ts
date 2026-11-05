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
}
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
  filterNotes();
  search?.focus();
});
if (notes.length && filters.length) filterNotes();

const shelfFilters = document.querySelectorAll<HTMLButtonElement>(
  "[data-shelf-filter]",
);
const bookCards = document.querySelectorAll<HTMLElement>("[data-book]");
const bookSearch = document.querySelector<HTMLInputElement>("#book-search");
const bookRatingFilter = document.querySelector<HTMLSelectElement>(
  "#book-rating-filter",
);
let selectedShelf = "All books";
function filterBooks(): void {
  const query = (bookSearch?.value ?? "").trim().toLocaleLowerCase();
  const rating = bookRatingFilter?.value ?? "all";
  let count = 0;
  bookCards.forEach((book) => {
    book.hidden =
      (selectedShelf !== "All books" &&
        book.dataset.status !== selectedShelf) ||
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
shelfFilters.forEach((button) =>
  button.addEventListener("click", () => {
    selectedShelf = button.dataset.shelfFilter ?? "All books";
    shelfFilters.forEach((filter) =>
      filter.setAttribute("aria-pressed", String(filter === button)),
    );
    filterBooks();
  }),
);
bookSearch?.addEventListener("input", filterBooks);
bookRatingFilter?.addEventListener("change", filterBooks);

const photoDialog =
  document.querySelector<HTMLDialogElement>(".photo-lightbox");

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

const photoButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-gallery-open]"),
];
let activePhoto = 0;
let photoOpener: HTMLButtonElement | undefined;
function showPhoto(index: number): void {
  if (!photoDialog || !photoButtons.length) return;
  activePhoto = (index + photoButtons.length) % photoButtons.length;
  const button = photoButtons[activePhoto];
  const image = photoDialog.querySelector<HTMLImageElement>(".lightbox-image");
  const title = photoDialog.querySelector<HTMLElement>("#photo-dialog-title");
  const caption = photoDialog.querySelector<HTMLElement>(".lightbox-caption");
  const count = photoDialog.querySelector<HTMLElement>(".lightbox-count");
  if (image) {
    image.alt = button.dataset.alt ?? "";
    image.src = button.dataset.src ?? "";
  }
  if (title) title.textContent = button.dataset.title ?? "Photograph";
  if (caption) caption.textContent = button.dataset.caption ?? "";
  if (count) count.textContent = `${activePhoto + 1} / ${photoButtons.length}`;
}
photoButtons.forEach((button, index) =>
  button.addEventListener("click", () => {
    if (!photoDialog) return;
    photoOpener = button;
    showPhoto(index);
    photoDialog.showModal();
    document.documentElement.classList.add("photo-dialog-open");
  }),
);
photoDialog
  ?.querySelector(".lightbox-close")
  ?.addEventListener("click", () => photoDialog.close());
photoDialog
  ?.querySelector("[data-gallery-prev]")
  ?.addEventListener("click", () => showPhoto(activePhoto - 1));
photoDialog
  ?.querySelector("[data-gallery-next]")
  ?.addEventListener("click", () => showPhoto(activePhoto + 1));
photoDialog?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    event.preventDefault();
    showPhoto(activePhoto + 1);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showPhoto(activePhoto - 1);
  }
});
photoDialog?.addEventListener("click", (event) => {
  if (event.target === photoDialog) photoDialog.close();
});
photoDialog?.addEventListener("close", () => {
  document.documentElement.classList.remove("photo-dialog-open");
  photoOpener?.focus();
});
photoDialog?.querySelector(".lightbox-image")?.addEventListener("error", () => {
  const caption = photoDialog.querySelector<HTMLElement>(".lightbox-caption");
  if (caption)
    caption.textContent =
      "This photograph could not load. Please try another or reopen it.";
});

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

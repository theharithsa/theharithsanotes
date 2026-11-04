const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
const navSections = [
  ...document.querySelectorAll<HTMLElement>("[data-nav-section]"),
];
let menuCloseTimer: ReturnType<typeof setTimeout> | undefined;
function closeSectionMenus(): void {
  navSections.forEach((section) => {
    section.querySelector("button")?.setAttribute("aria-expanded", "false");
    const panel = section.querySelector<HTMLElement>(".mega-menu");
    if (panel) panel.hidden = true;
  });
}
function openSectionMenu(section: HTMLElement): void {
  if (!window.matchMedia("(min-width: 981px)").matches) return;
  clearTimeout(menuCloseTimer);
  closeSectionMenus();
  section.querySelector("button")?.setAttribute("aria-expanded", "true");
  const panel = section.querySelector<HTMLElement>(".mega-menu");
  if (panel) panel.hidden = false;
}
navSections.forEach((section) => {
  section.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") openSectionMenu(section);
  });
  section.addEventListener("pointerleave", () => {
    menuCloseTimer = setTimeout(closeSectionMenus, 160);
  });
  section.addEventListener("focusin", (event) => {
    if (event.target instanceof HTMLAnchorElement) openSectionMenu(section);
  });
  section.addEventListener("focusout", (event) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !section.contains(event.relatedTarget)
    )
      closeSectionMenus();
  });
  section.querySelector("button")?.addEventListener("click", (event) => {
    const panel = section.querySelector<HTMLElement>(".mega-menu");
    if (panel?.hidden || event.detail > 0) openSectionMenu(section);
    else closeSectionMenus();
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
  const activeSection = navSections.find(
    (section) =>
      section.querySelector("button")?.getAttribute("aria-expanded") === "true",
  );
  activeSection?.querySelector("button")?.focus();
  closeSectionMenus();
});
window.addEventListener("resize", () => {
  closeSectionMenus();
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
shelfFilters.forEach((button) =>
  button.addEventListener("click", () => {
    let count = 0;
    bookCards.forEach((book) => {
      book.hidden =
        button.dataset.shelfFilter !== "All books" &&
        book.dataset.status !== button.dataset.shelfFilter;
      if (!book.hidden) count++;
    });
    shelfFilters.forEach((filter) =>
      filter.setAttribute("aria-pressed", String(filter === button)),
    );
    const countLabel = document.querySelector("#shelf-count");
    if (countLabel)
      countLabel.textContent = `${count} ${count === 1 ? "book" : "books"}`;
  }),
);

const photoDialog =
  document.querySelector<HTMLDialogElement>(".photo-lightbox");
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

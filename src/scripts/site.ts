const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
const articleContents = document.querySelector<HTMLDetailsElement>(
  ".article-outline details",
);
if (articleContents && window.matchMedia("(min-width: 951px)").matches)
  articleContents.open = true;
const menu = document.querySelector<HTMLElement>("#mobile-menu");
function closeMenu(): void {
  if (!toggle || !menu) return;
  toggle.setAttribute("aria-expanded", "false");
  menu.hidden = true;
}
toggle?.addEventListener("click", () => {
  if (!menu) return;
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
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
    results.textContent = `${count} ${count === 1 ? "note" : "notes"}`;
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

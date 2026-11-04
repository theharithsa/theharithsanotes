const toggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
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

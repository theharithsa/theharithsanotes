const mobileFilters = window.matchMedia("(max-width: 767px)");
const panels = document.querySelectorAll<HTMLDetailsElement>(
  ".collection-filter-panel",
);
function syncFilterPanels(): void {
  panels.forEach((panel) => {
    panel.open = !mobileFilters.matches;
  });
}
// Preserve a native disclosure opened before this module finishes loading.
if (!mobileFilters.matches) syncFilterPanels();
mobileFilters.addEventListener("change", syncFilterPanels);
export {};

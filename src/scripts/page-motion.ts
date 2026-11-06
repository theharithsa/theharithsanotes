import { isPublicDestination, revealElement } from "../lib/public-motion";
const root = document.documentElement;
if (root.dataset.pageMotion === "public") {
  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reset = () => {
    delete root.dataset.navigating;
    const status = document.querySelector<HTMLElement>(
      "#page-navigation-status",
    );
    if (status) status.hidden = true;
  };
  window.addEventListener("pageshow", reset);
  window.addEventListener("pagehide", reset);
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const filter = event.target.closest(
      "[data-filter], [data-blog-tag], [data-genre-filter], [data-project-filter], [data-screen-filter], [data-reset-search]",
    );
    if (filter) {
      const results = document.querySelector<HTMLElement>(
        ".dated-articles, #book-results, #project-results, .screen-notes-grid",
      );
      // Existing filter listeners update visibility synchronously before this reveal.
      if (results) queueMicrotask(() => revealElement(results, reduced()));
      return;
    }
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    )
      return;
    const target = new URL(link.href, location.href);
    const current = new URL(location.href);
    if (
      target.origin !== current.origin ||
      !isPublicDestination(target) ||
      (target.pathname === current.pathname && target.search === current.search)
    )
      return;
    root.dataset.navigating = "true";
    const status = document.querySelector<HTMLElement>(
      "#page-navigation-status",
    );
    if (status) status.hidden = false;
  });
  document.addEventListener("change", (event) => {
    if (
      !(event.target instanceof Element) ||
      !event.target.matches(
        "#book-genre-filter, #book-rating-filter, #blog-tag-filter",
      )
    )
      return;
    const results = document.querySelector<HTMLElement>(
      "#book-results, .dated-articles",
    );
    if (results) revealElement(results, reduced());
  });
}

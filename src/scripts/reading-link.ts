// This preference only avoids an unnecessary request; the server checks access.
const links = document.querySelectorAll<HTMLAnchorElement>(
  ".reading-entry-link",
);
try {
  if (localStorage.getItem("harithsa.reader-ready") === "true") {
    fetch("/api/reading/me", { credentials: "same-origin", cache: "no-store" })
      .then((response) => {
        if (response.ok)
          links.forEach((link) => {
            link.textContent = "People & Journal";
            link.setAttribute("aria-label", "Open People and Journal");
          });
        else localStorage.removeItem("harithsa.reader-ready");
      })
      .catch(() => {});
  }
} catch {
  /* Reading remains available when local preferences are disabled. */
}

type Theme = "light" | "dark";
const root = document.documentElement;
const toggleTheme = document.querySelector<HTMLButtonElement>(
  "[data-theme-toggle]",
);
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const preferenceKey = "harithsa.theme.v1";
let preference: Theme | null = null;
try {
  const stored = localStorage.getItem(preferenceKey);
  if (stored === "light" || stored === "dark") preference = stored;
} catch {
  /* A blocked preference store must not prevent theme switching. */
}
function applyTheme(theme: Theme): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const chrome = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (chrome) chrome.content = chrome.dataset[theme] ?? chrome.content;
  toggleTheme?.setAttribute("aria-pressed", String(theme === "dark"));
  toggleTheme?.setAttribute(
    "aria-label",
    `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
  );
}
applyTheme(preference ?? (systemTheme.matches ? "dark" : "light"));
if (toggleTheme) {
  toggleTheme.hidden = false;
  toggleTheme.addEventListener("click", () => {
    preference = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(preference);
    try {
      localStorage.setItem(preferenceKey, preference);
    } catch {
      /* Keep the current page usable without storage. */
    }
  });
}
systemTheme.addEventListener("change", () => {
  if (!preference) applyTheme(systemTheme.matches ? "dark" : "light");
});
window.addEventListener("storage", (event) => {
  if (event.key !== preferenceKey && event.key !== null) return;
  preference =
    event.newValue === "dark" || event.newValue === "light"
      ? event.newValue
      : null;
  applyTheme(preference ?? (systemTheme.matches ? "dark" : "light"));
});

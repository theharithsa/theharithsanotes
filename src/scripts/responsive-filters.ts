export {};
/** Keep the same selected category when moving between phone and desktop layouts. */
for (const group of document.querySelectorAll<HTMLElement>(
  ".filters, .podcast-tabs, .reading-categories",
)) {
  const controls = [
    ...group.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>(
      "button, a",
    ),
  ];
  if (controls.length < 2) continue;
  const label = document.createElement("label");
  label.className = "mobile-category-filter";
  label.append(group.getAttribute("aria-label") ?? "Choose a category");
  const select = document.createElement("select");
  select.setAttribute(
    "aria-label",
    group.getAttribute("aria-label") ?? "Choose a category",
  );
  for (const [index, control] of controls.entries()) {
    const option = document.createElement("option");
    option.value = String(index);
    const count = control.querySelector(".filter-count")?.textContent?.trim();
    const name = [...control.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    option.textContent = `${name || control.textContent?.trim() || "Category"}${count ? ` (${count})` : ""}`;
    select.append(option);
  }
  function sync(): void {
    const active = controls.findIndex(
      (control) =>
        control.getAttribute("aria-pressed") === "true" ||
        control.getAttribute("aria-current") === "page",
    );
    select.value = String(Math.max(0, active));
  }
  select.addEventListener("change", () =>
    controls[Number(select.value)]?.click(),
  );
  controls.forEach((control) =>
    control.addEventListener("click", () => queueMicrotask(sync)),
  );
  label.append(select);
  group.before(label);
  group.classList.add("responsive-category-buttons");
  sync();
}

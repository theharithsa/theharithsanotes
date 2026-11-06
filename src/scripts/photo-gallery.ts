document
  .querySelectorAll<HTMLElement>("[data-photo-journal]")
  .forEach((root) => {
    const tiles = [...root.querySelectorAll<HTMLElement>(".photo-tile")];
    const dialog = root.querySelector<HTMLDialogElement>(".photo-lightbox");
    const image = dialog?.querySelector<HTMLImageElement>(".lightbox-image");
    if (!tiles.length || !dialog || !image) return;
    let current = 0;
    let opener: HTMLButtonElement | null = null;
    function selectDate(index: number) {
      const group = tiles[index]?.dataset.dateGroup;
      const picker = root.querySelector<HTMLSelectElement>(
        "[data-photo-date-picker]",
      );
      if (picker && group) picker.value = group;
      root
        .querySelectorAll<HTMLElement>("[data-photo-date]")
        .forEach((link) =>
          link.setAttribute(
            "aria-current",
            link.dataset.photoDate === group ? "date" : "false",
          ),
        );
    }
    function jump(group: string | undefined) {
      const index = tiles.findIndex((tile) => tile.dataset.dateGroup === group);
      if (index < 0) return;
      selectDate(index);
      tiles[index]!.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    }
    function show(index: number) {
      current = Math.max(0, Math.min(index, tiles.length - 1));
      const tile = tiles[current]!;
      const source = tile.querySelector<HTMLImageElement>("img")!;
      image!.src = source.dataset.full ?? source.src;
      image!.alt = source.alt;
      const title = dialog!.querySelector<HTMLElement>(".photo-dialog-title");
      const caption = dialog!.querySelector<HTMLElement>(".lightbox-caption");
      const count = dialog!.querySelector<HTMLElement>(".lightbox-count");
      if (title) title.textContent = tile.dataset.title ?? "";
      if (caption) caption.textContent = tile.dataset.caption ?? "";
      if (count) count.textContent = `${current + 1} / ${tiles.length}`;
      dialog!
        .querySelectorAll<HTMLButtonElement>("[data-photo-prev]")
        .forEach((button) => (button.disabled = current === 0));
      dialog!
        .querySelectorAll<HTMLButtonElement>("[data-photo-next]")
        .forEach((button) => (button.disabled = current === tiles.length - 1));
    }
    root
      .querySelectorAll<HTMLAnchorElement>("[data-photo-date]")
      .forEach((link) =>
        link.addEventListener("click", (event) => {
          event.preventDefault();
          jump(link.dataset.photoDate);
        }),
      );
    root
      .querySelector<HTMLSelectElement>("[data-photo-date-picker]")
      ?.addEventListener("change", (event) =>
        jump((event.currentTarget as HTMLSelectElement).value),
      );
    tiles.forEach((tile, index) => {
      const button = tile.querySelector<HTMLButtonElement>(
        "[data-photo-expand]",
      );
      button?.addEventListener("click", () => {
        opener = button;
        show(index);
        dialog.showModal();
        document.documentElement.classList.add("photo-dialog-open");
      });
    });
    dialog
      .querySelector<HTMLButtonElement>("[data-photo-close]")
      ?.addEventListener("click", () => dialog.close());
    dialog
      .querySelectorAll<HTMLButtonElement>("[data-photo-prev]")
      .forEach((button) =>
        button.addEventListener("click", () => show(current - 1)),
      );
    dialog
      .querySelectorAll<HTMLButtonElement>("[data-photo-next]")
      .forEach((button) =>
        button.addEventListener("click", () => show(current + 1)),
      );
    dialog.addEventListener("keydown", (event) => {
      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowLeft" ||
        event.key === "Home" ||
        event.key === "End"
      ) {
        event.preventDefault();
        show(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? tiles.length - 1
              : current + (event.key === "ArrowRight" ? 1 : -1),
        );
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("photo-dialog-open");
      image.removeAttribute("src");
      opener?.focus();
    });
    selectDate(0);
  });

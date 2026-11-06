import { photoScrollOffset, nearestPhotoIndex } from "../lib/carousel-geometry";
document
  .querySelectorAll<HTMLElement>("[data-photo-journal]")
  .forEach((root) => {
    const track = root.querySelector<HTMLElement>(".photo-track");
    const slides = [...root.querySelectorAll<HTMLElement>(".photo-slide")];
    const dialog = root.querySelector<HTMLDialogElement>("dialog");
    const image = dialog?.querySelector<HTMLImageElement>(".lightbox-image");
    const title = dialog?.querySelector<HTMLElement>(".photo-dialog-title");
    const caption = dialog?.querySelector<HTMLElement>(".lightbox-caption");
    const count = root.querySelector<HTMLElement>(".photo-position");
    if (!track || !slides.length || !dialog || !image) return;
    let current = 0;
    let opener: HTMLElement | null = null;
    let frame = 0;
    const reduced = () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    function update(index: number) {
      current = Math.max(0, Math.min(index, slides.length - 1));
      root
        .querySelectorAll<HTMLButtonElement>("[data-photo-prev]")
        .forEach((button) => (button.disabled = current === 0));
      root
        .querySelectorAll<HTMLButtonElement>("[data-photo-next]")
        .forEach((button) => (button.disabled = current === slides.length - 1));
      if (count) count.textContent = `${current + 1} / ${slides.length}`;
      const picker = root.querySelector<HTMLSelectElement>(
        "[data-photo-date-picker]",
      );
      if (picker)
        picker.value = slides[current]?.dataset.dateGroup ?? "undated";
      root
        .querySelectorAll<HTMLElement>("[data-photo-date]")
        .forEach((link) =>
          link.setAttribute(
            "aria-current",
            link.dataset.photoDate === slides[current]?.dataset.dateGroup
              ? "date"
              : "false",
          ),
        );
    }
    const offsets = () =>
      slides.map((slide) => slide.offsetLeft - slides[0]!.offsetLeft);
    const maximum = () => Math.max(0, track!.scrollWidth - track!.clientWidth);
    function show(index: number, smooth = true) {
      update(index);
      track!.scrollTo({
        left: photoScrollOffset(offsets(), current, maximum()),
        behavior: smooth && !reduced() ? "smooth" : "instant",
      });
      if (dialog!.open) showDialogImage();
    }
    function showDialogImage() {
      const slide = slides[current]!;
      const img = slide.querySelector("img")!;
      image!.src = img.dataset.full ?? img.src;
      image!.alt = img.alt;
      if (title) title.textContent = slide.dataset.title ?? "";
      if (caption) caption.textContent = slide.dataset.caption ?? "";
      const label = dialog!.querySelector(".lightbox-count");
      if (label) label.textContent = `${current + 1} / ${slides.length}`;
    }
    root
      .querySelectorAll<HTMLButtonElement>("[data-photo-prev]")
      .forEach((button) =>
        button.addEventListener("click", () => show(current - 1)),
      );
    root
      .querySelectorAll<HTMLButtonElement>("[data-photo-next]")
      .forEach((button) =>
        button.addEventListener("click", () => show(current + 1)),
      );
    root
      .querySelectorAll<HTMLAnchorElement>("[data-photo-date]")
      .forEach((link) =>
        link.addEventListener("click", (event) => {
          event.preventDefault();
          const index = slides.findIndex(
            (slide) => slide.dataset.dateGroup === link.dataset.photoDate,
          );
          if (index >= 0) show(index);
        }),
      );
    root
      .querySelector<HTMLSelectElement>("[data-photo-date-picker]")
      ?.addEventListener("change", (event) => {
        const value = (event.currentTarget as HTMLSelectElement).value;
        const index = slides.findIndex(
          (slide) => slide.dataset.dateGroup === value,
        );
        if (index >= 0) show(index);
      });
    root
      .querySelectorAll<HTMLButtonElement>("[data-photo-expand]")
      .forEach((button, index) =>
        button.addEventListener("click", () => {
          opener = button;
          update(index);
          showDialogImage();
          dialog!.showModal();
          document.documentElement.classList.add("photo-dialog-open");
        }),
      );
    dialog
      .querySelector<HTMLButtonElement>("[data-photo-close]")
      ?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("photo-dialog-open");
      image.removeAttribute("src");
      opener?.focus();
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    root.addEventListener("keydown", (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        show(event.key === "Home" ? 0 : slides.length - 1);
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        show(current + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    track.addEventListener(
      "scroll",
      () => {
        if (dialog.open) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() =>
          update(nearestPhotoIndex(offsets(), track.scrollLeft, maximum())),
        );
      },
      { passive: true },
    );
    if ("ResizeObserver" in window)
      new ResizeObserver(() => show(current, false)).observe(track);
    update(0);
  });

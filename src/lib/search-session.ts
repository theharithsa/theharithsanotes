export interface SearchResult {
  title: string;
  description: string;
  label: string;
  href: string;
  private: boolean;
}
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  next: number | null;
  privateAvailable: boolean;
}
interface SearchHooks {
  request: (
    query: string,
    section: string,
    offset: number,
    signal: AbortSignal,
  ) => Promise<SearchResponse>;
  loading: (append: boolean) => void;
  ready: (data: SearchResponse, append: boolean) => void;
  idle: () => void;
  failed: () => void;
}
/** Request-local results; invalidation also prevents late responses after closing. */
export class SearchSession {
  private epoch = 0;
  private access: boolean | undefined;
  private controller?: AbortController;
  private debounce?: ReturnType<typeof setTimeout>;
  private timeout?: ReturnType<typeof setTimeout>;
  private readonly hooks: SearchHooks;
  constructor(hooks: SearchHooks) {
    this.hooks = hooks;
  }
  private invalidate(): number {
    this.epoch++;
    this.controller?.abort();
    clearTimeout(this.debounce);
    clearTimeout(this.timeout);
    return this.epoch;
  }
  reset(): void {
    this.invalidate();
    this.access = undefined;
    this.hooks.idle();
  }
  schedule(query: string, section: string): void {
    const own = this.invalidate();
    this.access = undefined;
    if (query.trim().length < 2) {
      this.hooks.idle();
      return;
    }
    this.hooks.loading(false);
    this.debounce = setTimeout(
      () => void this.execute(query.trim(), section, 0, false, own),
      180,
    );
  }
  async run(
    query: string,
    section: string,
    offset: number | null = null,
  ): Promise<void> {
    const own = this.invalidate();
    if (offset === null) this.access = undefined;
    if (query.trim().length < 2) {
      this.hooks.idle();
      return;
    }
    this.hooks.loading(offset !== null);
    await this.execute(
      query.trim(),
      section,
      offset ?? 0,
      offset !== null,
      own,
    );
  }
  private async execute(
    query: string,
    section: string,
    offset: number,
    append: boolean,
    own: number,
  ): Promise<void> {
    const controller = new AbortController();
    this.controller = controller;
    this.timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const data = await this.hooks.request(
        query,
        section,
        offset,
        controller.signal,
      );
      if (own !== this.epoch) return;
      if (
        append &&
        this.access !== undefined &&
        this.access !== data.privateAvailable
      ) {
        // Refresh the index boundary before any old private rows can survive.
        await this.run(query, section);
        return;
      }
      this.access = data.privateAvailable;
      this.hooks.ready(data, append);
    } catch {
      if (own === this.epoch) this.hooks.failed();
    } finally {
      if (own === this.epoch) clearTimeout(this.timeout);
    }
  }
}

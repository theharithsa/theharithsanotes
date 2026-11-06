export type AuthPhase = "loading" | "ready" | "signed-out" | "denied" | "error";
interface Options<U extends { uid: string }, P> {
  ready(): Promise<void>;
  user(): U | null;
  verify(user: U): Promise<P>;
  clear(): void;
  show(phase: AuthPhase, message?: string): void;
  enter(profile: P): void | Promise<void>;
  denied(error: unknown): boolean;
  message(error: unknown): string;
}
export class AuthRestoration<U extends { uid: string }, P> {
  private epoch = 0;
  private options: Options<U, P>;
  constructor(options: Options<U, P>) {
    this.options = options;
    options.show("loading");
  }
  get version(): number {
    return this.epoch;
  }
  suspend(): void {
    this.epoch++;
    this.options.clear();
    this.options.show("loading");
  }
  async restore(): Promise<void> {
    this.suspend();
    const own = this.epoch;
    try {
      await this.options.ready();
      if (own !== this.epoch) return;
      const user = this.options.user();
      if (!user) {
        this.options.show("signed-out");
        return;
      }
      const profile = await this.options.verify(user);
      if (own !== this.epoch || user.uid !== this.options.user()?.uid) return;
      await this.options.enter(profile);
      if (own !== this.epoch || user.uid !== this.options.user()?.uid) return;
      this.options.show("ready");
    } catch (error) {
      if (own !== this.epoch) return;
      this.options.clear();
      this.options.show(
        this.options.denied(error) ? "denied" : "error",
        this.options.message(error),
      );
    }
  }
}

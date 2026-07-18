let displayFontPromise: Promise<unknown> | null = null;

/** Load Fraunces after first paint so the landing LCP headline can use DM Sans. */
export function ensureDisplayFont(): void {
  displayFontPromise ??= import("../styles/fraunces-latin.css");
}

let displayFontPromise: Promise<unknown> | null = null;
let scheduled = false;

function loadDisplayFont(): void {
  displayFontPromise ??= import("../styles/fraunces-latin.css");
}

/**
 * Load Fraunces after the landing LCP window so it does not contend with
 * DM Sans / critical JS on `/`. Callers remain fire-and-forget.
 */
export function ensureDisplayFont(): void {
  if (displayFontPromise || scheduled) {
    return;
  }
  scheduled = true;

  const start = () => {
    loadDisplayFont();
  };

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(start, { timeout: 3000 });
  } else {
    setTimeout(start, 1500);
  }
}

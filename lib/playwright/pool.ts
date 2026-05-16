import { chromium, Browser } from "playwright";

const DEFAULT_BROWSER_IDLE_MS = 10_000;

let browserPromise: Promise<Browser> | null = null;
let activeBrowserUsers = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

export function resolveBrowserIdleMs(raw = process.env.PLAYWRIGHT_BROWSER_IDLE_MS): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return DEFAULT_BROWSER_IDLE_MS;
  return Math.max(0, parsed);
}

function clearIdleTimer(): void {
  if (!idleTimer) return;
  clearTimeout(idleTimer);
  idleTimer = null;
}

async function closeIdleBrowser(): Promise<void> {
  if (activeBrowserUsers > 0 || !browserPromise) return;

  const closingBrowserPromise = browserPromise;
  browserPromise = null;
  clearIdleTimer();

  const browser = await closingBrowserPromise;
  await browser.close();
}

function scheduleIdleClose(): void {
  if (activeBrowserUsers > 0 || !browserPromise || idleTimer) return;

  idleTimer = setTimeout(() => {
    void closeIdleBrowser().catch(() => undefined);
  }, resolveBrowserIdleMs());
  idleTimer.unref?.();
}

export function getBrowser(): Promise<Browser> {
  clearIdleTimer();
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function withBrowser<T>(callback: (browser: Browser) => Promise<T>): Promise<T> {
  activeBrowserUsers += 1;
  try {
    const browser = await getBrowser();
    return await callback(browser);
  } finally {
    activeBrowserUsers = Math.max(0, activeBrowserUsers - 1);
    scheduleIdleClose();
  }
}

export async function resetBrowser(): Promise<void> {
  clearIdleTimer();
  if (!browserPromise) return;
  const closingBrowserPromise = browserPromise;
  browserPromise = null;
  activeBrowserUsers = 0;
  const browser = await closingBrowserPromise;
  await browser.close();
}

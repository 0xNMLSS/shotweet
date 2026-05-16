jest.mock("playwright", () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

import { chromium } from "playwright";
import { resetBrowser, withBrowser } from "@/lib/playwright/pool";

const mockedLaunch = jest.mocked(chromium.launch);

describe("playwright browser pool", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedLaunch.mockReset();
    process.env.PLAYWRIGHT_BROWSER_IDLE_MS = "1000";
  });

  afterEach(async () => {
    await resetBrowser();
    jest.clearAllTimers();
    jest.useRealTimers();
    delete process.env.PLAYWRIGHT_BROWSER_IDLE_MS;
  });

  it("keeps the browser warm briefly and closes it after the idle timeout", async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    mockedLaunch.mockResolvedValue({ close } as never);

    await withBrowser(async () => undefined);

    expect(close).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(999);
    expect(close).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("reuses the browser when another task starts before the idle timeout", async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    mockedLaunch.mockResolvedValue({ close } as never);

    await withBrowser(async () => undefined);
    await jest.advanceTimersByTimeAsync(500);
    await withBrowser(async () => undefined);

    expect(mockedLaunch).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1000);
    expect(close).toHaveBeenCalledTimes(1);
  });
});

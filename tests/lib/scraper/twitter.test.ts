import fs from "node:fs";
import path from "node:path";

jest.mock("@/lib/playwright/pool", () => ({
  getBrowser: jest.fn(),
}));

import { scrapeTweet } from "@/lib/scraper/twitter";
import { getBrowser } from "@/lib/playwright/pool";

const mockedGetBrowser = jest.mocked(getBrowser);

describe("scrapeTweet", () => {
  let fixtureHtml: string;

  beforeAll(() => {
    fixtureHtml = fs.readFileSync(
      path.join(process.cwd(), "tests", "fixtures", "twitter", "plain.html"),
      "utf8"
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const close = jest.fn().mockResolvedValue(undefined);
    const content = jest.fn().mockResolvedValue(fixtureHtml);
    const waitForSelector = jest.fn().mockResolvedValue(null);
    const goto = jest.fn().mockResolvedValue(undefined);

    const route = jest.fn((_pattern: string, handler: (r: {
      request: () => { url: () => string };
      continue: jest.Mock;
      abort: jest.Mock;
    }) => void) => {
      handler({
        request: () => ({
          url: () => "https://example.com/some-resource",
        }),
        continue: jest.fn(),
        abort: jest.fn(),
      });
    });

    const newPage = jest.fn().mockResolvedValue({
      route,
      goto,
      waitForSelector,
      content,
    });

    const newContext = jest.fn().mockResolvedValue({
      newPage,
      close,
    });

    mockedGetBrowser.mockResolvedValue({ newContext } as never);
  });

  it("normalizes the input url and returns TweetData", async () => {
    await expect(scrapeTweet("https://twitter.com/sama/status/1913240824012345678")).resolves.toMatchObject({
      id: "1913240824012345678",
      author: { handle: "sama" },
    });
  });
});

import { getBrowser } from "@/lib/playwright/pool";
import { extractTweetData } from "@/lib/scraper/extractTweetData";
import { normalizeTweetUrl } from "@/lib/twitter/url";

export async function scrapeTweet(inputUrl: string) {
  const url = normalizeTweetUrl(inputUrl);
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.route("**/*", (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("video.twimg.com") || requestUrl.includes("/notifications")) {
      return route.abort();
    }
    return route.continue();
  });

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 });
  const html = await page.content();
  await context.close();

  return extractTweetData(html, url);
}

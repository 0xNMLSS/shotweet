import type { TweetData } from "@/lib/scraper/types";

const cache = new Map<string, TweetData>();

export function setRenderTweet(id: string, data: TweetData) {
  cache.set(id, data);
}

export function getRenderTweet(id: string) {
  return cache.get(id);
}

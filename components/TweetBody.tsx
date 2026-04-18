import type { TweetData } from "@/lib/scraper/types";

export default function TweetBody({ body }: { body: TweetData["body"] }) {
  return (
    <div className="mt-3 whitespace-pre-wrap break-words text-[23px] leading-7 text-zinc-100">{body.text}</div>
  );
}

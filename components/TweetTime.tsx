import { formatTweetTimestamp } from "@/lib/twitter/format";

export default function TweetTime({ createdAt }: { createdAt: string }) {
  return <p className="mt-3 text-[15px] text-zinc-500">{formatTweetTimestamp(createdAt)}</p>;
}

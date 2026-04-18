import { formatCount } from "@/lib/twitter/format";
import type { TweetData } from "@/lib/scraper/types";
import XLogoBadge from "@/components/XLogoBadge";

export default function TweetStats({ stats }: { stats: TweetData["stats"] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-800 pt-3 text-[15px] text-zinc-500">
      <span>
        <span className="font-medium text-zinc-300">{formatCount(stats.replies)}</span> 评论
      </span>
      <span>
        <span className="font-medium text-zinc-300">{formatCount(stats.retweets)}</span> 转发
      </span>
      <span>
        <span className="font-medium text-zinc-300">{formatCount(stats.likes)}</span> 赞
      </span>
      <XLogoBadge className="ml-auto" />
    </div>
  );
}

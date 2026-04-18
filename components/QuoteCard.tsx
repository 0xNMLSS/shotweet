import type { TweetData } from "@/lib/scraper/types";

export default function QuoteCard({ data }: { data: TweetData }) {
  return (
    <div className="mt-4 rounded-xl border border-[#2f3336] p-3 text-[15px] leading-5 text-zinc-400">
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <span className="font-semibold text-zinc-200">{data.author.name}</span>
        <span className="text-zinc-500">@{data.author.handle}</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-[14px] leading-5 text-zinc-300">{data.body.text}</p>
    </div>
  );
}

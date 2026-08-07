import type { TweetData } from "@/lib/scraper/types";

export default function QuoteCard({ data }: { data: TweetData }) {
  const images = data.media.filter((m) => m.type === "image");

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[#2f3336] text-[15px] leading-5 text-zinc-400">
      <div className="p-3">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-zinc-200">{data.author.name}</span>
          <span className="text-zinc-500">@{data.author.handle}</span>
        </div>
        <p className="whitespace-pre-wrap break-words text-[14px] leading-5 text-zinc-300">{data.body.text}</p>
      </div>
      {images.length > 0 ? (
        <div className="flex flex-col gap-px border-t border-[#2f3336]">
          {images.map((m, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              alt={m.alt ?? ""}
              className="h-auto w-full object-cover"
              src={m.src}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

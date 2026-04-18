import type { TweetData } from "@/lib/scraper/types";

function VerifiedBadge() {
  return (
    <svg aria-hidden className="inline h-[1.1em] w-[1.1em] shrink-0 text-sky-500" viewBox="0 0 24 24">
      <path
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.363-.546-.89-.973-1.529-1.2-.6-.224-1.255-.243-1.884-.33-.382-.048-.697-.218-.883-.544-.278-.49-.546-.991-.818-1.49-.363-.661-1.028-1.027-1.749-1.027-.75 0-1.44.39-1.79 1.028-.27.5-.54 1-.82 1.49-.185.326-.5.496-.883.544-.63.087-1.284.106-1.885.33-.64.227-1.165.654-1.53 1.2-.354.54-.55 1.17-.569 1.816-.02.677.216 1.32.63 1.817.363.422.84.727 1.375.875.5.14 1.02.14 1.53.14h.03c.5 0 1.02 0 1.53-.14.535-.148 1.012-.453 1.375-.875.414-.497.65-1.14.63-1.817zM9.67 14.28l-2.45-2.45a.75.75 0 011.06-1.06l1.39 1.39 3.54-3.54a.75.75 0 011.06 1.06l-4.1 4.1a.75.75 0 01-1.06 0z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function TweetHeader({ author }: { author: TweetData["author"] }) {
  return (
    <div className="flex gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        className="h-12 w-12 shrink-0 rounded-full object-cover"
        height={48}
        src={author.avatar}
        width={48}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate font-bold text-zinc-100">{author.name}</span>
          {author.verified ? <VerifiedBadge /> : null}
        </div>
        <p className="truncate text-[15px] text-zinc-500">@{author.handle}</p>
      </div>
    </div>
  );
}

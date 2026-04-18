import type { TweetData } from "@/lib/scraper/types";

type MediaItem = TweetData["media"][number];

function MediaImg({ alt, className, src }: { alt?: string; className?: string; src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} className={className} src={src} />
  );
}

export default function TweetMedia({ media }: { media: TweetData["media"] }) {
  if (media.length === 0) return null;

  const images = media.filter((m): m is Extract<MediaItem, { type: "image" }> => m.type === "image");
  if (images.length === 0) return null;

  const n = images.length;

  if (n === 1) {
    const [m] = images;
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800">
        <MediaImg alt={m.alt} className="h-auto w-full object-cover" src={m.src} />
      </div>
    );
  }

  if (n === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-2xl">
        {images.map((m, i) => (
          <MediaImg
            key={i}
            alt={m.alt}
            className="aspect-square w-full object-cover"
            src={m.src}
          />
        ))}
      </div>
    );
  }

  if (n === 3) {
    const [a, b, c] = images;
    return (
      <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl">
        <div className="row-span-2 min-h-[120px]">
          <MediaImg alt={a.alt} className="h-full w-full object-cover" src={a.src} />
        </div>
        <div className="min-h-[59px]">
          <MediaImg alt={b.alt} className="h-full w-full object-cover" src={b.src} />
        </div>
        <div className="min-h-[59px]">
          <MediaImg alt={c.alt} className="h-full w-full object-cover" src={c.src} />
        </div>
      </div>
    );
  }

  const four = images.slice(0, 4);
  return (
    <div className="mt-3 grid grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl">
      {four.map((m, i) => (
        <MediaImg key={i} alt={m.alt} className="aspect-square w-full object-cover" src={m.src} />
      ))}
    </div>
  );
}

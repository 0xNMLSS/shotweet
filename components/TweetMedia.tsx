import type { TweetData } from "@/lib/scraper/types";

type MediaItem = TweetData["media"][number];

function MediaImg({ alt, src }: { alt?: string; src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} className="h-auto w-full object-cover" src={src} />
  );
}

/**
 * Render every image as a full-width vertical stack with each image's natural
 * aspect ratio preserved. Chosen over X's mosaic grids because the poster is a
 * tall mobile-friendly canvas where a single column reads more naturally than
 * 2x2 thumbnails and avoids cropping faces.
 *
 * `-mx-10` cancels the parent poster's `px-10` so images bleed edge-to-edge.
 * The previous `border` + `rounded-2xl` made sense when the wrapper sat inside
 * the inset content column; once flush with the canvas, both look like a stray
 * stroke at the very edge, so they are dropped here. The `gap-1` between
 * stacked images keeps a thin visual divider via the dark canvas peeking
 * through.
 */
export default function TweetMedia({ media }: { media: TweetData["media"] }) {
  const images = media.filter(
    (m): m is Extract<MediaItem, { type: "image" }> => m.type === "image",
  );
  if (images.length === 0) return null;

  return (
    <div className="-mx-10 mt-3 flex flex-col gap-1 overflow-hidden">
      {images.map((m, i) => (
        <MediaImg key={i} alt={m.alt} src={m.src} />
      ))}
    </div>
  );
}

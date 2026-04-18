import type { TweetData } from "@/lib/scraper/types";
import TweetHeader from "@/components/TweetHeader";
import TweetBody from "@/components/TweetBody";
import TweetMedia from "@/components/TweetMedia";
import QuoteCard from "@/components/QuoteCard";
import TweetTime from "@/components/TweetTime";
import TweetStats from "@/components/TweetStats";
import BrandFooter from "@/components/BrandFooter";

/**
 * Poster layout contract:
 * - Width is fixed at 1080px.
 * - `min-h-[1350px]` enforces a 4:5 aspect-ratio floor so short tweets render as
 *   a balanced card (mobile-friendly, IG Feed safe).
 * - Natural growth above the floor is unbounded; very long tweets keep working
 *   as "long screenshot" PNGs (per UX decision: don't truncate content).
 * - The container is a flex column so `BrandFooter` (with `mt-auto`) sits at
 *   the bottom of the canvas regardless of how much padding empty space there
 *   is between body content and the footer.
 * - Horizontal padding is `px-10` (40px). Earlier `px-16` left ~5.9% dark
 *   bands on each side which felt wasted on phone screens. `TweetMedia` opts
 *   out of this inset via `-mx-10` so images bleed edge-to-edge for impact,
 *   while text/header/quote/stats keep the comfortable inset for readability.
 */
export default function TweetPoster({ data }: { data: TweetData }) {
  return (
    <div
      id="poster"
      className="flex min-h-[1350px] w-[1080px] flex-col bg-[radial-gradient(circle_at_top_right,rgba(29,155,240,0.06),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(168,107,255,0.05),transparent_40%),#0a0a0f] px-10 py-12 text-zinc-100"
    >
      <TweetHeader author={data.author} />
      <TweetBody body={data.body} />
      <TweetMedia media={data.media} />
      {data.quoted ? <QuoteCard data={data.quoted} /> : null}
      <TweetTime createdAt={data.createdAt} />
      <TweetStats stats={data.stats} />
      <BrandFooter className="mt-auto" />
    </div>
  );
}

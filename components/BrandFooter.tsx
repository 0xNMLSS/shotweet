import clsx from "clsx";

/** Single-line poster attribution (plain text, no links). */
const DEFAULT_FOOTER_LINE =
  "shotweet from xxlemon · An app for better screenshots of your tweets.";

export default function BrandFooter({ className }: { className?: string }) {
  const line = process.env.SHOTWEET_FOOTER_TAGLINE?.trim() || DEFAULT_FOOTER_LINE;

  return (
    <div className={clsx("mt-4 border-t border-zinc-800 pt-3 antialiased", className)}>
      <p className="text-[12px] font-medium leading-snug text-zinc-300">{line}</p>
    </div>
  );
}

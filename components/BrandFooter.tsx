export default function BrandFooter() {
  const repoUrl = process.env.SHOTWEET_BRAND_REPO_URL ?? "https://github.com/0xNMLSS/shotweet";

  return (
    <div className="mt-4 border-t border-zinc-800 pt-3 text-[10px] text-zinc-500">
      shotweet from{" "}
      <a className="underline decoration-zinc-700 underline-offset-2" href={repoUrl}>
        xxlemon
      </a>
    </div>
  );
}

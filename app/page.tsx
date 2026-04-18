import PosterGeneratorForm from "@/components/PosterGeneratorForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">shotweet</h1>
        <p className="text-lg text-zinc-400">
          Turn Twitter/X post URLs into vertical PNG posters.
        </p>
        <PosterGeneratorForm />
      </div>
    </main>
  );
}

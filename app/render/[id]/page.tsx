import { notFound } from "next/navigation";
import TweetPoster from "@/components/TweetPoster";
import { getRenderTweet } from "@/lib/renderer/cache";

export default function RenderPosterPage({ params }: { params: { id: string } }) {
  const tweet = getRenderTweet(params.id);
  if (!tweet) notFound();
  return <TweetPoster data={tweet} />;
}

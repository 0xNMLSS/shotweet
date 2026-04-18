export type TweetEntity =
  | { type: "mention"; text: string; href: string }
  | { type: "hashtag"; text: string; href: string }
  | { type: "url"; text: string; href: string };

export type TweetData = {
  id: string;
  url: string;
  author: { name: string; handle: string; avatar: string; verified: boolean };
  body: { text: string; entities: TweetEntity[] };
  media: { type: "image"; src: string; alt?: string }[];
  stats: { replies: number; retweets: number; likes: number; views: number };
  createdAt: string;
  quoted?: TweetData;
};

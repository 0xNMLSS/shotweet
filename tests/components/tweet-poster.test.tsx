import { render, screen } from "@testing-library/react";
import TweetPoster from "@/components/TweetPoster";
import TweetMedia from "@/components/TweetMedia";
import plainTweet from "@/tests/fixtures/tweets/plain.json";
import quoteTweet from "@/tests/fixtures/tweets/quote.json";

describe("TweetPoster", () => {
  it("renders author, body, stats, and brand footer", () => {
    render(<TweetPoster data={plainTweet} />);
    expect(screen.getByText(/sam altman/i)).toBeInTheDocument();
    expect(screen.getByText(/92k/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /shotweet from xxlemon · An app for better screenshots of your tweets\./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders a nested quote card when quoted data exists", () => {
    render(<TweetPoster data={quoteTweet} />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });

  it("applies the 4:5 minimum-height floor and pins the brand footer to the bottom", () => {
    const { container } = render(<TweetPoster data={plainTweet} />);
    const poster = container.querySelector("#poster");
    expect(poster).not.toBeNull();
    expect(poster!.className).toMatch(/min-h-\[1350px\]/);
    expect(poster!.className).toMatch(/\bflex\b/);
    expect(poster!.className).toMatch(/\bflex-col\b/);

    const footer = screen
      .getByText(/shotweet from xxlemon · An app for better screenshots of your tweets\./i)
      .closest("div");
    expect(footer?.className).toMatch(/mt-auto/);
  });
});

describe("TweetMedia vertical stack", () => {
  it.each([1, 2, 3, 4])(
    "stacks %i image(s) vertically at full width with natural aspect ratios",
    (n) => {
      const items = Array.from({ length: n }, (_, i) => ({
        type: "image" as const,
        src: `https://pbs.twimg.com/media/img${i}.jpg?name=large`,
        alt: `img ${i}`,
      }));
      const { container } = render(<TweetMedia media={items} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.className).toMatch(/\bflex-col\b/);
      expect(wrapper.className).not.toMatch(/grid-cols-2/);
      const imgs = wrapper.querySelectorAll("img");
      expect(imgs).toHaveLength(n);
      imgs.forEach((img) => {
        expect(img.className).toMatch(/\bw-full\b/);
        expect(img.className).toMatch(/\bh-auto\b/);
        expect(img.className).not.toMatch(/aspect-square/);
      });
    },
  );
});

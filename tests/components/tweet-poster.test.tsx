import { render, screen } from "@testing-library/react";
import TweetPoster from "@/components/TweetPoster";
import plainTweet from "@/tests/fixtures/tweets/plain.json";
import quoteTweet from "@/tests/fixtures/tweets/quote.json";

describe("TweetPoster", () => {
  it("renders author, body, stats, and brand footer", () => {
    render(<TweetPoster data={plainTweet} />);
    expect(screen.getByText(/sam altman/i)).toBeInTheDocument();
    expect(screen.getByText(/92k/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /xxlemon/i })).toHaveAttribute(
      "href",
      "https://github.com/0xNMLSS/shotweet"
    );
  });

  it("renders a nested quote card when quoted data exists", () => {
    render(<TweetPoster data={quoteTweet} />);
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PosterGeneratorForm from "@/components/PosterGeneratorForm";

describe("PosterGeneratorForm", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("posts the tweet URL to /api/poster and shows the poster on success", async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        asset: {
          id: "test-id",
          sourceUrl: "https://x.com/user/status/1",
          downloadUrl: "/posters/1776507035-test.png",
          contentType: "image/png",
          filename: "1776507035-test.png",
          width: 1080,
          height: 2418,
          provider: "twitter",
          type: "image",
        },
      }),
    } as Response);

    render(<PosterGeneratorForm />);

    fireEvent.change(screen.getByLabelText(/tweet url/i), {
      target: { value: "https://x.com/user/status/1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/poster",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: "https://x.com/user/status/1" }),
        })
      );
    });

    expect(
      await screen.findByRole("img", { name: /generated poster/i })
    ).toHaveAttribute("src", "/posters/1776507035-test.png");

    const download = screen.getByRole("link", { name: /download png/i });
    expect(download).toHaveAttribute("href", "/posters/1776507035-test.png");
    expect(download).toHaveAttribute("download", "1776507035-test.png");
  });
});

import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the title, url input, and generate button", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: /shotweet/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/x\.com\//i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate/i })).toBeInTheDocument();
  });
});

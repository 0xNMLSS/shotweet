import { createPosterFilename, getPosterAbsolutePath, getPosterPublicUrl } from "@/lib/posters/storage";

describe("poster storage helpers", () => {
  it("creates png filenames with timestamp prefixes", () => {
    const filename = createPosterFilename("abcd1234");
    expect(filename).toMatch(/^\d{13}-abcd1234\.png$/);
  });

  it("maps filenames to public poster urls", () => {
    expect(getPosterPublicUrl("1713542400000-abcd1234.png")).toBe("/posters/1713542400000-abcd1234.png");
  });

  it("maps filenames to tmp poster paths", () => {
    expect(getPosterAbsolutePath("1713542400000-abcd1234.png")).toContain("/tmp/posters/1713542400000-abcd1234.png");
  });
});

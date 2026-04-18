import { upgradeAvatarUrl, upgradeMediaUrl } from "@/lib/twitter/media";

describe("upgradeAvatarUrl", () => {
  it("rewrites the _normal variant to _400x400", () => {
    expect(
      upgradeAvatarUrl("https://pbs.twimg.com/profile_images/1/ux-SjcRp_normal.jpg")
    ).toBe("https://pbs.twimg.com/profile_images/1/ux-SjcRp_400x400.jpg");
  });

  it("supports png/webp variants", () => {
    expect(upgradeAvatarUrl("https://x/foo_normal.png")).toBe("https://x/foo_400x400.png");
    expect(upgradeAvatarUrl("https://x/foo_normal.webp")).toBe(
      "https://x/foo_400x400.webp"
    );
  });

  it("leaves URLs without _normal alone", () => {
    const src = "https://pbs.twimg.com/profile_images/1/foo_400x400.jpg";
    expect(upgradeAvatarUrl(src)).toBe(src);
    expect(upgradeAvatarUrl("")).toBe("");
  });
});

describe("upgradeMediaUrl", () => {
  it("replaces small/medium/thumb/tiny with large", () => {
    const base = "https://pbs.twimg.com/media/HFNj2xybQAAtS6m?format=jpg";
    expect(upgradeMediaUrl(`${base}&name=small`)).toBe(`${base}&name=large`);
    expect(upgradeMediaUrl(`${base}&name=medium`)).toBe(`${base}&name=large`);
    expect(upgradeMediaUrl(`${base}&name=thumb`)).toBe(`${base}&name=large`);
    expect(upgradeMediaUrl(`${base}&name=tiny`)).toBe(`${base}&name=large`);
  });

  it("appends name=large when the parameter is missing", () => {
    expect(upgradeMediaUrl("https://pbs.twimg.com/media/HFNj?format=jpg")).toBe(
      "https://pbs.twimg.com/media/HFNj?format=jpg&name=large"
    );
    expect(upgradeMediaUrl("https://pbs.twimg.com/media/HFNj")).toBe(
      "https://pbs.twimg.com/media/HFNj?name=large"
    );
  });

  it("keeps name=large unchanged", () => {
    const src = "https://pbs.twimg.com/media/HFNj?format=jpg&name=large";
    expect(upgradeMediaUrl(src)).toBe(src);
  });

  it("leaves non-media URLs alone", () => {
    expect(upgradeMediaUrl("https://example.com/image.jpg?name=small")).toBe(
      "https://example.com/image.jpg?name=small"
    );
    expect(upgradeMediaUrl("")).toBe("");
  });
});

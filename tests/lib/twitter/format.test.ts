import { formatCount, formatTweetTimestamp } from "@/lib/twitter/format";

describe("twitter format helpers", () => {
  it("formats compact counts like the X UI", () => {
    expect(formatCount(2432)).toBe("2,432");
    expect(formatCount(18700)).toBe("18.7K");
    expect(formatCount(92000)).toBe("92K");
  });

  it("formats ISO timestamps into zh-CN display text", () => {
    expect(formatTweetTimestamp("2026-04-18T14:34:00.000Z")).toBe("下午 10:34 · 2026年4月18日");
  });
});

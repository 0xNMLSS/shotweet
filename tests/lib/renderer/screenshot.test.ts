import { resolvePixelRatio } from "@/lib/renderer/screenshot";

describe("resolvePixelRatio", () => {
  it("defaults to 3 when env var is unset", () => {
    expect(resolvePixelRatio(undefined)).toBe(3);
  });

  it("defaults to 3 when env var is non-numeric", () => {
    expect(resolvePixelRatio("retina")).toBe(3);
    expect(resolvePixelRatio("")).toBe(3);
  });

  it("accepts integer values inside [1, 3]", () => {
    expect(resolvePixelRatio("1")).toBe(1);
    expect(resolvePixelRatio("2")).toBe(2);
    expect(resolvePixelRatio("3")).toBe(3);
  });

  it("clamps to the supported range", () => {
    expect(resolvePixelRatio("0")).toBe(1);
    expect(resolvePixelRatio("-5")).toBe(1);
    expect(resolvePixelRatio("4")).toBe(3);
    expect(resolvePixelRatio("99")).toBe(3);
  });

  it("uses the integer part of decimal strings", () => {
    expect(resolvePixelRatio("2.7")).toBe(2);
  });
});

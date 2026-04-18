/**
 * Upgrade a Twitter profile-image URL from the 48px `_normal` variant to the
 * 400x400 variant. Other URLs are returned unchanged.
 */
export function upgradeAvatarUrl(src: string): string {
  if (!src) return src;
  return src.replace(/_normal(\.(?:jpg|jpeg|png|webp|gif))/i, "_400x400$1");
}

/**
 * Upgrade a `pbs.twimg.com/media/...` URL to the `name=large` variant so the
 * exported poster gets a sharp version of the image. URLs that aren't tweet
 * media are returned unchanged.
 */
export function upgradeMediaUrl(src: string): string {
  if (!src || !src.includes("pbs.twimg.com/media/")) return src;
  if (/[?&]name=/.test(src)) {
    return src.replace(/([?&]name=)(?:small|medium|thumb|tiny|orig)/i, "$1large");
  }
  return src + (src.includes("?") ? "&" : "?") + "name=large";
}

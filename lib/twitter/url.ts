export function extractTweetId(input: string): string {
  const url = new URL(input);
  const parts = url.pathname.split("/").filter(Boolean);
  const statusIndex = parts.indexOf("status");
  if (statusIndex === -1 || !parts[statusIndex + 1]) throw new Error("Invalid tweet URL");
  return parts[statusIndex + 1];
}

export function normalizeTweetUrl(input: string): string {
  const url = new URL(input);
  url.hostname = "x.com";
  return url.toString();
}

export function formatCount(value: number): string {
  if (value < 10000) return value.toLocaleString("en-US");
  const compact = value >= 100000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1);
  return `${compact.replace(/\.0$/, "")}K`;
}

/** Poster timestamps: English labels, Asia/Shanghai for stable wall-clock across environments. */
export function formatTweetTimestamp(iso: string): string {
  const date = new Date(iso);
  const timeZone = "Asia/Shanghai";
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
  return `${time} · ${day}`;
}

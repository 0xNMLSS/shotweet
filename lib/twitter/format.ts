export function formatCount(value: number): string {
  if (value < 10000) return value.toLocaleString("en-US");
  const compact = value >= 100000 ? (value / 1000).toFixed(0) : (value / 1000).toFixed(1);
  return `${compact.replace(/\.0$/, "")}K`;
}

/** Poster timestamps are always formatted in Asia/Shanghai with zh-CN labels (design spec). */
export function formatTweetTimestamp(iso: string): string {
  const date = new Date(iso);
  const timeRaw = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  const time = timeRaw.replace(/^(下午|上午)(\d)/, "$1 $2");
  const day = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return `${time} · ${day}`;
}

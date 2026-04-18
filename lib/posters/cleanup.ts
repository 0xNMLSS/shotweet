import fs from "node:fs/promises";
import path from "node:path";

const POSTERS_DIR = path.join(process.cwd(), "tmp", "posters");

function getPosterTtlSeconds(): number {
  const raw = process.env.POSTER_TTL_SECONDS;
  if (raw === undefined || raw === "") return 3600;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 3600;
}

export async function cleanupExpiredPosters(): Promise<void> {
  const ttlSeconds = getPosterTtlSeconds();
  const cutoffMs = Date.now() - ttlSeconds * 1000;

  let entries: string[];
  try {
    entries = await fs.readdir(POSTERS_DIR);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return;
    throw error;
  }

  await Promise.all(
    entries.map(async (name) => {
      const fullPath = path.join(POSTERS_DIR, name);
      const stat = await fs.stat(fullPath);
      if (!stat.isFile()) return;
      if (stat.mtimeMs < cutoffMs) {
        await fs.unlink(fullPath);
      }
    })
  );
}

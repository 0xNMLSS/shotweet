import path from "node:path";

const POSTERS_DIR = path.join(process.cwd(), "tmp", "posters");

export function createPosterFilename(seed: string): string {
  return `${Date.now()}-${seed}.png`;
}

export function getPosterAbsolutePath(filename: string): string {
  return path.join(POSTERS_DIR, filename);
}

export function getPosterPublicUrl(filename: string): string {
  return `/posters/${filename}`;
}

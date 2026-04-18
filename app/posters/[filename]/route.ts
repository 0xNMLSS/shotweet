import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getPosterAbsolutePath } from "@/lib/posters/storage";

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  if (filename.includes("..")) {
    return new NextResponse(null, { status: 400 });
  }

  const absolutePath = getPosterAbsolutePath(filename);
  try {
    const data = await fs.readFile(absolutePath);
    return new NextResponse(data, {
      headers: { "Content-Type": "image/png" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

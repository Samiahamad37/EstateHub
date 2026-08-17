import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireRole } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg", "video/mp4"]);
const MAX_SIZE = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(["AGENT", "OWNER", "ADMIN"]);
  if (error || !user) return error!;

  const blocked = rateLimit(clientKey(request, "upload"), 30, 60_000);
  if (!blocked.ok) return NextResponse.json({ error: "Upload rate limit exceeded" }, { status: 429 });

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files uploaded" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files.slice(0, 12)) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Each file must be 8MB or smaller" }, { status: 400 });
    }
    const ext = file.type === "video/mp4" ? "mp4" : file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const name = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);
    urls.push(`/uploads/${name}`);
  }

  return NextResponse.json({ urls });
}

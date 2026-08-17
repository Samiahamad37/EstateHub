import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assistantSchema } from "@/lib/validators";
import { runAssistant } from "@/lib/ai";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const blocked = rateLimit(clientKey(request, "assistant"), 20, 60_000);
  if (!blocked.ok) return NextResponse.json({ error: "Too many questions. Please wait a moment." }, { status: 429 });

  const parsed = assistantSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Ask a longer question" }, { status: 400 });

  const session = await getSession();
  const result = await runAssistant(parsed.data.message, session?.id);
  return NextResponse.json(result);
}

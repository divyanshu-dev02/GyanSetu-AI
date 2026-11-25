import { NextRequest } from "next/server";
import { resetDemoClassStats } from "@/lib/tools/teacher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const stats = await resetDemoClassStats();
  return Response.json({ ok: true, resetCount: stats.length });
}

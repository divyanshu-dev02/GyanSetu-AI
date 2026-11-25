import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const env = getServerEnv();
  return NextResponse.json({
    ok: true,
    service: "gyansetu-ai",
    demoMode: env.DEMO_MODE || !env.GROQ_API_KEY,
    timestamp: new Date().toISOString(),
  });
}

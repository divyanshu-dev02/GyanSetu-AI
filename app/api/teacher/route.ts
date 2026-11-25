import { NextRequest } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { runTeacherAgent } from "@/lib/agent/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  language: z.enum(["en", "hi", "kn"]).default("en"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    parsedBody = bodySchema.parse(json);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request body", details: err instanceof ZodError ? err.flatten() : undefined }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(": heartbeat\n\n")); }
        catch { clearInterval(heartbeat); }
      }, 2000);

      const emit = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // controller might already be closed
        }
      };

      try {
        await runTeacherAgent(parsedBody.language, emit);
      } catch (err) {
        emit({ type: "final", payload: { error: err instanceof Error ? err.message : "Agent error" } });
      } finally {
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* ignore */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

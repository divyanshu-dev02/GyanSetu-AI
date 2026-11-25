import { NextRequest } from "next/server";
import { z } from "zod";
import { runStudentAgent } from "@/lib/agent/runner";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  studentId: z.string().min(1).default("stu-aarav"),
  message: z.string().min(1),
  language: z.enum(["en", "hi", "kn"]).default("en"),
  imageBase64: z.string().optional(),
  isRetryEasier: z.boolean().optional(),
  gradeResult: z
    .object({
      score: z.number(),
      total: z.number(),
      passed: z.boolean(),
      misconceptionsFound: z.array(z.string()),
      nextAction: z.enum(["retry_easier", "level_up"]),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(rl.retryAfterSeconds),
      },
    });
  }

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    parsedBody = bodySchema.parse(json);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await runStudentAgent(parsedBody, emit);
      } catch (err) {
        emit({
          type: "final",
          payload: { error: err instanceof Error ? err.message : "Agent error" },
        });
      } finally {
        controller.close();
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

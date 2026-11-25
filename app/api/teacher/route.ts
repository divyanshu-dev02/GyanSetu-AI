import { NextRequest } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClassStats } from "@/lib/store";
import { executeTeacherTool, teacherToolDeclarations } from "@/lib/tools";
import { getTeacherFixture } from "@/data/fixtures/teacher-fixtures";
import type { Language, TeacherFinalPayload, TraceEvent } from "@/lib/types";
import { GoogleGenAI, type Part } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_STEPS = 6;
const GEMINI_TIMEOUT_MS = 8000;

const LANG_NAME: Record<Language, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  kn: "Kannada (Kannada script)",
};

const bodySchema = z.object({
  language: z.enum(["en", "hi", "kn"]).default("en"),
});

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("GEMINI_TIMEOUT")), ms);
    p.then((v) => { clearTimeout(t); res(v); })
     .catch((e) => { clearTimeout(t); rej(e); });
  });
}

type EmitFn = (event: TraceEvent | { type: "final"; payload: unknown }) => void;

async function streamDemoTeacher(language: Language, emit: EmitFn) {
  const stats = await getClassStats();
  const fixture = getTeacherFixture(language, stats);

  const steps: Array<{ tool: string; summary: string }> = [];
  // Simulate real tool execution so summaries are accurate
  const statsRes = await executeTeacherTool("get_class_stats", {});
  steps.push({ tool: "get_class_stats", summary: statsRes.summary });
  const planRes = await executeTeacherTool("generate_revision_plan", fixture.revisionPlan);
  steps.push({ tool: "generate_revision_plan", summary: planRes.summary });
  const peerRes = await executeTeacherTool("suggest_peer_groups", { groups: fixture.peerGroups });
  steps.push({ tool: "suggest_peer_groups", summary: peerRes.summary });

  for (let i = 0; i < steps.length; i++) {
    emit({ type: "trace", step: i + 1, tool: steps[i].tool, summary: steps[i].summary });
    await new Promise((r) => setTimeout(r, 160));
  }
  emit({ type: "final", payload: fixture });
}

async function runTeacherAgent(language: Language, emit: EmitFn) {
  const env = getServerEnv();
  if (env.DEMO_MODE || !env.GEMINI_API_KEY) {
    await streamDemoTeacher(language, emit);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const systemInstruction = `You are GyanSetu AI Teacher Co-Pilot. Respond in ${LANG_NAME[language]}.
Follow this exact loop using tools (max ${MAX_STEPS} steps):
1. Call get_class_stats to fetch current mastery data.
2. Identify the topic with masteryPercent < 60 (the weakest one).
3. Call generate_revision_plan for that topic — a 45-minute plan with 4–6 specific steps. Address the topMisconception directly in the first step.
4. Call suggest_peer_groups: pair students who mastered this topic as mentors with struggling learners.`;

    const contents: { role: string; parts: Part[] }[] = [
      { role: "user", parts: [{ text: "Generate Smart Lesson Plan for my class." }] },
    ];

    let classStats = await getClassStats();
    let revisionPlan: TeacherFinalPayload["revisionPlan"] | null = null;
    let peerGroups: TeacherFinalPayload["peerGroups"] = [];
    let zodRetried = false;

    for (let step = 1; step <= MAX_STEPS; step++) {
      const response = await withTimeout(
        ai.models.generateContent({
          model: env.GEMINI_MODEL,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: teacherToolDeclarations }],
          },
        }),
        GEMINI_TIMEOUT_MS
      );

      const calls = response.functionCalls;
      if (!calls || calls.length === 0) break;

      const responseParts: Part[] = [];
      let needsRetry = false;

      for (const call of calls) {
        const name = call.name ?? "unknown";
        const args = (call.args as Record<string, unknown>) ?? {};
        try {
          const { result, summary } = await executeTeacherTool(name, args);
          emit({ type: "trace", step, tool: name, summary });

          if (name === "get_class_stats" && Array.isArray(result)) {
            classStats = result as TeacherFinalPayload["classStats"];
          }
          if (name === "generate_revision_plan") {
            revisionPlan = {
              title: String(args.title ?? "Revision Plan"),
              durationMinutes: Number(args.durationMinutes ?? 45),
              focusTopic: String(args.focusTopic ?? ""),
              steps: (args.steps as TeacherFinalPayload["revisionPlan"]["steps"]) ?? [],
            };
          }
          if (name === "suggest_peer_groups" && Array.isArray(args.groups)) {
            peerGroups = args.groups as TeacherFinalPayload["peerGroups"];
          }
          responseParts.push({ functionResponse: { name, response: { result } } });
        } catch (err) {
          if (err instanceof ZodError && !zodRetried) {
            zodRetried = true;
            needsRetry = true;
            responseParts.push({
              functionResponse: {
                name,
                response: { error: `Invalid arguments: ${err.message}. Fix and retry once.` },
              },
            });
          } else {
            throw err;
          }
        }
      }

      contents.push({ role: "model", parts: calls.map((c) => ({ functionCall: c })) });
      contents.push({ role: "user", parts: responseParts });

      if (!needsRetry && revisionPlan && peerGroups.length > 0) break;
    }

    if (!revisionPlan) {
      await streamDemoTeacher(language, emit);
      return;
    }

    const payload: TeacherFinalPayload = {
      language,
      classStats,
      revisionPlan,
      peerGroups,
      demoMode: false,
    };
    emit({ type: "final", payload });
  } catch {
    await streamDemoTeacher(language, emit);
  }
}

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
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await runTeacherAgent(parsedBody.language, emit);
      } catch (err) {
        emit({ type: "final", payload: { error: err instanceof Error ? err.message : "Agent error" } });
      } finally {
        clearInterval(heartbeat);
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

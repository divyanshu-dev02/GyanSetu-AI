import { runStudentAgent } from "../lib/agent/runner";
import type { TraceEvent, TutorFinalPayload } from "../lib/types";

async function main() {
  console.log("=== GyanSetu AI: Fail-Then-Retry Agent Trace Test ===\n");

  console.log("--- Phase 1: Initial Student Doubt (Newton's Third Law) ---");
  let firstPayload: TutorFinalPayload | null = null;
  await runStudentAgent(
    {
      studentId: "stu-aarav",
      message: "Why don't action and reaction forces cancel out in Newton's third law?",
      language: "en",
    },
    (event) => {
      if (event.type === "trace") {
        const t = event as TraceEvent;
        console.log(`[TRACE step=${t.step}] ${t.tool}: ${t.summary}`);
      } else if (event.type === "final") {
        firstPayload = event.payload as TutorFinalPayload;
      }
    }
  );

  if (!firstPayload) {
    throw new Error("Phase 1 did not emit final payload");
  }
  const p1 = firstPayload as TutorFinalPayload;
  console.log(`Initial level: ${p1.difficulty}, Analogy: "${p1.analogy}"`);
  console.log(`Generated ${p1.quiz.length} MCQs.\n`);

  console.log("--- Phase 2: Student Scores 1/3 (FAIL) -> Adaptive Retry ---");
  let retryPayload: TutorFinalPayload | null = null;
  await runStudentAgent(
    {
      studentId: "stu-aarav",
      message: "Why don't action and reaction forces cancel out in Newton's third law?",
      language: "en",
      isRetryEasier: true,
      gradeResult: {
        score: 1,
        total: 3,
        passed: false,
        misconceptionsFound: ["Confuses mass with force cancellation", "Thinks rockets need air to push against"],
        nextAction: "retry_easier",
      },
    },
    (event) => {
      if (event.type === "trace") {
        const t = event as TraceEvent;
        console.log(`[TRACE step=${t.step}] ${t.tool}: ${t.summary}`);
      } else if (event.type === "final") {
        retryPayload = event.payload as TutorFinalPayload;
      }
    }
  );

  if (!retryPayload) {
    throw new Error("Phase 2 did not emit final payload");
  }
  const p2 = retryPayload as TutorFinalPayload;
  console.log(`Adapted level: ${p2.difficulty}, New Analogy: "${p2.analogy}"`);
  console.log(`Different analogy verified: ${p1.analogy !== p2.analogy}`);
  console.log(`Adapted quiz count: ${p2.quiz.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

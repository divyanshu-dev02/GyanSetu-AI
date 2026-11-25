import { GoogleGenAI, type Part } from "@google/genai";
import { ZodError } from "zod";
import { detectFixtureTopic, getTutorFixture } from "@/data/fixtures/tutor-fixtures";
import { getTeacherFixture } from "@/data/fixtures/teacher-fixtures";
import { getServerEnv } from "@/lib/env";
import { getClassStats } from "@/lib/store";
import { executeStudentTool, studentToolDeclarations } from "@/lib/tools";
import type {
  DifficultyLevel,
  Language,
  QuizQuestion,
  TeacherFinalPayload,
  TraceEvent,
  TutorFinalPayload,
} from "@/lib/types";
import { executeTeacherTool, teacherToolDeclarations } from "@/lib/tools";

const MAX_STEPS = 6;
const GEMINI_TIMEOUT_MS = 8000;

export type EmitFn = (event: TraceEvent | { type: "final"; payload: unknown }) => void;

const LANG_NAME: Record<Language, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  kn: "Kannada (Kannada script)",
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function streamDemoTutor(
  params: {
    studentId: string;
    message: string;
    language: Language;
    isRetryEasier?: boolean;
    gradeResult?: TutorFinalPayload["gradeResult"];
  },
  emit: EmitFn
) {
  const topicKey = detectFixtureTopic(params.message);
  const fixture = getTutorFixture(topicKey, params.language, params.isRetryEasier);
  if (params.gradeResult) {
    fixture.gradeResult = params.gradeResult;
  }

  let step = 1;
  const emitTrace = async (tool: string, summary: string) => {
    emit({ type: "trace", step: step++, tool, summary });
    await new Promise((r) => setTimeout(r, 120));
  };

  const profileRes = await executeStudentTool("get_student_profile", { studentId: params.studentId });
  await emitTrace("get_student_profile", profileRes.summary);

  if (params.gradeResult) {
    const gradeRes = await executeStudentTool("grade_answers", {
      score: params.gradeResult.score,
      total: params.gradeResult.total,
      misconceptionsFound: params.gradeResult.misconceptionsFound,
    });
    await emitTrace("grade_answers", gradeRes.summary);

    const updRes = await executeStudentTool("update_progress", {
      studentId: params.studentId,
      topic: fixture.topic,
      passed: params.gradeResult.passed,
      score: params.gradeResult.score,
      total: params.gradeResult.total,
    });
    await emitTrace("update_progress", updRes.summary);

    if (!params.gradeResult.passed) {
      const flagRes = await executeStudentTool("flag_class_weakness", {
        topic: fixture.topic,
        misconception: params.gradeResult.misconceptionsFound[0] || "Conceptual gap",
      });
      await emitTrace("flag_class_weakness", flagRes.summary);
    }
  } else {
    const gapRes = await executeStudentTool("find_prerequisite_gap", { topic: fixture.topic });
    await emitTrace("find_prerequisite_gap", gapRes.summary);
  }

  await emitTrace(
    "explain_doubt",
    params.isRetryEasier
      ? "Re-explaining with a DIFFERENT analogy at simple level"
      : `Prepared ${fixture.difficulty} explanation in ${LANG_NAME[params.language]}`
  );
  await emitTrace("generate_quiz", `Generated 3 ${fixture.difficulty} MCQs targeting misconceptions`);

  emit({ type: "final", payload: fixture });
}

export async function runStudentAgent(
  params: {
    studentId: string;
    message: string;
    language: Language;
    imageBase64?: string;
    isRetryEasier?: boolean;
    gradeResult?: TutorFinalPayload["gradeResult"];
  },
  emit: EmitFn
) {
  const env = getServerEnv();
  if (env.DEMO_MODE || !env.GEMINI_API_KEY) {
    await streamDemoTutor(params, emit);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const systemInstruction = `You are GyanSetu AI, a patient agentic tutor. Respond in ${LANG_NAME[params.language]}.
Follow this exact pedagogical loop using tools (max ${MAX_STEPS} steps):
1. Check history first: call get_student_profile("${params.studentId}").
2. Choose your own starting level (simple / standard / advanced) from the student's mastery & weakTopics.
3. Call find_prerequisite_gap to check foundational concepts and address any gap.
4. Diagnose the student's misconception from their question${params.gradeResult ? " and previous quiz results" : ""}.
${
  params.gradeResult
    ? `5. Call grade_answers, update_progress, and if passed=false call flag_class_weakness.
6. Since the student ${params.gradeResult.passed ? "PASSED (raise difficulty)" : "FAILED (adapt: use a DIFFERENT analogy and level='simple' with an easier quiz)"}, call explain_doubt and generate_quiz.`
    : `5. Call explain_doubt with a clear explanation and relatable analogy.
6. Call generate_quiz with 3 MCQs where each wrong option targets a specific misconception.`
}
Keep explanations concise and mobile-friendly.`;

    const parts: Part[] = [{ text: params.message }];
    if (params.imageBase64) {
      const cleaned = params.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: "image/jpeg", data: cleaned } });
    }

    const contents: { role: string; parts: Part[] }[] = [{ role: "user", parts }];

    let capturedTopic = "Concept Review";
    let capturedLevel: DifficultyLevel = params.isRetryEasier ? "simple" : "standard";
    let capturedExplanation = "";
    let capturedAnalogy = "";
    let capturedQuiz: QuizQuestion[] = [];
    let capturedGap: string | undefined;
    let zodRetried = false;

    for (let step = 1; step <= MAX_STEPS; step++) {
      const response = await withTimeout(
        ai.models.generateContent({
          model: env.GEMINI_MODEL,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: studentToolDeclarations }],
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
          const { result, summary } = await executeStudentTool(name, args);
          emit({ type: "trace", step, tool: name, summary });

          if (name === "find_prerequisite_gap") {
            capturedGap = (result as { prerequisites?: string[] }).prerequisites?.join(", ");
          }
          if (name === "explain_doubt") {
            capturedTopic = String(args.topic || capturedTopic);
            capturedLevel = String(args.level || capturedLevel) as DifficultyLevel;
            capturedExplanation = String(args.explanation || "");
            capturedAnalogy = String(args.analogy || "");
          }
          if (name === "generate_quiz" && Array.isArray(args.questions)) {
            capturedQuiz = args.questions as QuizQuestion[];
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

      if (!needsRetry && capturedExplanation && capturedQuiz.length === 3) {
        break;
      }
    }

    if (!capturedExplanation || capturedQuiz.length === 0) {
      await streamDemoTutor(params, emit);
      return;
    }

    const payload: TutorFinalPayload = {
      topic: capturedTopic,
      language: params.language,
      difficulty: capturedLevel,
      prerequisiteGap: capturedGap,
      explanation: capturedExplanation,
      analogy: capturedAnalogy,
      quiz: capturedQuiz,
      gradeResult: params.gradeResult,
      demoMode: false,
    };

    emit({ type: "final", payload });
  } catch {
    await streamDemoTutor(params, emit);
  }
}

async function streamDemoTeacher(language: Language, emit: EmitFn) {
  const stats = await getClassStats();
  const fixture = getTeacherFixture(language, stats);
  const steps = [
    { tool: "get_class_stats", summary: `Loaded mastery stats across ${stats.length} topics` },
    { tool: "generate_revision_plan", summary: `Built 15-min revision plan for ${fixture.revisionPlan.focusTopic}` },
    { tool: "suggest_peer_groups", summary: `Formed ${fixture.peerGroups.length} peer-learning groups` },
  ];
  for (let i = 0; i < steps.length; i++) {
    emit({ type: "trace", step: i + 1, tool: steps[i].tool, summary: steps[i].summary });
    await new Promise((r) => setTimeout(r, 150));
  }
  emit({ type: "final", payload: fixture });
}

export async function runTeacherAgent(language: Language, emit: EmitFn) {
  const env = getServerEnv();
  if (env.DEMO_MODE || !env.GEMINI_API_KEY) {
    await streamDemoTeacher(language, emit);
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const systemInstruction = `You are GyanSetu AI Teacher Co-Pilot. Respond in ${LANG_NAME[language]}.
1. Call get_class_stats.
2. Call generate_revision_plan for the weakest topic (15 minutes, 3 steps).
3. Call suggest_peer_groups pairing mastered students with struggling students.`;

    const contents: { role: string; parts: Part[] }[] = [
      { role: "user", parts: [{ text: "Generate Smart Lesson Plan for my class." }] },
    ];

    let classStats = await getClassStats();
    let revisionPlan: TeacherFinalPayload["revisionPlan"] | null = null;
    let peerGroups: TeacherFinalPayload["peerGroups"] = [];

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
      for (const call of calls) {
        const name = call.name ?? "unknown";
        const args = (call.args as Record<string, unknown>) ?? {};
        const { result, summary } = await executeTeacherTool(name, args);
        emit({ type: "trace", step, tool: name, summary });

        if (name === "get_class_stats" && Array.isArray(result)) {
          classStats = result as TeacherFinalPayload["classStats"];
        }
        if (name === "generate_revision_plan") {
          revisionPlan = args as unknown as TeacherFinalPayload["revisionPlan"];
        }
        if (name === "suggest_peer_groups" && Array.isArray(args.groups)) {
          peerGroups = args.groups as TeacherFinalPayload["peerGroups"];
        }

        responseParts.push({ functionResponse: { name, response: { result } } });
      }

      contents.push({ role: "model", parts: calls.map((c) => ({ functionCall: c })) });
      contents.push({ role: "user", parts: responseParts });

      if (revisionPlan && peerGroups.length > 0) break;
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

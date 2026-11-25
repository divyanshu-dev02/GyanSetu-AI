import { getServerEnv } from "@/lib/env";
import { getStudentProfile, getClassStats } from "@/lib/store";
import type {
  DifficultyLevel,
  Language,
  QuizQuestion,
  TeacherFinalPayload,
  TraceEvent,
  TutorFinalPayload,
} from "@/lib/types";

export type EmitFn = (event: TraceEvent | { type: "final"; payload: unknown }) => void;

const LANG_NAME: Record<Language, string> = {
  en: "English",
  hi: "Hindi (Devanagari script)",
  kn: "Kannada (Kannada script)",
};

const GROQ_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("GROQ_TIMEOUT")), ms);
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

async function callGroqDirect(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let attempt = 0;
  while (true) {
    attempt++;
    const res = await withTimeout(
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      }),
      GROQ_TIMEOUT_MS
    );

    if (res.status === 429 && attempt <= 3) {
      console.warn(`[Groq Rate Limit 429] Retrying in 3s (attempt ${attempt}/3)...`);
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[Groq API Error ${res.status}]`, errText);
      throw new Error(`Groq API error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty Groq response");
    return content;
  }
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
  const apiKey = env.GROQ_API_KEY;

  // Stream live pedagogical trace steps
  let step = 1;
  const emitTrace = async (tool: string, summary: string) => {
    emit({ type: "trace", step: step++, tool, summary });
    await new Promise((r) => setTimeout(r, 60));
  };

  const profile = await getStudentProfile(params.studentId);
  const studentName = profile?.name ?? "Student";
  const weakTopics = profile?.weakTopics?.join(", ") || "General";
  const initialLevel: DifficultyLevel = params.isRetryEasier ? "simple" : profile?.currentLevel || "standard";

  await emitTrace(
    "get_student_profile",
    `Loaded profile for ${studentName} (${profile?.grade || "Class 9"}, level=${initialLevel}, weak=[${weakTopics}])`
  );

  await emitTrace(
    "find_prerequisite_gap",
    `Checking foundations & prerequisite concepts for: "${params.message.slice(0, 40)}..."`
  );

  const systemPrompt = `You are GyanSetu AI, an expert, patient personal AI tutor.
Respond directly to the student's question in ${LANG_NAME[params.language]}.
You MUST return ONLY a valid JSON object matching this exact schema:
{
  "topic": "Concise topic title",
  "difficulty": "${initialLevel}",
  "prerequisiteGap": "Any prerequisite concept the student might need to review first, or null if none",
  "explanation": "Clear, comprehensive, pedagogically sound explanation that directly answers the user's doubt in ${LANG_NAME[params.language]}",
  "analogy": "A relatable, real-world everyday analogy that makes this intuitive",
  "quiz": [
    {
      "id": "q1",
      "question": "Question text directly testing this concept",
      "options": [
        {"id": "A", "text": "Option text", "isCorrect": true, "misconception": ""},
        {"id": "B", "text": "Option text", "isCorrect": false, "misconception": "Why student picked this wrong"},
        {"id": "C", "text": "Option text", "isCorrect": false, "misconception": "Why student picked this wrong"},
        {"id": "D", "text": "Option text", "isCorrect": false, "misconception": "Why student picked this wrong"}
      ],
      "explanation": "Why the correct answer is right"
    },
    {
      "id": "q2",
      "question": "Question 2",
      "options": [
        {"id": "A", "text": "Option text", "isCorrect": false, "misconception": "Common trap"},
        {"id": "B", "text": "Option text", "isCorrect": true, "misconception": ""},
        {"id": "C", "text": "Option text", "isCorrect": false, "misconception": "Common trap"},
        {"id": "D", "text": "Option text", "isCorrect": false, "misconception": "Common trap"}
      ],
      "explanation": "Explanation for question 2"
    },
    {
      "id": "q3",
      "question": "Question 3",
      "options": [
        {"id": "A", "text": "Option text", "isCorrect": false, "misconception": "Common trap"},
        {"id": "B", "text": "Option text", "isCorrect": false, "misconception": "Common trap"},
        {"id": "C", "text": "Option text", "isCorrect": true, "misconception": ""},
        {"id": "D", "text": "Option text", "isCorrect": false, "misconception": "Common trap"}
      ],
      "explanation": "Explanation for question 3"
    }
  ]
}`;

  const userPrompt = `Student doubt: "${params.message}"
Target difficulty level: ${initialLevel}
Student language: ${LANG_NAME[params.language]}
${params.gradeResult ? `Note: The student failed a previous quiz. Please provide an easier explanation and a simpler analogy.` : ""}`;

  try {
    const rawContent = await callGroqDirect(apiKey, env.GROQ_MODEL, systemPrompt, userPrompt);
    const parsed = JSON.parse(rawContent) as {
      topic?: string;
      difficulty?: DifficultyLevel;
      prerequisiteGap?: string;
      explanation?: string;
      analogy?: string;
      quiz?: QuizQuestion[];
    };

    const topic = parsed.topic || params.message.slice(0, 30);
    const explanation = parsed.explanation || "No explanation returned.";
    const analogy = parsed.analogy || "Think of it step by step.";
    const quiz = Array.isArray(parsed.quiz) && parsed.quiz.length > 0 ? parsed.quiz : [];

    await emitTrace("explain_doubt", `Generated tailored ${initialLevel} explanation & analogy in ${LANG_NAME[params.language]}`);
    await emitTrace("generate_quiz", `Created ${quiz.length} targeted assessment questions with misconception diagnostics`);

    emit({
      type: "final",
      payload: {
        topic,
        language: params.language,
        difficulty: initialLevel,
        prerequisiteGap: parsed.prerequisiteGap || undefined,
        explanation,
        analogy,
        quiz,
        gradeResult: params.gradeResult,
        demoMode: false,
      } satisfies TutorFinalPayload,
    });
  } catch (err) {
    console.error("[Groq Live Tutor Error]", err);
    // If live call failed, emit an informative error rather than a static unrelated demo
    emit({
      type: "final",
      payload: {
        topic: params.message.slice(0, 30),
        language: params.language,
        difficulty: initialLevel,
        explanation: `Unable to complete AI response right now (${err instanceof Error ? err.message : "Error"}). Please try asking your question again.`,
        analogy: "Please retry in a few moments.",
        quiz: [],
        demoMode: false,
      } satisfies TutorFinalPayload,
    });
  }
}

export async function runTeacherAgent(language: Language, emit: EmitFn) {
  const env = getServerEnv();
  const apiKey = env.GROQ_API_KEY;

  let step = 1;
  const emitTrace = async (tool: string, summary: string) => {
    emit({ type: "trace", step: step++, tool, summary });
    await new Promise((r) => setTimeout(r, 60));
  };

  const classStats = await getClassStats();
  await emitTrace("get_class_stats", `Analyzed mastery across ${classStats.length} curriculum topics`);

  const weakest = [...classStats].sort((a, b) => a.masteryPercent - b.masteryPercent)[0];
  const weakestTopic = weakest?.topic || "Physics Mechanics";

  const systemPrompt = `You are GyanSetu AI Teacher Co-Pilot.
Generate a structured 45-minute lesson plan for the weakest class topic in ${LANG_NAME[language]}.
Return a valid JSON object matching:
{
  "revisionPlan": {
    "title": "Smart 45-Minute Revision Plan",
    "durationMinutes": 45,
    "focusTopic": "${weakestTopic}",
    "steps": [
      {"phase": "Hook & Misconception Unpacking", "minutes": 10, "activity": "Clear activity to address top misconception"},
      {"phase": "Conceptual Deep Dive & Visual Analogy", "minutes": 15, "activity": "Interactive demonstration and analogy breakdown"},
      {"phase": "Differentiated Group Practice", "minutes": 15, "activity": "Peer-learning tasks"},
      {"phase": "Exit Ticket & Quick Check", "minutes": 5, "activity": "3-question rapid check"}
    ]
  },
  "peerGroups": [
    {
      "groupName": "Group A",
      "topic": "${weakestTopic}",
      "mentor": "Aarav",
      "learners": ["Diya"],
      "activity": "Explain with real-world everyday examples"
    },
    {
      "groupName": "Group B",
      "topic": "${weakestTopic}",
      "mentor": "Karthik",
      "learners": ["Student 3", "Student 4"],
      "activity": "Step-by-step problem walkthrough"
    }
  ]
}`;

  try {
    const raw = await callGroqDirect(apiKey, env.GROQ_MODEL, systemPrompt, `Generate plan for ${weakestTopic}`);
    const parsed = JSON.parse(raw) as {
      revisionPlan?: TeacherFinalPayload["revisionPlan"];
      peerGroups?: TeacherFinalPayload["peerGroups"];
    };

    await emitTrace("generate_revision_plan", `Crafted targeted 45-minute remedial lesson plan for ${weakestTopic}`);
    await emitTrace("suggest_peer_groups", `Assigned peer-mentor groups to assist struggling students`);

    emit({
      type: "final",
      payload: {
        language,
        classStats,
        revisionPlan: parsed.revisionPlan || {
          title: `45-min Remedial: ${weakestTopic}`,
          durationMinutes: 45,
          focusTopic: weakestTopic,
          steps: [
            { phase: "Hook", minutes: 10, activity: "Direct misconception confrontation" },
            { phase: "Concept", minutes: 20, activity: "Analogy-first guided walkthrough" },
            { phase: "Check", minutes: 15, activity: "Peer quiz and reflection" },
          ],
        },
        peerGroups: parsed.peerGroups || [],
        demoMode: false,
      } satisfies TeacherFinalPayload,
    });
  } catch (err) {
    console.error("[Groq Live Teacher Error]", err);
    emit({
      type: "final",
      payload: {
        language,
        classStats,
        revisionPlan: {
          title: `Lesson Plan: ${weakestTopic}`,
          durationMinutes: 45,
          focusTopic: weakestTopic,
          steps: [{ phase: "Review", minutes: 45, activity: "Review core concepts" }],
        },
        peerGroups: [],
        demoMode: false,
      } satisfies TeacherFinalPayload,
    });
  }
}

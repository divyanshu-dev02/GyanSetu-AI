import { Type, type FunctionDeclaration } from "@google/genai";
import curriculum from "@/data/curriculum.json";
import { flagClassWeakness, getClassStats, getStudentProfile, saveStudentProfile } from "@/lib/store";
import type { DifficultyLevel, QuizQuestion } from "@/lib/types";

export const studentToolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_student_profile",
    description: "Fetch the student's profile, current difficulty level, mastered topics, and weak topics.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentId: { type: Type.STRING, description: "Student ID e.g. stu-aarav" },
      },
      required: ["studentId"],
    },
  },
  {
    name: "find_prerequisite_gap",
    description: "Check the curriculum knowledge graph for prerequisite concepts the student might be missing for a topic.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: "The topic the student is asking about" },
      },
      required: ["topic"],
    },
  },
  {
    name: "explain_doubt",
    description: "Record the structured explanation and analogy at the chosen difficulty level (simple, standard, or advanced).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        level: { type: Type.STRING, description: "simple | standard | advanced" },
        explanation: { type: Type.STRING },
        analogy: { type: Type.STRING },
      },
      required: ["topic", "level", "explanation", "analogy"],
    },
  },
  {
    name: "generate_quiz",
    description: "Generate 3 multiple-choice questions where each wrong option targets a specific misconception.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        difficulty: { type: Type.STRING, description: "simple | standard | advanced" },
        questions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              explanation: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    misconception: { type: Type.STRING },
                  },
                  required: ["id", "text", "isCorrect"],
                },
              },
            },
            required: ["id", "question", "options", "explanation"],
          },
        },
      },
      required: ["topic", "difficulty", "questions"],
    },
  },
  {
    name: "grade_answers",
    description: "Grade the student's 3 quiz answers. Pass threshold is 2 of 3. On fail, recommend retry_easier; on pass, recommend level_up.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        total: { type: Type.NUMBER },
        misconceptionsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["score", "total", "misconceptionsFound"],
    },
  },
  {
    name: "update_progress",
    description: "Update the student's mastery, difficulty level, and recent score in runtime store.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentId: { type: Type.STRING },
        topic: { type: Type.STRING },
        passed: { type: Type.BOOLEAN },
        score: { type: Type.NUMBER },
        total: { type: Type.NUMBER },
      },
      required: ["studentId", "topic", "passed", "score", "total"],
    },
  },
  {
    name: "flag_class_weakness",
    description: "Flag a topic and misconception on the teacher's class weakness dashboard.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        misconception: { type: Type.STRING },
      },
      required: ["topic", "misconception"],
    },
  },
];

export const teacherToolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_class_stats",
    description: "Fetch current class-wide mastery percentages, struggling student counts, and top misconceptions.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "generate_revision_plan",
    description: "Generate a focused 15-minute classroom revision plan targeting the weakest topic.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        durationMinutes: { type: Type.NUMBER },
        focusTopic: { type: Type.STRING },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              minutes: { type: Type.NUMBER },
              activity: { type: Type.STRING },
            },
            required: ["phase", "minutes", "activity"],
          },
        },
      },
      required: ["title", "durationMinutes", "focusTopic", "steps"],
    },
  },
  {
    name: "suggest_peer_groups",
    description: "Suggest peer-learning groups pairing students who mastered a topic with those who need help.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        groups: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              groupName: { type: Type.STRING },
              topic: { type: Type.STRING },
              mentor: { type: Type.STRING },
              learners: { type: Type.ARRAY, items: { type: Type.STRING } },
              activity: { type: Type.STRING },
            },
            required: ["groupName", "topic", "mentor", "learners", "activity"],
          },
        },
      },
      required: ["groups"],
    },
  },
];

export async function executeStudentTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ result: unknown; summary: string }> {
  switch (name) {
    case "get_student_profile": {
      const profile = await getStudentProfile(String(args.studentId || "stu-aarav"));
      return {
        result: profile,
        summary: `Loaded profile for ${profile.name} (${profile.currentLevel} level)`,
      };
    }
    case "find_prerequisite_gap": {
      const topic = String(args.topic || "Newton's Third Law");
      const map = curriculum as Record<string, { prerequisites: string[]; keyConcept: string }>;
      const matchKey = Object.keys(map).find((k) => topic.toLowerCase().includes(k.toLowerCase().split(" ")[0])) ?? "Newton's Third Law";
      const entry = map[matchKey];
      return {
        result: { topic: matchKey, ...entry },
        summary: `Checked prerequisites: ${entry.prerequisites.join(", ")}`,
      };
    }
    case "explain_doubt": {
      const level = (String(args.level || "standard") as DifficultyLevel);
      return {
        result: { ok: true, level, topic: args.topic },
        summary: `Prepared ${level} explanation with analogy`,
      };
    }
    case "generate_quiz": {
      const questions = (args.questions as QuizQuestion[]) ?? [];
      return {
        result: { ok: true, count: questions.length },
        summary: `Generated ${questions.length || 3} misconception-targeted MCQs`,
      };
    }
    case "grade_answers": {
      const score = Number(args.score ?? 0);
      const total = Number(args.total ?? 3);
      const passed = score >= 2;
      return {
        result: { score, total, passed, nextAction: passed ? "level_up" : "retry_easier" },
        summary: `Graded quiz: ${score}/${total} (${passed ? "Passed — raising difficulty" : "Needs retry — switching analogy"})`,
      };
    }
    case "update_progress": {
      const studentId = String(args.studentId || "stu-aarav");
      const topic = String(args.topic || "Newton's Third Law");
      const passed = Boolean(args.passed);
      const score = Number(args.score ?? 0);
      const total = Number(args.total ?? 3);
      const profile = await getStudentProfile(studentId);
      profile.recentScores.unshift({ topic, score, total, timestamp: new Date().toISOString() });
      if (passed) {
        if (!profile.masteredTopics.includes(topic)) profile.masteredTopics.push(topic);
        profile.weakTopics = profile.weakTopics.filter((t) => t !== topic);
        profile.currentLevel = profile.currentLevel === "simple" ? "standard" : "advanced";
        profile.streak += 1;
      } else {
        if (!profile.weakTopics.includes(topic)) profile.weakTopics.push(topic);
        profile.currentLevel = "simple";
      }
      await saveStudentProfile(profile);
      return {
        result: profile,
        summary: `Updated ${profile.name}'s level to ${profile.currentLevel}`,
      };
    }
    case "flag_class_weakness": {
      const topic = String(args.topic || "Newton's Third Law");
      const misconception = String(args.misconception || "Conceptual gap");
      await flagClassWeakness(topic, misconception);
      return {
        result: { flagged: true, topic, misconception },
        summary: `Flagged "${topic}" misconception for teacher`,
      };
    }
    default:
      return { result: { error: `Unknown tool ${name}` }, summary: `Skipped unknown tool ${name}` };
  }
}

export async function executeTeacherTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ result: unknown; summary: string }> {
  switch (name) {
    case "get_class_stats": {
      const stats = await getClassStats();
      return {
        result: stats,
        summary: `Loaded mastery stats across ${stats.length} topics`,
      };
    }
    case "generate_revision_plan": {
      return {
        result: args,
        summary: `Built ${args.durationMinutes ?? 15}-min revision plan for ${args.focusTopic ?? "weakest topic"}`,
      };
    }
    case "suggest_peer_groups": {
      const groups = (args.groups as unknown[]) ?? [];
      return {
        result: groups,
        summary: `Formed ${groups.length} peer-learning groups`,
      };
    }
    default:
      return { result: { error: `Unknown tool ${name}` }, summary: `Skipped unknown tool ${name}` };
  }
}

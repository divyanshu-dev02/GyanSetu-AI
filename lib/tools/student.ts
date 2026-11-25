// Local type replacement — no longer importing from @google/genai
type FunctionDeclaration = Record<string, unknown>;
const Type = {
  OBJECT: "object",
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  ARRAY: "array",
} as const;
import curriculum from "@/data/curriculum.json";
import {
  ExplainDoubtInputSchema,
  FindPrerequisiteGapInputSchema,
  FlagClassWeaknessInputSchema,
  GenerateQuizInputSchema,
  GetStudentProfileInputSchema,
  GradeAnswersInputSchema,
  UpdateProgressInputSchema,
} from "@/lib/schemas";
import { flagClassWeakness, getStudentProfile, saveStudentProfile } from "@/lib/store";
import type { DifficultyLevel, QuizQuestion } from "@/lib/types";

export const studentToolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_student_profile",
    description:
      "Check student history first: fetch profile, current difficulty level, mastered topics, weak topics, and recent scores.",
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
    description:
      "Inspect curriculum prerequisites for a topic to detect missing foundational concepts before explaining.",
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
    description:
      "Deliver a tailored explanation and analogy at the chosen level (simple, standard, or advanced). On retry after fail, use a DIFFERENT analogy and level='simple'.",
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
    description:
      "Generate exactly 3 MCQs where each wrong option targets a specific named misconception.",
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
    description:
      "Grade the student's 3 quiz answers. Pass threshold is 2 of 3. On fail: nextAction='retry_easier'; on pass: nextAction='level_up'.",
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
    description: "Persist the student's updated mastery, difficulty level, and score in the runtime store.",
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
    description: "Flag a diagnosed topic misconception on the teacher's class weakness radar.",
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

export async function executeStudentTool(
  name: string,
  rawArgs: unknown
): Promise<{ result: unknown; summary: string }> {
  switch (name) {
    case "get_student_profile": {
      const args = GetStudentProfileInputSchema.parse(rawArgs);
      const profile = await getStudentProfile(args.studentId);
      return {
        result: profile,
        summary: `Loaded history for ${profile.name} (level=${profile.currentLevel}, weak=${profile.weakTopics.join(", ") || "none"})`,
      };
    }
    case "find_prerequisite_gap": {
      const args = FindPrerequisiteGapInputSchema.parse(rawArgs);
      const map = curriculum as Record<string, { prerequisites: string[]; keyConcept: string }>;
      const matchKey =
        Object.keys(map).find((k) =>
          args.topic.toLowerCase().includes(k.toLowerCase().split(" ")[0])
        ) ?? "Newton's Third Law";
      const entry = map[matchKey];
      return {
        result: { topic: matchKey, ...entry },
        summary: `Prerequisite check for ${matchKey}: ${entry.prerequisites.join(", ")}`,
      };
    }
    case "explain_doubt": {
      const args = ExplainDoubtInputSchema.parse(rawArgs);
      const level: DifficultyLevel = args.level;
      return {
        result: { ok: true, level, topic: args.topic },
        summary: `Generated ${level} explanation with tailored analogy`,
      };
    }
    case "generate_quiz": {
      const args = GenerateQuizInputSchema.parse(rawArgs);
      const questions: QuizQuestion[] = args.questions;
      return {
        result: { ok: true, count: questions.length, difficulty: args.difficulty },
        summary: `Generated ${questions.length} ${args.difficulty} MCQs targeting misconceptions`,
      };
    }
    case "grade_answers": {
      const args = GradeAnswersInputSchema.parse(rawArgs);
      const passed = args.score >= 2;
      return {
        result: {
          score: args.score,
          total: args.total,
          passed,
          misconceptionsFound: args.misconceptionsFound,
          nextAction: passed ? "level_up" : "retry_easier",
        },
        summary: `Graded ${args.score}/${args.total} (${passed ? "PASS -> level_up" : "FAIL -> retry_easier with new analogy"})`,
      };
    }
    case "update_progress": {
      const args = UpdateProgressInputSchema.parse(rawArgs);
      const profile = await getStudentProfile(args.studentId);
      profile.recentScores.unshift({
        topic: args.topic,
        score: args.score,
        total: args.total,
        timestamp: new Date().toISOString(),
      });
      if (args.passed) {
        if (!profile.masteredTopics.includes(args.topic)) profile.masteredTopics.push(args.topic);
        profile.weakTopics = profile.weakTopics.filter((t) => t !== args.topic);
        profile.currentLevel = profile.currentLevel === "simple" ? "standard" : "advanced";
        profile.streak += 1;
      } else {
        if (!profile.weakTopics.includes(args.topic)) profile.weakTopics.push(args.topic);
        profile.currentLevel = "simple";
      }
      await saveStudentProfile(profile);
      return {
        result: profile,
        summary: `Updated ${profile.name}'s level to ${profile.currentLevel}`,
      };
    }
    case "flag_class_weakness": {
      const args = FlagClassWeaknessInputSchema.parse(rawArgs);
      await flagClassWeakness(args.topic, args.misconception);
      return {
        result: { flagged: true, topic: args.topic, misconception: args.misconception },
        summary: `Flagged "${args.topic}" misconception: ${args.misconception}`,
      };
    }
    default:
      throw new Error(`Unknown student tool: ${name}`);
  }
}

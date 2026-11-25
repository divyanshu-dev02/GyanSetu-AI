import { Type, type FunctionDeclaration } from "@google/genai";
import {
  FlagClassWeaknessInputSchema,
  GenerateRevisionPlanInputSchema,
  SuggestPeerGroupsInputSchema,
} from "@/lib/schemas";
import { flagClassWeakness, getClassStats } from "@/lib/store";
import type { ClassTopicStat, TeacherFinalPayload } from "@/lib/types";

// ─── Declarations ─────────────────────────────────────────────────────────────

export const teacherToolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_class_stats",
    description:
      "Fetch current class-wide mastery percentages, struggling student counts, and top misconceptions per topic. Always call this first.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "flag_class_weakness",
    description: "Flag a diagnosed topic misconception on the class weakness dashboard (can be called by the student agent too).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        misconception: { type: Type.STRING },
      },
      required: ["topic", "misconception"],
    },
  },
  {
    name: "generate_revision_plan",
    description:
      "Generate a focused 45-minute classroom revision plan targeting the weakest topic (masteryPercent < 60). Include 4–6 steps with phase name, duration in minutes, and a clear activity description.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Plan title including topic" },
        durationMinutes: { type: Type.NUMBER, description: "Total duration, e.g. 45" },
        focusTopic: { type: Type.STRING },
        topMisconception: { type: Type.STRING, description: "The class-wide misconception being addressed" },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING, description: "Phase name e.g. 'Misconception Bust'" },
              minutes: { type: Type.NUMBER },
              activity: { type: Type.STRING, description: "Specific activity with teacher instructions" },
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
    description:
      "Suggest peer-learning groups: pair students who have mastered a topic (mentors) with those who are struggling (learners). Include activity description.",
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

// ─── Executor ─────────────────────────────────────────────────────────────────

export async function executeTeacherTool(
  name: string,
  rawArgs: unknown
): Promise<{ result: unknown; summary: string }> {
  switch (name) {
    case "get_class_stats": {
      const stats = await getClassStats();
      const weakest = [...stats].sort((a, b) => a.masteryPercent - b.masteryPercent)[0];
      return {
        result: stats,
        summary: `Loaded mastery across ${stats.length} topics. Weakest: ${weakest?.topic ?? "—"} at ${weakest?.masteryPercent ?? 0}%`,
      };
    }

    case "flag_class_weakness": {
      const args = FlagClassWeaknessInputSchema.parse(rawArgs);
      await flagClassWeakness(args.topic, args.misconception);
      return {
        result: { flagged: true, topic: args.topic, misconception: args.misconception },
        summary: `Flagged "${args.topic}" — misconception: ${args.misconception}`,
      };
    }

    case "generate_revision_plan": {
      const args = GenerateRevisionPlanInputSchema.parse(rawArgs);
      return {
        result: args,
        summary: `Built ${args.durationMinutes}-min revision plan for "${args.focusTopic}" (${args.steps.length} steps)`,
      };
    }

    case "suggest_peer_groups": {
      const args = SuggestPeerGroupsInputSchema.parse(rawArgs);
      return {
        result: args.groups,
        summary: `Suggested ${args.groups.length} peer-learning groups`,
      };
    }

    default:
      throw new Error(`Unknown teacher tool: ${name}`);
  }
}

// ─── Reset helper ─────────────────────────────────────────────────────────────

export async function resetDemoClassStats(): Promise<ClassTopicStat[]> {
  const seed: ClassTopicStat[] = [
    { topic: "Newton's Third Law", masteryPercent: 42, strugglingCount: 18, totalStudents: 32, topMisconception: "Thinks action and reaction forces cancel out on the same object" },
    { topic: "Quadratic Equations", masteryPercent: 55, strugglingCount: 14, totalStudents: 32, topMisconception: "Forgets the ± sign or drops the middle term when squaring" },
    { topic: "Photosynthesis", masteryPercent: 68, strugglingCount: 10, totalStudents: 32, topMisconception: "Confuses respiration with photosynthesis at night" },
    { topic: "Ohm's Law & Circuits", masteryPercent: 51, strugglingCount: 16, totalStudents: 32, topMisconception: "Confuses series and parallel current/voltage rules" },
    { topic: "Trigonometry Basics", masteryPercent: 60, strugglingCount: 13, totalStudents: 32, topMisconception: "Swaps opposite and adjacent sides when reference angle changes" },
    { topic: "Chemical Reactions & Balancing", masteryPercent: 64, strugglingCount: 11, totalStudents: 32, topMisconception: "Changes subscripts instead of coefficients when balancing" },
    { topic: "Cell Division (Mitosis)", masteryPercent: 74, strugglingCount: 8, totalStudents: 32, topMisconception: "Mixes up chromosome count in mitosis vs meiosis" },
    { topic: "Linear Equations", masteryPercent: 84, strugglingCount: 5, totalStudents: 32, topMisconception: "Sign flip error when transposing across equals sign" },
  ];
  // Write back to in-memory store by flagging each
  for (const item of seed) {
    await flagClassWeakness(item.topic, item.topMisconception);
  }
  return seed;
}

// ─── Re-export TeacherFinalPayload helpers ────────────────────────────────────
export type { ClassTopicStat, TeacherFinalPayload };

import { z } from "zod";

export const LanguageSchema = z.enum(["en", "hi", "kn"]);
export const DifficultyLevelSchema = z.enum(["simple", "standard", "advanced"]);

// Student Tool Schemas
export const GetStudentProfileInputSchema = z.object({
  studentId: z.string().min(1),
});

export const FindPrerequisiteGapInputSchema = z.object({
  topic: z.string().min(1),
});

export const ExplainDoubtInputSchema = z.object({
  topic: z.string().min(1),
  level: DifficultyLevelSchema,
  explanation: z.string().min(1),
  analogy: z.string().min(1),
});

export const QuizOptionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  misconception: z.string().optional(),
});

export const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(QuizOptionSchema).length(4),
  explanation: z.string().min(1),
});

export const GenerateQuizInputSchema = z.object({
  topic: z.string().min(1),
  difficulty: DifficultyLevelSchema,
  questions: z.array(QuizQuestionSchema).length(3),
});

export const GradeAnswersInputSchema = z.object({
  score: z.number().int().min(0).max(3),
  total: z.number().int().default(3),
  misconceptionsFound: z.array(z.string()),
});

export const UpdateProgressInputSchema = z.object({
  studentId: z.string().min(1),
  topic: z.string().min(1),
  passed: z.boolean(),
  score: z.number().int().min(0).max(3),
  total: z.number().int().default(3),
});

export const FlagClassWeaknessInputSchema = z.object({
  topic: z.string().min(1),
  misconception: z.string().min(1),
});

// Teacher Tool Schemas
export const GetClassStatsInputSchema = z.object({});

export const RevisionStepSchema = z.object({
  phase: z.string().min(1),
  minutes: z.number().int().positive(),
  activity: z.string().min(1),
});

export const GenerateRevisionPlanInputSchema = z.object({
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  focusTopic: z.string().min(1),
  steps: z.array(RevisionStepSchema).min(1),
});

export const PeerGroupSchema = z.object({
  groupName: z.string().min(1),
  topic: z.string().min(1),
  mentor: z.string().min(1),
  learners: z.array(z.string()).min(1),
  activity: z.string().min(1),
});

export const SuggestPeerGroupsInputSchema = z.object({
  groups: z.array(PeerGroupSchema).min(1),
});

// SSE & API Schemas
export const TraceEventSchema = z.object({
  type: z.literal("trace"),
  step: z.number().int().positive(),
  tool: z.string().min(1),
  summary: z.string().min(1),
});

// Inferred Types
export type GetStudentProfileInput = z.infer<typeof GetStudentProfileInputSchema>;
export type FindPrerequisiteGapInput = z.infer<typeof FindPrerequisiteGapInputSchema>;
export type ExplainDoubtInput = z.infer<typeof ExplainDoubtInputSchema>;
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;
export type GradeAnswersInput = z.infer<typeof GradeAnswersInputSchema>;
export type UpdateProgressInput = z.infer<typeof UpdateProgressInputSchema>;
export type FlagClassWeaknessInput = z.infer<typeof FlagClassWeaknessInputSchema>;
export type GenerateRevisionPlanInput = z.infer<typeof GenerateRevisionPlanInputSchema>;
export type SuggestPeerGroupsInput = z.infer<typeof SuggestPeerGroupsInputSchema>;

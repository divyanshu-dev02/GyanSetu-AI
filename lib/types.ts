export type Language = "en" | "hi" | "kn";

export type DifficultyLevel = "simple" | "standard" | "advanced";

export interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  preferredLanguage: Language;
  currentLevel: DifficultyLevel;
  masteredTopics: string[];
  weakTopics: string[];
  recentScores: { topic: string; score: number; total: number; timestamp: string }[];
  streak: number;
}

export interface QuizOption {
  id: "A" | "B" | "C" | "D";
  text: string;
  isCorrect: boolean;
  misconception?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
}

export interface TraceEvent {
  type: "trace";
  step: number;
  tool: string;
  summary: string;
}

export interface TutorFinalPayload {
  topic: string;
  language: Language;
  difficulty: DifficultyLevel;
  prerequisiteGap?: string;
  explanation: string;
  analogy: string;
  quiz: QuizQuestion[];
  gradeResult?: {
    score: number;
    total: number;
    passed: boolean;
    misconceptionsFound: string[];
    nextAction: "retry_easier" | "level_up";
  };
  flaggedWeakness?: string;
  demoMode: boolean;
}

export interface TeacherFinalPayload {
  language: Language;
  classStats: ClassTopicStat[];
  revisionPlan: {
    title: string;
    durationMinutes: number;
    focusTopic: string;
    steps: { phase: string; minutes: number; activity: string }[];
  };
  peerGroups: {
    groupName: string;
    topic: string;
    mentor: string;
    learners: string[];
    activity: string;
  }[];
  demoMode: boolean;
}

export interface ClassTopicStat {
  topic: string;
  masteryPercent: number;
  strugglingCount: number;
  totalStudents: number;
  topMisconception: string;
}

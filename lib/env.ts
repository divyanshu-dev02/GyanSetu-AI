import { z } from "zod";

const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_MODEL: z.string().min(1).default("qwen/qwen3.8-27b"),
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse({
    GROQ_API_KEY: process.env.GROQ_API_KEY || undefined,
    GROQ_MODEL: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
    DEMO_MODE: process.env.DEMO_MODE === "true" ? "true" : "false",
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  });

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten());
    cachedEnv = {
      GROQ_API_KEY: undefined,
      GROQ_MODEL: "qwen/qwen3.8-27b",
      DEMO_MODE: true,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
    };
    return cachedEnv;
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

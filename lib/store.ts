import { Redis } from "@upstash/redis";
import studentsSeed from "@/data/students.json";
import classStatsSeed from "@/data/class-stats.json";
import { getServerEnv } from "./env";
import type { ClassTopicStat, StudentProfile } from "./types";

const memoryStudents = new Map<string, StudentProfile>(
  (studentsSeed as StudentProfile[]).map((s) => [s.id, { ...s }])
);

const memoryClassStats = new Map<string, ClassTopicStat>(
  (classStatsSeed as ClassTopicStat[]).map((c) => [c.topic, { ...c }])
);

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const env = getServerEnv();
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redisClient;
  }
  return null;
}

export async function getStudentProfile(studentId: string): Promise<StudentProfile> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<StudentProfile>(`student:${studentId}`);
      if (cached) return cached;
    } catch {
      // Fall back to in-memory store
    }
  }
  return memoryStudents.get(studentId) ?? (studentsSeed as StudentProfile[])[0];
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  memoryStudents.set(profile.id, profile);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(`student:${profile.id}`, profile);
    } catch {
      // Ignore Redis write failure in fallback mode
    }
  }
}

export async function getClassStats(): Promise<ClassTopicStat[]> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<ClassTopicStat[]>("class:stats");
      if (cached && cached.length > 0) return cached;
    } catch {
      // Fall back to in-memory store
    }
  }
  return Array.from(memoryClassStats.values());
}

export async function flagClassWeakness(topic: string, misconception: string): Promise<ClassTopicStat[]> {
  const current = await getClassStats();
  const idx = current.findIndex((c) => c.topic.toLowerCase() === topic.toLowerCase());
  if (idx >= 0) {
    const item = { ...current[idx] };
    item.strugglingCount = Math.min(item.totalStudents, item.strugglingCount + 1);
    item.masteryPercent = Math.max(
      10,
      Math.round(((item.totalStudents - item.strugglingCount) / item.totalStudents) * 100)
    );
    if (misconception) {
      item.topMisconception = misconception;
    }
    current[idx] = item;
    memoryClassStats.set(item.topic, item);
  } else {
    const newItem: ClassTopicStat = {
      topic,
      masteryPercent: 50,
      strugglingCount: 1,
      totalStudents: 32,
      topMisconception: misconception || "Conceptual gap detected",
    };
    current.push(newItem);
    memoryClassStats.set(newItem.topic, newItem);
  }

  const redis = getRedis();
  if (redis) {
    try {
      await redis.set("class:stats", current);
    } catch {
      // Ignore Redis write failure
    }
  }
  return current;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const ipBuckets = new Map<string, number[]>();

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const timestamps = (ipBuckets.get(ip) ?? []).filter((ts) => now - ts < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    ipBuckets.set(ip, timestamps);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  timestamps.push(now);
  ipBuckets.set(ip, timestamps);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - timestamps.length,
    retryAfterSeconds: 0,
  };
}

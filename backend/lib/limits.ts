import { Redis } from "@upstash/redis";

// Daily usage limits. These cap how much any one phone, any one network, and
// the whole app can spend on Claude per day (UTC). Change them with env vars.
export const LIMITS = {
  perDevice: Number(process.env.LIMIT_PER_DEVICE_PER_DAY || 5),
  perIp: Number(process.env.LIMIT_PER_IP_PER_DAY || 15),
  global: Number(process.env.LIMIT_GLOBAL_PER_DAY || 200),
};

const DAY_SECONDS = 60 * 60 * 24;

// Vercel's Upstash integration may set either naming scheme.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// Fallback for local development. On a server with several instances this only
// limits each instance separately, so connect Redis before going public.
const memory = new Map<string, { count: number; expires: number }>();

export const limitsAreShared = redis !== null;

async function increment(key: string): Promise<number> {
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, DAY_SECONDS);
    return count;
  }
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.expires < now) {
    memory.set(key, { count: 1, expires: now + DAY_SECONDS * 1000 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export type LimitResult = { ok: true } | { ok: false; reason: "device" | "ip" | "global" };

// Counts this request against all three limits. The request is counted even if
// it is then refused, so retrying in a loop doesn't help anyone get around it.
export async function checkAndCount(deviceId: string, ip: string): Promise<LimitResult> {
  const day = new Date().toISOString().slice(0, 10);
  const [global, perIp, perDevice] = await Promise.all([
    increment(`usage:${day}:global`),
    increment(`usage:${day}:ip:${ip}`),
    increment(`usage:${day}:device:${deviceId}`),
  ]);
  if (global > LIMITS.global) return { ok: false, reason: "global" };
  if (perIp > LIMITS.perIp) return { ok: false, reason: "ip" };
  if (perDevice > LIMITS.perDevice) return { ok: false, reason: "device" };
  return { ok: true };
}

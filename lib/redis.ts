import Redis from "ioredis";

let redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (redis === undefined) {
    const url = process.env.REDIS_URL;
    redis = url ? new Redis(url, { maxRetriesPerRequest: 2 }) : null;
  }
  return redis;
}

export async function canPlaceCallCooldown(
  userId: string,
  asset: string,
  critical: boolean,
): Promise<boolean> {
  const r = getRedis();
  if (!r) return true;
  const key = critical
    ? `volcall:crit:${userId}:${asset}`
    : `volcall:cool:${userId}:${asset}`;
  const ttl = critical ? 3600 : 86_400;
  const set = await r.set(key, "1", "EX", ttl, "NX");
  return set === "OK";
}

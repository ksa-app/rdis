import { redis, TTL } from './redis';

// ─── Generic get-or-fetch helper ────────────────────────────────────────────
// Usage:
//   const data = await cached(CacheKey.candidates(orgId), TTL.MEDIUM, () => supabase.from(...))
export async function cached<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    // 1. Try cache first
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) {
      return hit;
    }
    // 2. Miss → fetch from Supabase
    const fresh = await fetcher();
    // 3. Store in cache (fire-and-forget)
    await redis.setex(key, ttl, JSON.stringify(fresh));
    return fresh;
  } catch {
    // Redis down? Gracefully fall through to DB
    return fetcher();
  }
}

// ─── Invalidate helpers ──────────────────────────────────────────────────────
// Call these after any INSERT / UPDATE / DELETE

// Delete a single cache key
export async function invalidate(key: string) {
  try { await redis.del(key); } catch {}
}

// Delete all keys matching a pattern under an org
// e.g. after editing a candidate → bust all candidates:* keys for that org
export async function invalidatePattern(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {}
}

// Convenience: bust everything for one org (e.g. bulk import)
export async function invalidateOrg(orgId: string) {
  await invalidatePattern(`org:${orgId}:*`);
}

// Convenience: bust candidate-related caches when a candidate is mutated
export async function invalidateCandidate(orgId: string, candidateId?: string) {
  const tasks = [
    invalidatePattern(`org:${orgId}:candidates:*`),
    invalidate(`org:${orgId}:dashboard`),
    invalidate(`org:${orgId}:pipeline`),
  ];
  if (candidateId) {
    tasks.push(invalidate(`org:${orgId}:candidate:${candidateId}`));
  }
  await Promise.all(tasks);
}

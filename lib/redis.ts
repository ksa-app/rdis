import { Redis } from '@upstash/redis';

// Upstash Redis client - Edge & Serverless compatible
// Get credentials from: https://console.upstash.com
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL constants (seconds)
export const TTL = {
  SHORT:  60,          // 1 minute  → dashboard counts
  MEDIUM: 5 * 60,      // 5 minutes → candidates list
  LONG:   30 * 60,     // 30 minutes → agents, agency dropdowns
  DAY:    24 * 60 * 60 // 24 hours  → static reference data
} as const;

// Cache key builders — always include org_id for multi-tenant isolation
export const CacheKey = {
  candidates:     (orgId: string, page = 1, filter = '') =>
    `org:${orgId}:candidates:${page}:${filter}`,
  candidateById:  (orgId: string, id: string) =>
    `org:${orgId}:candidate:${id}`,
  medicals:       (orgId: string, candidateId?: string) =>
    `org:${orgId}:medicals:${candidateId ?? 'all'}`,
  mofas:          (orgId: string, candidateId?: string) =>
    `org:${orgId}:mofas:${candidateId ?? 'all'}`,
  visas:          (orgId: string, candidateId?: string) =>
    `org:${orgId}:visas:${candidateId ?? 'all'}`,
  agents:         (orgId: string) => `org:${orgId}:agents`,
  agencies:       (orgId: string) => `org:${orgId}:agencies`,
  dashboard:      (orgId: string) => `org:${orgId}:dashboard`,
  pipeline:       (orgId: string) => `org:${orgId}:pipeline`,
};

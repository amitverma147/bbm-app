/**
 * apiCache.ts — In-memory request cache with deduplication
 *
 * Prevents duplicate network calls when multiple components request the same
 * URL simultaneously (deduplication) and avoids re-fetching data that was
 * already loaded within a configurable TTL window (caching).
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

// In-memory stores
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<any>>();

/**
 * Fetch with caching and request deduplication.
 * - If cached data exists and is fresh (< TTL), returns it immediately.
 * - If the same URL is already being fetched, piggybacks on that request.
 * - Otherwise, makes a new fetch, caches the result, and returns it.
 */
export async function cachedFetch(
  url: string,
  ttl: number = DEFAULT_TTL,
): Promise<any> {
  // 1. Return cached data if still fresh
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  // 2. Deduplicate: if this URL is already in-flight, return the same promise
  if (inflight.has(url)) {
    return inflight.get(url);
  }

  // 3. Make a new request
  const promise = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Return cached stale data if available, otherwise empty
        return cached?.data ?? null;
      }
      const data = await response.json();
      cache.set(url, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error(`[apiCache] fetch error for ${url}:`, error);
      // Return stale cache on network error (offline resilience)
      return cached?.data ?? null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, promise);
  return promise;
}

/**
 * Get cached data synchronously (no fetch). Returns null if not cached.
 * Useful for showing cached data instantly while a background refresh happens.
 */
export function getCached(url: string): any | null {
  const cached = cache.get(url);
  return cached ? cached.data : null;
}

/**
 * Invalidate a specific cache entry or the entire cache.
 */
export function invalidateCache(url?: string): void {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}

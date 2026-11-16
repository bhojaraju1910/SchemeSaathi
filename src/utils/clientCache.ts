import type { HardcodedScheme } from '../data/schemes';

export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const API_FALLBACK_TIMEOUT_MS = 4000;

export interface CachedEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheReadResult<T> {
  data: T;
  isStale: boolean;
  ageMs: number;
}

let cachedEmergencyCatalog: HardcodedScheme[] | null = null;

export function readSessionCache<T>(
  key: string,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): CacheReadResult<T> | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (!parsed || typeof parsed.timestamp !== 'number' || parsed.data === undefined) {
      return null;
    }
    const ageMs = Math.max(0, Date.now() - parsed.timestamp);
    return {
      data: parsed.data,
      isStale: ageMs > ttlMs,
      ageMs,
    };
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }
  try {
    const payload: CachedEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Dynamically imports the emergency saved copy ONLY when API fails, times out (>4s),
 * or returns an empty unseeded base catalog. Zero bytes in initial bundle.
 */
export async function loadEmergencySchemes(): Promise<HardcodedScheme[]> {
  if (cachedEmergencyCatalog) {
    return cachedEmergencyCatalog;
  }
  const mod = await import('../data/schemes');
  cachedEmergencyCatalog = mod.HARDCODED_SCHEMES;
  return cachedEmergencyCatalog;
}

/**
 * Races an async request function with an AbortSignal against a hard timeout (default 4000ms).
 */
export async function withTimeout<T>(
  requestFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = API_FALLBACK_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timerId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([requestFn(controller.signal), timeoutPromise]);
  } finally {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
}

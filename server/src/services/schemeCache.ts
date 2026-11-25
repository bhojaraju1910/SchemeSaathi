import { CriteriaModel, type IScheme, SchemeModel } from '../models/index.ts';
import type { Rule, SchemeWithRules } from './eligibilityEngine.ts';

const CACHE_TTL_MS = 5 * 1000; // 5 seconds (burst deduplication; reflects direct DB edits promptly)

interface CachedCatalog {
  schemesWithRules: SchemeWithRules[];
  meta: {
    total: number;
    levels: { central: number; state: number };
    categories: Record<string, number>;
  };
  expiresAt: number;
}

let catalogCache: CachedCatalog | null = null;
let inflightLoad: Promise<CachedCatalog> | null = null;

function buildCatalogStats(schemes: IScheme[]) {
  const categories: Record<string, number> = {};
  let central = 0;
  let state = 0;
  for (const s of schemes) {
    if (s.level === 'central') central += 1;
    else state += 1;
    categories[s.category] = (categories[s.category] || 0) + 1;
  }
  return {
    total: schemes.length,
    levels: { central, state },
    categories,
  };
}

/**
 * Loads all active schemes and their eligibility criteria in exactly 2 queries
 * (1 for active schemes, 1 batch $in query for criteria), caching the joined
 * result in server memory for 5 minutes.
 */
async function loadCatalogFromStore(): Promise<CachedCatalog> {
  const activeSchemes = await SchemeModel.findActiveForMatching();
  const schemeIds = activeSchemes.map((s) => s._id);

  const allCriteria = await CriteriaModel.findBySchemeIds(schemeIds);
  const criteriaMap = new Map<string, Rule[]>();
  for (const c of allCriteria) {
    criteriaMap.set(c.schemeId, (c.rules || []) as Rule[]);
  }

  const schemesWithRules: SchemeWithRules[] = activeSchemes.map((scheme) => ({
    scheme,
    rules: criteriaMap.get(scheme._id) || [],
  }));

  const fresh: CachedCatalog = {
    schemesWithRules,
    meta: buildCatalogStats(activeSchemes),
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  catalogCache = fresh;
  return fresh;
}

export async function getCachedActiveSchemesWithRules(): Promise<SchemeWithRules[]> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return catalogCache.schemesWithRules;
  }
  if (!inflightLoad) {
    inflightLoad = loadCatalogFromStore().finally(() => {
      inflightLoad = null;
    });
  }
  const loaded = await inflightLoad;
  return loaded.schemesWithRules;
}

export async function getCachedCatalogMeta(): Promise<CachedCatalog['meta']> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return catalogCache.meta;
  }
  if (!inflightLoad) {
    inflightLoad = loadCatalogFromStore().finally(() => {
      inflightLoad = null;
    });
  }
  const loaded = await inflightLoad;
  return loaded.meta;
}

export function invalidateSchemeCache(): void {
  catalogCache = null;
}

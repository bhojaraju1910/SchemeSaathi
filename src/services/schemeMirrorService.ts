import { HARDCODED_SCHEMES, HardcodedScheme, SchemeRule } from '../data/schemes';

export interface SchemeQueryFilter {
  q?: string;
  category?: string;
  state?: string;
  level?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSchemesResult {
  schemes: HardcodedScheme[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface SchemeDetailsResult {
  scheme: HardcodedScheme;
  criteria: {
    rules: SchemeRule[];
    plainLanguageSummary: string[];
  };
}

export interface UserProfileInput {
  age?: number | null;
  incomeRange?: 'low' | 'lower_middle' | 'middle' | 'high' | string;
  state?: string;
  category?: string[];
  occupation?: string;
  familySize?: number;
}

export interface SchemeMatchResult {
  scheme: HardcodedScheme;
  match: 'High' | 'Medium';
  reasons: string[];
  missing: string[];
}

/**
 * Mirrors backend GET /api/schemes query filtering, search, and pagination
 * against the hardcoded frontend schemes array.
 */
export function queryHardcodedSchemes(
  filter: SchemeQueryFilter = {},
  sourceSchemes: HardcodedScheme[] = HARDCODED_SCHEMES
): PaginatedSchemesResult {
  let list = [...sourceSchemes];

  if (filter.category) {
    list = list.filter((s) => s.category === filter.category);
  }
  if (filter.level && filter.level !== 'All') {
    list = list.filter((s) => s.level === filter.level);
  }
  if (filter.state && filter.state !== 'All') {
    list = list.filter((s) => s.state === filter.state || s.state === 'All');
  }
  if (filter.q) {
    const q = String(filter.q).toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.translations?.kn?.title && s.translations.kn.title.toLowerCase().includes(q)) ||
          (s.translations?.hi?.title && s.translations.hi.title.toLowerCase().includes(q))
      );
    }
  }

  const pageNum = Math.max(1, Number(filter.page) || 1);
  const limitNum = Math.max(1, Math.min(50, Number(filter.limit) || 12));
  const total = list.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedSchemes = list.slice(startIndex, startIndex + limitNum);

  return {
    schemes: paginatedSchemes,
    total,
    page: pageNum,
    totalPages,
    limit: limitNum,
  };
}

/**
 * Mirrors backend GET /api/schemes/:id lookup against hardcoded frontend schemes.
 */
export function getHardcodedSchemeById(
  id: string,
  sourceSchemes: HardcodedScheme[] = HARDCODED_SCHEMES
): SchemeDetailsResult | null {
  const scheme = sourceSchemes.find((s) => s._id === id || s.id === id);
  if (!scheme) return null;

  const rules = scheme.rules || [];
  return {
    scheme,
    criteria: {
      rules,
      plainLanguageSummary: rules.map((r) => r.label || `${r.field} ${r.op} ${String(r.value)}`),
    },
  };
}

/**
 * Mirrors server/src/services/eligibilityEngine.ts evaluateRule on the frontend.
 */
export function evaluateRule(
  rule: SchemeRule,
  profile?: UserProfileInput | null
): boolean | 'unknown' {
  if (!profile || typeof profile !== 'object') {
    return 'unknown';
  }

  const profileVal = (profile as Record<string, unknown>)[rule.field];

  if (
    profileVal === undefined ||
    profileVal === null ||
    profileVal === '' ||
    (Array.isArray(profileVal) && profileVal.length === 0)
  ) {
    return 'unknown';
  }

  const op = rule.op;
  const target = rule.value;

  switch (op) {
    case 'gte':
      if (typeof profileVal !== 'number') return 'unknown';
      return profileVal >= Number(target);

    case 'lte':
      if (typeof profileVal !== 'number') return 'unknown';
      return profileVal <= Number(target);

    case 'eq':
      if (typeof profileVal === 'string' && typeof target === 'string') {
        return profileVal.trim().toLowerCase() === target.trim().toLowerCase();
      }
      return profileVal === target;

    case 'in': {
      if (!Array.isArray(target)) {
        return false;
      }
      if (typeof profileVal === 'string') {
        const lowerVal = profileVal.trim().toLowerCase();
        return target.some((t: unknown) =>
          typeof t === 'string' ? t.trim().toLowerCase() === lowerVal : t === profileVal
        );
      }
      return target.includes(profileVal);
    }

    case 'includesAny': {
      const profileArr = Array.isArray(profileVal) ? profileVal : [profileVal];
      const targetArr = Array.isArray(target) ? target : [target];

      const profileSet = new Set(
        profileArr.map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
      );

      return targetArr.some((t: unknown) => {
        const needle = typeof t === 'string' ? t.trim().toLowerCase() : t;
        return profileSet.has(needle);
      });
    }

    default:
      return false;
  }
}

/**
 * Mirrors backend POST /api/match eligibility matching against hardcoded frontend schemes.
 */
export function matchHardcodedSchemes(
  profile: UserProfileInput | null | undefined,
  sourceSchemes: HardcodedScheme[] = HARDCODED_SCHEMES
): SchemeMatchResult[] {
  const results: SchemeMatchResult[] = [];

  for (const scheme of sourceSchemes) {
    const rules = scheme.rules || [];
    let isExcluded = false;
    let hasUnknown = false;
    const reasons: string[] = [];
    const missing: string[] = [];

    for (const rule of rules) {
      const isRequired = rule.required !== false;
      const evalResult = evaluateRule(rule, profile);

      if (evalResult === true) {
        if (rule.label) {
          reasons.push(rule.label);
        }
      } else if (evalResult === false) {
        if (isRequired) {
          isExcluded = true;
          break;
        }
      } else if (evalResult === 'unknown') {
        hasUnknown = true;
        if (rule.label) {
          missing.push(rule.label);
        }
      }
    }

    if (isExcluded) {
      continue;
    }

    const match: 'High' | 'Medium' = hasUnknown ? 'Medium' : 'High';

    results.push({
      scheme,
      match,
      reasons,
      missing,
    });
  }

  results.sort((a, b) => {
    if (a.match === 'High' && b.match === 'Medium') return -1;
    if (a.match === 'Medium' && b.match === 'High') return 1;
    return b.reasons.length - a.reasons.length;
  });

  return results;
}

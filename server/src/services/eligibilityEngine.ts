/**
 * SchemeSaathi Eligibility Engine
 * Pure functions for rule evaluation and scheme matching.
 */

export interface Rule {
  field: 'age' | 'incomeRange' | 'state' | 'category' | 'occupation' | string;
  op: 'gte' | 'lte' | 'eq' | 'in' | 'includesAny' | string;
  value: any;
  required?: boolean;
  label: string;
}

export interface UserProfile {
  age?: number | null;
  incomeRange?: 'low' | 'lower_middle' | 'middle' | 'high' | string;
  state?: string;
  category?: string[];
  occupation?: string;
  familySize?: number;
}

export interface SchemeWithRules {
  scheme: any;
  rules: Rule[];
}

export interface MatchResult {
  scheme: any;
  match: 'High' | 'Medium';
  reasons: string[];
  missing: string[];
}

/**
 * Evaluates a single rule against a user profile.
 * Returns:
 * - true: condition met
 * - false: condition failed
 * - 'unknown': profile field is missing or empty
 */
export function evaluateRule(rule: Rule, profile?: UserProfile | null): boolean | 'unknown' {
  if (!profile || typeof profile !== 'object') {
    return 'unknown';
  }

  const profileVal = (profile as Record<string, any>)[rule.field];

  // If value is missing / undefined / null or empty array / string
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
        return target.some((t: any) =>
          typeof t === 'string' ? t.trim().toLowerCase() === lowerVal : t === profileVal
        );
      }
      return target.includes(profileVal);
    }

    case 'includesAny': {
      // Typically used for category arrays
      const profileArr = Array.isArray(profileVal) ? profileVal : [profileVal];
      const targetArr = Array.isArray(target) ? target : [target];

      const profileSet = new Set(
        profileArr.map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v))
      );

      return targetArr.some((t: any) => {
        const needle = typeof t === 'string' ? t.trim().toLowerCase() : t;
        return profileSet.has(needle);
      });
    }

    default:
      return false;
  }
}

/**
 * Matches a list of schemes (with their criteria rules) against a user profile.
 * - any required rule that is false excludes the scheme
 * - all rules true gives "High"
 * - no failed required rule, but at least one 'unknown' gives "Medium"
 * - reasons: plain-language strings from passed rules
 * - missing: plain-language strings to confirm for unknown rules
 * - sorts High matches first, then Medium matches
 */
export function matchSchemes(
  profile: UserProfile | null | undefined,
  schemesWithRules: SchemeWithRules[]
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const item of schemesWithRules) {
    const { scheme, rules = [] } = item;
    let isExcluded = false;
    let hasUnknown = false;
    const reasons: string[] = [];
    const missing: string[] = [];

    for (const rule of rules) {
      const isRequired = rule.required !== false; // default true
      const evalResult = evaluateRule(rule, profile);

      if (evalResult === true) {
        if (rule.label) {
          reasons.push(rule.label);
        }
      } else if (evalResult === false) {
        if (isRequired) {
          isExcluded = true;
          break; // Stop evaluating this scheme
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

  // Sort: High first, then Medium; tiebreak by number of reasons descending
  results.sort((a, b) => {
    if (a.match === 'High' && b.match === 'Medium') return -1;
    if (a.match === 'Medium' && b.match === 'High') return 1;
    return b.reasons.length - a.reasons.length;
  });

  return results;
}

import type { HardcodedScheme } from '../data/schemes';
import { matchHardcodedSchemes, SchemeMatchResult, UserProfileInput } from '../services/schemeMirrorService';

export const COMPARE_STORAGE_KEY = 'ss_compare';
export const TEXT_SIZE_STORAGE_KEY = 'ss_textsize';
export const MAX_COMPARE_ITEMS = 3;

export type TextSizeOption = '100' | '112' | '125';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function getChecklistStorageKey(schemeId: string): string {
  return `ss_checklist_${schemeId}`;
}

export function readChecklist(
  schemeId: string,
  totalDocs: number,
  storage?: StorageLike | null
): boolean[] {
  const safeTotal = Math.max(0, totalDocs);
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store || !schemeId) {
    return Array(safeTotal).fill(false);
  }
  try {
    const raw = store.getItem(getChecklistStorageKey(schemeId));
    if (!raw) return Array(safeTotal).fill(false);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return Array(safeTotal).fill(false);
    return Array.from({ length: safeTotal }, (_, idx) => Boolean(parsed[idx]));
  } catch {
    return Array(safeTotal).fill(false);
  }
}

export function writeChecklist(
  schemeId: string,
  checkedList: boolean[],
  storage?: StorageLike | null
): void {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store || !schemeId) return;
  try {
    store.setItem(getChecklistStorageKey(schemeId), JSON.stringify(checkedList));
  } catch {
    // ignore storage quota errors
  }
}

export function getChecklistProgress(checkedList: boolean[], totalDocs: number): {
  done: number;
  total: number;
  percentage: number;
} {
  const total = Math.max(0, totalDocs);
  if (total === 0) {
    return { done: 0, total: 0, percentage: 0 };
  }
  const done = checkedList.slice(0, total).filter(Boolean).length;
  return {
    done,
    total,
    percentage: Math.round((done / total) * 100),
  };
}

export interface SavedDocumentSummaryInput {
  schemeId?: string;
  scheme?: {
    _id?: string;
    documentsRequired?: string[];
  };
}

/**
 * Computes total document readiness across a user's saved schemes from ss_checklist_<id>.
 * Returns `{ done, total, formatted: "x of y" }`.
 */
export function computeSavedDocumentsReady(
  savedItems: SavedDocumentSummaryInput[],
  storage?: StorageLike | null
): { done: number; total: number; formatted: string } {
  let done = 0;
  let total = 0;
  const seenIds = new Set<string>();

  for (const item of savedItems || []) {
    const schemeId = item?.scheme?._id || item?.schemeId;
    if (!schemeId || seenIds.has(schemeId)) continue;
    seenIds.add(schemeId);

    const docs = item?.scheme?.documentsRequired;
    const docsCount = Array.isArray(docs) ? docs.length : 0;
    if (docsCount <= 0) continue;

    const checklist = readChecklist(schemeId, docsCount, storage);
    const prog = getChecklistProgress(checklist, docsCount);
    done += prog.done;
    total += prog.total;
  }

  return {
    done,
    total,
    formatted: `${done} of ${total}`,
  };
}

export interface NextBestStepInput {
  profileCompleted: number;
  profileTotal?: number;
  potentialMatchesCount: number;
  savedCount: number;
  docsDone: number;
  docsTotal: number;
  portalClicksCount: number;
}

export interface NextBestStepGuidance {
  id:
    | 'complete_profile'
    | 'browse_directory'
    | 'save_matches'
    | 'gather_documents'
    | 'visit_portal'
    | 'stay_updated';
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}

/**
 * Deterministic "Next best step" recommender for the household Dashboard.
 */
export function computeNextBestStep(input: NextBestStepInput): NextBestStepGuidance {
  if (input.profileCompleted < 3) {
    return {
      id: 'complete_profile',
      title: 'Finish your basic household profile',
      description:
        'Add your age, state, income bracket, and household categories so we can check which schemes may be relevant.',
      ctaLabel: 'Complete profile',
      ctaTo: '/profile',
    };
  }

  if (input.potentialMatchesCount === 0) {
    return {
      id: 'browse_directory',
      title: 'Explore the full Central & Karnataka directory',
      description:
        'No rules lined up automatically with your current profile. Browse all categories or update your household details.',
      ctaLabel: 'Browse directory',
      ctaTo: '/schemes',
    };
  }

  if (input.savedCount === 0) {
    return {
      id: 'save_matches',
      title: 'Save a scheme to unlock its document checklist',
      description: `We found ${input.potentialMatchesCount} schemes that may be relevant. Save 1 to 3 options to compare benefits and prepare documents.`,
      ctaLabel: 'Review potential matches',
      ctaTo: '/recommendations',
    };
  }

  if (input.docsTotal > 0 && input.docsDone < input.docsTotal) {
    const remaining = input.docsTotal - input.docsDone;
    return {
      id: 'gather_documents',
      title: `Gather ${remaining} remaining document${remaining === 1 ? '' : 's'}`,
      description: `You have checked off ${input.docsDone} of ${input.docsTotal} required documents across your saved schemes.`,
      ctaLabel: 'Open saved checklists',
      ctaTo: '/saved',
    };
  }

  if (input.portalClicksCount === 0) {
    return {
      id: 'visit_portal',
      title: 'Visit the official government portal to confirm & apply',
      description:
        'Your checklists look ready. Open the official portal link on a saved scheme to confirm final conditions and submit directly.',
      ctaLabel: 'Go to saved schemes',
      ctaTo: '/saved',
    };
  }

  return {
    id: 'stay_updated',
    title: 'Review your saved status or compare additional options',
    description:
      'Keep your household profile current whenever age or income changes, and mark schemes as applied after submitting on official portals.',
    ctaLabel: 'Review saved schemes',
    ctaTo: '/saved',
  };
}

export function readCompareIds(storage?: StorageLike | null): string[] {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return [];
  try {
    const raw = store.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      .slice(0, MAX_COMPARE_ITEMS);
  } catch {
    return [];
  }
}

export function writeCompareIds(ids: string[], storage?: StorageLike | null): void {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return;
  try {
    store.setItem(
      COMPARE_STORAGE_KEY,
      JSON.stringify(ids.slice(0, MAX_COMPARE_ITEMS))
    );
  } catch {
    // ignore storage errors
  }
}

export function toggleCompareId(
  currentIds: string[],
  targetId: string
): { ids: string[]; added: boolean; removed: boolean; limitReached: boolean } {
  if (!targetId) {
    return { ids: currentIds, added: false, removed: false, limitReached: false };
  }
  if (currentIds.includes(targetId)) {
    return {
      ids: currentIds.filter((id) => id !== targetId),
      added: false,
      removed: true,
      limitReached: false,
    };
  }
  if (currentIds.length >= MAX_COMPARE_ITEMS) {
    return {
      ids: currentIds,
      added: false,
      removed: false,
      limitReached: true,
    };
  }
  return {
    ids: [...currentIds, targetId],
    added: true,
    removed: false,
    limitReached: false,
  };
}

export function readTextSize(storage?: StorageLike | null): TextSizeOption {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return '100';
  try {
    const raw = store.getItem(TEXT_SIZE_STORAGE_KEY);
    if (raw === '100' || raw === '112' || raw === '125') {
      return raw;
    }
    return '100';
  } catch {
    return '100';
  }
}

export function writeTextSize(size: TextSizeOption, storage?: StorageLike | null): void {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return;
  try {
    store.setItem(TEXT_SIZE_STORAGE_KEY, size);
  } catch {
    // ignore storage errors
  }
}

export function applyTextSizeToRoot(size: TextSizeOption): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.fontSize = `${size}%`;
  }
}

export function computeProfileStrength(profile?: UserProfileInput | null): {
  completed: number;
  total: number;
  percentage: number;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  let completed = 0;

  if (typeof profile?.age === 'number' && !Number.isNaN(profile.age) && profile.age > 0) {
    completed += 1;
  } else {
    missingFields.push('Age');
  }

  if (typeof profile?.state === 'string' && profile.state.trim().length > 0) {
    completed += 1;
  } else {
    missingFields.push('State');
  }

  if (typeof profile?.incomeRange === 'string' && profile.incomeRange.trim().length > 0) {
    completed += 1;
  } else {
    missingFields.push('Income bracket');
  }

  if (Array.isArray(profile?.category) && profile.category.length > 0) {
    completed += 1;
  } else {
    missingFields.push('Categories');
  }

  if (typeof profile?.occupation === 'string' && profile.occupation.trim().length > 0) {
    completed += 1;
  } else {
    missingFields.push('Occupation');
  }

  const total = 5;
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
    missingFields,
  };
}

export interface QuickCheckInput {
  age: string;
  state: string;
  incomeRange: string;
  categories: string[];
}

export function runQuickCheck(
  input: QuickCheckInput,
  sourceSchemes: HardcodedScheme[] = []
): {
  totalMatches: number;
  highCount: number;
  mediumCount: number;
  topThree: SchemeMatchResult[];
} {
  const parsedAge = input.age.trim() ? Number(input.age) : null;
  const validAge =
    parsedAge !== null && !Number.isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 120
      ? parsedAge
      : null;

  const profile: UserProfileInput = {
    age: validAge,
    state: input.state || 'Karnataka',
    incomeRange: input.incomeRange || undefined,
    category: input.categories,
  };

  const results = matchHardcodedSchemes(profile, sourceSchemes);
  const highCount = results.filter((r) => r.match === 'High').length;
  const mediumCount = results.filter((r) => r.match === 'Medium').length;

  return {
    totalMatches: results.length,
    highCount,
    mediumCount,
    topThree: results.slice(0, 3),
  };
}

export function getRuleProgress(
  schemeId: string,
  reasonsCount: number,
  missingCount: number,
  explicitRulesLength?: number,
  sourceSchemes: HardcodedScheme[] = []
): { passed: number; total: number; percent: number } {
  const fallbackScheme = sourceSchemes.find((s) => s._id === schemeId || s.id === schemeId);
  const derivedTotal =
    explicitRulesLength ??
    fallbackScheme?.rules.length ??
    reasonsCount + missingCount;
  const total = Math.max(1, derivedTotal, reasonsCount);
  const passed = Math.min(total, Math.max(0, reasonsCount));
  return {
    passed,
    total,
    percent: Math.round((passed / total) * 100),
  };
}

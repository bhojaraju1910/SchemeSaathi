export type SuggestionType = 'scheme' | 'feature' | 'other';
export type SuggestionStatus = 'new' | 'planned' | 'done' | 'rejected';

export interface SuggestionInput {
  type?: unknown;
  title?: unknown;
  details?: unknown;
  schemeName?: unknown;
  schemeState?: unknown;
  schemeLink?: unknown;
  targetGroup?: unknown;
  name?: unknown;
  email?: unknown;
  userId?: unknown;
  honeypot?: unknown;
  website?: unknown;
}

export interface SanitizedSuggestion {
  type: SuggestionType;
  title: string;
  details: string;
  schemeName: string;
  schemeState: string;
  schemeLink: string;
  targetGroup: string;
  name: string;
  email: string;
  userId?: string;
}

export interface SuggestionValidationResult {
  valid: boolean;
  isSpam?: boolean;
  errors: Record<string, string>;
  message?: string;
  data?: SanitizedSuggestion;
}

export const ALLOWED_SUGGESTION_TYPES: SuggestionType[] = ['scheme', 'feature', 'other'];
export const ALLOWED_SUGGESTION_STATUSES: SuggestionStatus[] = [
  'new',
  'planned',
  'done',
  'rejected',
];

export const TITLE_MAX_LENGTH = 100;
export const DETAILS_MAX_LENGTH = 1000;

function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

function rawTrimmed(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

export function isValidHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidOptionalEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateAndSanitizeSuggestion(
  input: SuggestionInput
): SuggestionValidationResult {
  const honeypotVal = rawTrimmed(input.honeypot) || rawTrimmed(input.website);
  if (honeypotVal.length > 0) {
    return {
      valid: false,
      isSpam: true,
      errors: { form: 'Submission rejected.' },
      message: 'Submission rejected.',
    };
  }

  const errors: Record<string, string> = {};
  const typeRaw = rawTrimmed(input.type) as SuggestionType;
  if (!ALLOWED_SUGGESTION_TYPES.includes(typeRaw)) {
    errors.type = 'Please select a valid suggestion type.';
  }

  const rawTitle = rawTrimmed(input.title);
  const rawDetails = rawTrimmed(input.details);
  const rawSchemeName = rawTrimmed(input.schemeName);
  const rawSchemeState = rawTrimmed(input.schemeState);
  const rawSchemeLink = rawTrimmed(input.schemeLink);
  const rawTargetGroup = rawTrimmed(input.targetGroup);
  const rawName = rawTrimmed(input.name);
  const rawEmail = rawTrimmed(input.email).toLowerCase();
  const rawUserId = rawTrimmed(input.userId);

  if (typeRaw === 'scheme') {
    if (!rawSchemeName) {
      errors.schemeName = 'Scheme name is required.';
    } else if (rawSchemeName.length > TITLE_MAX_LENGTH) {
      errors.schemeName = `Scheme name must be ${TITLE_MAX_LENGTH} characters or fewer.`;
    }
    if (rawSchemeLink && !isValidHttpUrl(rawSchemeLink)) {
      errors.schemeLink = 'Please enter a valid official URL starting with http:// or https://.';
    }
    if (rawTargetGroup.length > 200) {
      errors.targetGroup = 'Target group must be 200 characters or fewer.';
    }
    if (rawDetails.length > DETAILS_MAX_LENGTH) {
      errors.details = `Details must be ${DETAILS_MAX_LENGTH} characters or fewer.`;
    }
  } else if (typeRaw === 'feature') {
    if (!rawTitle) {
      errors.title = 'Short title is required.';
    } else if (rawTitle.length > TITLE_MAX_LENGTH) {
      errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
    }
    if (!rawDetails) {
      errors.details = 'Please describe what the feature should do.';
    } else if (rawDetails.length > DETAILS_MAX_LENGTH) {
      errors.details = `Description must be ${DETAILS_MAX_LENGTH} characters or fewer.`;
    }
  } else if (typeRaw === 'other') {
    if (!rawDetails) {
      errors.details = 'Please enter your message.';
    } else if (rawDetails.length > DETAILS_MAX_LENGTH) {
      errors.details = `Message must be ${DETAILS_MAX_LENGTH} characters or fewer.`;
    }
    if (rawTitle.length > TITLE_MAX_LENGTH) {
      errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
    }
  }

  if (rawName.length > 100) {
    errors.name = 'Name must be 100 characters or fewer.';
  }

  if (rawEmail && !isValidOptionalEmail(rawEmail)) {
    errors.email = 'Please enter a valid email address or leave it blank.';
  }

  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0];
    return {
      valid: false,
      errors,
      message: firstError,
    };
  }

  const sanitized: SanitizedSuggestion = {
    type: typeRaw,
    title: sanitizeText(rawTitle, TITLE_MAX_LENGTH),
    details: sanitizeText(rawDetails, DETAILS_MAX_LENGTH),
    schemeName: sanitizeText(rawSchemeName, TITLE_MAX_LENGTH),
    schemeState: sanitizeText(rawSchemeState, 80),
    schemeLink: rawSchemeLink ? rawSchemeLink.slice(0, 500) : '',
    targetGroup: sanitizeText(rawTargetGroup, 200),
    name: sanitizeText(rawName, 100),
    email: rawEmail.slice(0, 150),
    ...(rawUserId ? { userId: sanitizeText(rawUserId, 100) } : {}),
  };

  return {
    valid: true,
    errors: {},
    data: sanitized,
  };
}

import { HARDCODED_SCHEMES, HardcodedScheme } from '../data/schemes';
import {
  matchHardcodedSchemes,
  SchemeMatchResult,
  UserProfileInput,
} from './schemeMirrorService';

export interface MirrorUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferredLanguage: 'en' | 'kn' | 'hi';
}

interface StoredMirrorAccount extends MirrorUser {
  password: string;
}

export interface MirrorProfile extends UserProfileInput {
  userId: string;
  updatedAt?: string;
}

export interface MirrorSavedEntry {
  _id: string;
  userId: string;
  schemeId: string;
  savedAt: string;
  scheme?: HardcodedScheme;
  status?: 'clicked' | 'applied' | 'not_applied';
}

export interface MirrorApplicationEntry {
  _id: string;
  userId: string;
  schemeId: string;
  linkClickedAt: string;
  status: 'clicked' | 'applied' | 'not_applied';
}

export interface MirrorDashboardStats {
  availableSchemes: number;
  potentialMatches: number;
  savedSchemes: number;
  applicationLinks: number;
  topMatches: SchemeMatchResult[];
}

const ACCOUNTS_KEY = 'schemesaathi_mirror_accounts';
const PROFILES_KEY = 'schemesaathi_mirror_profiles';
const SAVED_KEY = 'schemesaathi_mirror_saved';
const APPS_KEY = 'schemesaathi_mirror_apps';

export const MIRROR_TOKEN_PREFIX = 'local_mirror_';

const DEMO_ACCOUNTS: StoredMirrorAccount[] = [
  {
    id: 'user_demo',
    name: 'Ramesh Kumar',
    email: 'demo@schemesaathi.test',
    password: 'Demo@123',
    role: 'user',
    preferredLanguage: 'en',
  },
  {
    id: 'user_admin',
    name: 'Administrator',
    email: 'admin@schemesaathi.test',
    password: 'Admin@123',
    role: 'admin',
    preferredLanguage: 'en',
  },
];

const DEFAULT_DEMO_PROFILE: MirrorProfile = {
  userId: 'user_demo',
  age: 62,
  incomeRange: 'low',
  state: 'Karnataka',
  category: ['senior_citizen'],
  occupation: '',
  familySize: 3,
};

// In-memory fallback map for environments without browser storage (e.g. Node unit tests)
const memoryFallback = new Map<string, string>();

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem(key) : memoryFallback.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  const serialized = JSON.stringify(value);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    } else {
      memoryFallback.set(key, serialized);
    }
  } catch {
    memoryFallback.set(key, serialized);
  }
}

export function clearMirrorStateForTesting(): void {
  memoryFallback.clear();
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ACCOUNTS_KEY);
    localStorage.removeItem(PROFILES_KEY);
    localStorage.removeItem(SAVED_KEY);
    localStorage.removeItem(APPS_KEY);
  }
}

export function isMirrorToken(token?: string | null): boolean {
  return Boolean(token && token.startsWith(MIRROR_TOKEN_PREFIX));
}

export function makeMirrorToken(userId: string): string {
  return `${MIRROR_TOKEN_PREFIX}${userId}`;
}

export function getUserIdFromMirrorToken(token: string): string {
  return token.slice(MIRROR_TOKEN_PREFIX.length);
}

/**
 * Returns true if an Axios / fetch error indicates the backend API is unreachable,
 * missing (404), returned HTML instead of JSON (e.g. SPA rewrite), or failed with 5xx.
 */
export function isApiUnavailableError(err: any): boolean {
  if (!err) return true;
  if (err.message === 'NON_JSON_HTML_RESPONSE') return true;
  if (!err.response) return true;
  const status = err.response.status;
  if (status === 404 || status === 405 || status >= 500) return true;
  if (typeof err.response.data === 'string' && err.response.data.trim().startsWith('<')) {
    return true;
  }
  return false;
}

function getRegisteredAccounts(): StoredMirrorAccount[] {
  return readStorage<StoredMirrorAccount[]>(ACCOUNTS_KEY, []);
}

function getAllMirrorAccounts(): StoredMirrorAccount[] {
  const registered = getRegisteredAccounts();
  const byEmail = new Map<string, StoredMirrorAccount>();
  for (const acc of DEMO_ACCOUNTS) {
    byEmail.set(acc.email.toLowerCase(), acc);
  }
  for (const acc of registered) {
    byEmail.set(acc.email.toLowerCase(), acc);
  }
  return Array.from(byEmail.values());
}

export function hasMirrorAccount(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return getAllMirrorAccounts().some((a) => a.email.toLowerCase() === normalized);
}

export function syncMirrorUser(user: MirrorUser, password?: string): void {
  const registered = getRegisteredAccounts();
  const normalizedEmail = user.email.trim().toLowerCase();
  const existingIdx = registered.findIndex(
    (a) => a.id === user.id || a.email.toLowerCase() === normalizedEmail
  );

  if (existingIdx >= 0) {
    registered[existingIdx] = {
      ...registered[existingIdx],
      ...user,
      email: normalizedEmail,
      ...(password ? { password } : {}),
    };
  } else if (!DEMO_ACCOUNTS.some((d) => d.email.toLowerCase() === normalizedEmail)) {
    registered.push({
      ...user,
      email: normalizedEmail,
      password: password || '',
    });
  }
  writeStorage(ACCOUNTS_KEY, registered);
}

export function getMirrorUserById(userId: string): MirrorUser | null {
  const match = getAllMirrorAccounts().find((a) => a.id === userId);
  if (!match) return null;
  const { password: _pw, ...publicUser } = match;
  return publicUser;
}

export function mirrorRegister(
  name: string,
  email: string,
  password: string,
  preferredLanguage: 'en' | 'kn' | 'hi' = 'en'
): { token: string; user: MirrorUser } {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new Error('Full name is required (minimum 2 characters).');
  }
  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new Error('A valid email address is required.');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (hasMirrorAccount(normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const cleanLang: 'en' | 'kn' | 'hi' = ['en', 'kn', 'hi'].includes(preferredLanguage)
    ? preferredLanguage
    : 'en';

  const newUser: StoredMirrorAccount = {
    id: `local_user_${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'user',
    preferredLanguage: cleanLang,
  };

  const registered = getRegisteredAccounts();
  registered.push(newUser);
  writeStorage(ACCOUNTS_KEY, registered);

  // Initialize default profile for the newly registered user
  saveMirrorProfile(newUser.id, {
    age: null,
    incomeRange: 'low',
    state: 'Karnataka',
    category: [],
    occupation: '',
    familySize: undefined,
  });

  const { password: _pw, ...publicUser } = newUser;
  return {
    token: makeMirrorToken(newUser.id),
    user: publicUser,
  };
}

export function mirrorLogin(
  email: string,
  password: string
): { token: string; user: MirrorUser } {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const account = getAllMirrorAccounts().find(
    (a) => a.email.toLowerCase() === normalizedEmail
  );

  if (!account || account.password !== password) {
    throw new Error('Invalid email or password.');
  }

  const { password: _pw, ...publicUser } = account;
  return {
    token: makeMirrorToken(account.id),
    user: publicUser,
  };
}

export function getMirrorProfile(userId: string): MirrorProfile {
  const profiles = readStorage<Record<string, MirrorProfile>>(PROFILES_KEY, {});
  if (profiles[userId]) {
    return profiles[userId];
  }
  if (userId === 'user_demo') {
    return { ...DEFAULT_DEMO_PROFILE };
  }
  return {
    userId,
    age: null,
    incomeRange: 'low',
    state: 'Karnataka',
    category: [],
    occupation: '',
    familySize: undefined,
  };
}

export function saveMirrorProfile(
  userId: string,
  patch: Partial<MirrorProfile> & { preferredLanguage?: 'en' | 'kn' | 'hi' }
): MirrorProfile {
  const profiles = readStorage<Record<string, MirrorProfile>>(PROFILES_KEY, {});
  const existing = getMirrorProfile(userId);
  const updated: MirrorProfile = {
    ...existing,
    ...patch,
    userId,
    category: Array.isArray(patch.category) ? patch.category : existing.category || [],
    updatedAt: new Date().toISOString(),
  };
  profiles[userId] = updated;
  writeStorage(PROFILES_KEY, profiles);

  if (patch.preferredLanguage && ['en', 'kn', 'hi'].includes(patch.preferredLanguage)) {
    const registered = getRegisteredAccounts();
    const idx = registered.findIndex((a) => a.id === userId);
    if (idx >= 0) {
      registered[idx].preferredLanguage = patch.preferredLanguage;
      writeStorage(ACCOUNTS_KEY, registered);
    }
  }

  return updated;
}

export function getMirrorApplications(userId: string): MirrorApplicationEntry[] {
  const allApps = readStorage<Record<string, MirrorApplicationEntry[]>>(APPS_KEY, {});
  return allApps[userId] || [];
}

export function recordMirrorApplicationStatus(
  userId: string,
  schemeId: string,
  status: 'clicked' | 'applied' | 'not_applied' = 'clicked'
): MirrorApplicationEntry {
  const allApps = readStorage<Record<string, MirrorApplicationEntry[]>>(APPS_KEY, {});
  const list = allApps[userId] || [];
  const idx = list.findIndex((a) => a.schemeId === schemeId);

  if (idx >= 0) {
    list[idx] = { ...list[idx], status };
    allApps[userId] = list;
    writeStorage(APPS_KEY, allApps);
    return list[idx];
  }

  const entry: MirrorApplicationEntry = {
    _id: `app_${Date.now()}_${schemeId}`,
    userId,
    schemeId,
    linkClickedAt: new Date().toISOString(),
    status,
  };
  list.push(entry);
  allApps[userId] = list;
  writeStorage(APPS_KEY, allApps);
  return entry;
}

export function getMirrorSavedSchemes(userId: string): MirrorSavedEntry[] {
  const allSaved = readStorage<Record<string, MirrorSavedEntry[]>>(SAVED_KEY, {});
  const list = allSaved[userId] || [];
  const apps = getMirrorApplications(userId);
  const appMap = new Map(apps.map((a) => [a.schemeId, a.status]));

  return list.map((item) => ({
    ...item,
    scheme: HARDCODED_SCHEMES.find((s) => s._id === item.schemeId || s.id === item.schemeId),
    status: appMap.get(item.schemeId) || item.status,
  }));
}

export function addMirrorSavedScheme(userId: string, schemeId: string): MirrorSavedEntry {
  const allSaved = readStorage<Record<string, MirrorSavedEntry[]>>(SAVED_KEY, {});
  const list = allSaved[userId] || [];
  const existing = list.find((s) => s.schemeId === schemeId);
  if (existing) return existing;

  const entry: MirrorSavedEntry = {
    _id: `saved_${Date.now()}_${schemeId}`,
    userId,
    schemeId,
    savedAt: new Date().toISOString(),
    scheme: HARDCODED_SCHEMES.find((s) => s._id === schemeId || s.id === schemeId),
  };
  allSaved[userId] = [entry, ...list];
  writeStorage(SAVED_KEY, allSaved);
  return entry;
}

export function removeMirrorSavedScheme(userId: string, schemeId: string): void {
  const allSaved = readStorage<Record<string, MirrorSavedEntry[]>>(SAVED_KEY, {});
  const list = allSaved[userId] || [];
  allSaved[userId] = list.filter((s) => s.schemeId !== schemeId);
  writeStorage(SAVED_KEY, allSaved);
}

export function getMirrorDashboardStats(userId: string): MirrorDashboardStats {
  const profile = getMirrorProfile(userId);
  const matches = matchHardcodedSchemes(profile, HARDCODED_SCHEMES);
  const saved = getMirrorSavedSchemes(userId);
  const apps = getMirrorApplications(userId);

  return {
    availableSchemes: HARDCODED_SCHEMES.length,
    potentialMatches: matches.length,
    savedSchemes: saved.length,
    applicationLinks: apps.length,
    topMatches: matches.slice(0, 3),
  };
}

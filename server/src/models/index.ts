import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { HARDCODED_SCHEMES } from '../../../src/data/schemes';

// Let's create an in-memory fallback store for zero-dependency demo reliability
export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  preferredLanguage: 'en' | 'kn' | 'hi';
  createdAt: Date;
}

export interface IProfile {
  _id: string;
  userId: string;
  age?: number | null;
  incomeRange?: 'low' | 'lower_middle' | 'middle' | 'high';
  state?: string;
  category: ('senior_citizen' | 'student' | 'woman' | 'farmer' | 'disabled' | 'child' | 'general')[];
  occupation?: string;
  familySize?: number;
  updatedAt: Date;
}

export interface IScheme {
  _id: string;
  title: string;
  shortDescription: string;
  category: 'education' | 'healthcare' | 'housing' | 'employment' | 'women_child' | 'senior_citizens' | 'agriculture';
  level: 'central' | 'state';
  state: string;
  benefits: string[];
  documentsRequired: string[];
  applyUrl: string;
  sourceUrl: string;
  lastVerified: Date;
  isSample: boolean;
  translations?: {
    kn?: { title?: string; shortDescription?: string; benefits?: string[] };
    hi?: { title?: string; shortDescription?: string; benefits?: string[] };
  };
  createdAt: Date;
}

export interface ICriteriaRule {
  field: string;
  op: string;
  value: any;
  required?: boolean;
  label: string;
}

export interface IEligibilityCriteria {
  _id: string;
  schemeId: string;
  rules: ICriteriaRule[];
}

export interface ISavedScheme {
  _id: string;
  userId: string;
  schemeId: string;
  savedAt: Date;
}

export interface IApplication {
  _id: string;
  userId: string;
  schemeId: string;
  linkClickedAt: Date;
  status: 'clicked' | 'applied' | 'not_applied';
}

// In-memory collections state
export const inMemoryDB = {
  users: new Map<string, IUser>(),
  profiles: new Map<string, IProfile>(),
  schemes: new Map<string, IScheme>(),
  criteria: new Map<string, IEligibilityCriteria>(),
  savedSchemes: new Map<string, ISavedScheme>(),
  applications: new Map<string, IApplication>(),
  isInitialized: false,
};

let idCounter = 1000;
export function generateId(): string {
  idCounter += 1;
  return `id_${Date.now()}_${idCounter}`;
}

let seedPromise: Promise<void> | null = null;

export async function initSeedData(force = false) {
  if (!force && inMemoryDB.isInitialized && inMemoryDB.schemes.size > 0) return;
  if (!force && seedPromise) return seedPromise;

  const runSeed = async () => {
    if (!force && inMemoryDB.isInitialized && inMemoryDB.schemes.size > 0) return;

    // Read schemes.json on disk, or fall back to static HARDCODED_SCHEMES (e.g. serverless bundles)
    const seedPath = path.resolve(process.cwd(), 'server/src/seed/schemes.json');
    const altSeedPath = path.resolve(process.cwd(), 'server/seed/schemes.json');
    const targetPath = fs.existsSync(seedPath) ? seedPath : altSeedPath;

    let seedSchemes: any[] = HARDCODED_SCHEMES;
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      seedSchemes = JSON.parse(raw);
    }

    inMemoryDB.schemes.clear();
    inMemoryDB.criteria.clear();

    for (const item of seedSchemes) {
      const schemeId = item.id || item._id || generateId();
      const scheme: IScheme = {
        _id: schemeId,
        title: item.title,
        shortDescription: item.shortDescription,
        category: item.category,
        level: item.level,
        state: item.state,
        benefits: item.benefits || [],
        documentsRequired: item.documentsRequired || [],
        applyUrl: item.applyUrl || 'https://www.myscheme.gov.in/',
        sourceUrl: item.sourceUrl || 'https://www.myscheme.gov.in/',
        lastVerified: new Date(item.lastVerified || '2026-11-01'),
        isSample: Boolean(item.isSample),
        translations: item.translations || {},
        createdAt: new Date(),
      };
      inMemoryDB.schemes.set(schemeId, scheme);

      if (item.rules && Array.isArray(item.rules)) {
        const crit: IEligibilityCriteria = {
          _id: generateId(),
          schemeId: schemeId,
          rules: item.rules,
        };
        inMemoryDB.criteria.set(schemeId, crit);
      }
    }

  // Admin user
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@123', adminSalt);
  const adminUser: IUser = {
    _id: 'user_admin',
    name: 'Administrator',
    email: 'admin@schemesaathi.test',
    passwordHash: adminHash,
    role: 'admin',
    preferredLanguage: 'en',
    createdAt: new Date(),
  };
  inMemoryDB.users.set(adminUser._id, adminUser);

  // Demo user
  const demoSalt = await bcrypt.genSalt(10);
  const demoHash = await bcrypt.hash('Demo@123', demoSalt);
  const demoUser: IUser = {
    _id: 'user_demo',
    name: 'Ramesh Kumar',
    email: 'demo@schemesaathi.test',
    passwordHash: demoHash,
    role: 'user',
    preferredLanguage: 'en',
    createdAt: new Date(),
  };
  inMemoryDB.users.set(demoUser._id, demoUser);

  // Demo profile
  const demoProfile: IProfile = {
    _id: 'profile_demo',
    userId: demoUser._id,
    age: 62,
    incomeRange: 'low',
    state: 'Karnataka',
    category: ['senior_citizen'],
    occupation: '',
    familySize: 3,
    updatedAt: new Date(),
  };
  inMemoryDB.profiles.set(demoUser._id, demoProfile);

    inMemoryDB.isInitialized = true;
    console.log(`[SchemeSaathi DB] Seeded ${inMemoryDB.schemes.size} schemes and 2 accounts (Admin & Demo User)`);
  };

  seedPromise = runSeed().finally(() => {
    seedPromise = null;
  });
  return seedPromise;
}

// User Model Adapter
export const UserModel = {
  async findOne(query: { email?: string; _id?: string }): Promise<IUser | null> {
    for (const u of inMemoryDB.users.values()) {
      if (query.email && u.email.toLowerCase() === query.email.toLowerCase()) return { ...u };
      if (query._id && u._id === query._id) return { ...u };
    }
    return null;
  },
  async findById(id: string): Promise<IUser | null> {
    const u = inMemoryDB.users.get(id);
    return u ? { ...u } : null;
  },
  async create(data: Partial<IUser>): Promise<IUser> {
    const _id = data._id || generateId();
    const newUser: IUser = {
      _id,
      name: data.name || '',
      email: data.email || '',
      passwordHash: data.passwordHash || '',
      role: data.role || 'user',
      preferredLanguage: data.preferredLanguage || 'en',
      createdAt: new Date(),
    };
    inMemoryDB.users.set(_id, newUser);
    return { ...newUser };
  },
  async updateOne(query: { _id: string }, update: Partial<IUser>): Promise<void> {
    const u = inMemoryDB.users.get(query._id);
    if (u) {
      Object.assign(u, update);
    }
  },
};

// Profile Model Adapter
export const ProfileModel = {
  async findOne(query: { userId: string }): Promise<IProfile | null> {
    const p = inMemoryDB.profiles.get(query.userId);
    return p ? { ...p } : null;
  },
  async findOneAndUpdate(
    query: { userId: string },
    update: Partial<IProfile>,
    _opts?: any
  ): Promise<IProfile> {
    let p = inMemoryDB.profiles.get(query.userId);
    if (!p) {
      p = {
        _id: generateId(),
        userId: query.userId,
        age: update.age,
        incomeRange: update.incomeRange,
        state: update.state,
        category: update.category || [],
        occupation: update.occupation || '',
        familySize: update.familySize,
        updatedAt: new Date(),
      };
      inMemoryDB.profiles.set(query.userId, p);
    } else {
      Object.assign(p, update, { updatedAt: new Date() });
    }
    return { ...p };
  },
};

// Scheme Model Adapter
export const SchemeModel = {
  async find(filter: any = {}): Promise<IScheme[]> {
    let list = Array.from(inMemoryDB.schemes.values());

    if (filter.category) {
      list = list.filter((s) => s.category === filter.category);
    }
    if (filter.level) {
      list = list.filter((s) => s.level === filter.level);
    }
    if (filter.state && filter.state !== 'All') {
      list = list.filter((s) => s.state === filter.state || s.state === 'All');
    }
    if (filter.q) {
      const q = String(filter.q).toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.translations?.kn?.title && s.translations.kn.title.includes(q)) ||
          (s.translations?.hi?.title && s.translations.hi.title.includes(q))
      );
    }

    return list.map((s) => ({ ...s }));
  },
  async findById(id: string): Promise<IScheme | null> {
    const s = inMemoryDB.schemes.get(id);
    return s ? { ...s } : null;
  },
  async countDocuments(filter: any = {}): Promise<number> {
    const results = await this.find(filter);
    return results.length;
  },
  async create(data: Partial<IScheme>): Promise<IScheme> {
    const _id = data._id || generateId();
    const newScheme: IScheme = {
      _id,
      title: data.title || '',
      shortDescription: data.shortDescription || '',
      category: data.category || 'general' as any,
      level: data.level || 'central',
      state: data.state || 'All',
      benefits: data.benefits || [],
      documentsRequired: data.documentsRequired || [],
      applyUrl: data.applyUrl || 'https://www.myscheme.gov.in/',
      sourceUrl: data.sourceUrl || 'https://www.myscheme.gov.in/',
      lastVerified: data.lastVerified || new Date(),
      isSample: data.isSample !== undefined ? data.isSample : true,
      translations: data.translations || {},
      createdAt: new Date(),
    };
    inMemoryDB.schemes.set(_id, newScheme);
    return { ...newScheme };
  },
  async findByIdAndUpdate(id: string, data: Partial<IScheme>, _opts?: any): Promise<IScheme | null> {
    const s = inMemoryDB.schemes.get(id);
    if (!s) return null;
    Object.assign(s, data);
    return { ...s };
  },
  async findByIdAndDelete(id: string): Promise<boolean> {
    inMemoryDB.criteria.delete(id);
    return inMemoryDB.schemes.delete(id);
  },
};

// Eligibility Criteria Adapter
export const CriteriaModel = {
  async findOne(query: { schemeId: string }): Promise<IEligibilityCriteria | null> {
    const c = inMemoryDB.criteria.get(query.schemeId);
    return c ? { ...c } : null;
  },
  async find(): Promise<IEligibilityCriteria[]> {
    return Array.from(inMemoryDB.criteria.values()).map((c) => ({ ...c }));
  },
  async findOneAndUpdate(
    query: { schemeId: string },
    update: { rules: ICriteriaRule[] },
    _opts?: any
  ): Promise<IEligibilityCriteria> {
    let c = inMemoryDB.criteria.get(query.schemeId);
    if (!c) {
      c = {
        _id: generateId(),
        schemeId: query.schemeId,
        rules: update.rules || [],
      };
      inMemoryDB.criteria.set(query.schemeId, c);
    } else {
      c.rules = update.rules || [];
    }
    return { ...c };
  },
  async deleteOne(query: { schemeId: string }): Promise<void> {
    inMemoryDB.criteria.delete(query.schemeId);
  },
};

// Saved Scheme Adapter
export const SavedSchemeModel = {
  async findOne(query: { userId: string; schemeId: string }): Promise<ISavedScheme | null> {
    const key = `${query.userId}_${query.schemeId}`;
    const s = inMemoryDB.savedSchemes.get(key);
    return s ? { ...s } : null;
  },
  async find(query: { userId: string }): Promise<ISavedScheme[]> {
    const list: ISavedScheme[] = [];
    for (const item of inMemoryDB.savedSchemes.values()) {
      if (item.userId === query.userId) {
        list.push({ ...item });
      }
    }
    // Sort recently saved first
    list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    return list;
  },
  async create(data: { userId: string; schemeId: string }): Promise<ISavedScheme> {
    const key = `${data.userId}_${data.schemeId}`;
    const item: ISavedScheme = {
      _id: generateId(),
      userId: data.userId,
      schemeId: data.schemeId,
      savedAt: new Date(),
    };
    inMemoryDB.savedSchemes.set(key, item);
    return { ...item };
  },
  async deleteOne(query: { userId: string; schemeId: string }): Promise<boolean> {
    const key = `${query.userId}_${query.schemeId}`;
    return inMemoryDB.savedSchemes.delete(key);
  },
  async countDocuments(query: { userId: string }): Promise<number> {
    let count = 0;
    for (const item of inMemoryDB.savedSchemes.values()) {
      if (item.userId === query.userId) count++;
    }
    return count;
  },
};

// Application Click Adapter
export const ApplicationModel = {
  async create(data: { userId: string; schemeId: string; status?: 'clicked' | 'applied' | 'not_applied' }): Promise<IApplication> {
    const app: IApplication = {
      _id: generateId(),
      userId: data.userId,
      schemeId: data.schemeId,
      linkClickedAt: new Date(),
      status: data.status || 'clicked',
    };
    inMemoryDB.applications.set(app._id, app);
    return { ...app };
  },
  async findOneAndUpdate(
    query: { userId: string; schemeId: string },
    update: { status: 'clicked' | 'applied' | 'not_applied' }
  ): Promise<IApplication | null> {
    for (const app of inMemoryDB.applications.values()) {
      if (app.userId === query.userId && app.schemeId === query.schemeId) {
        app.status = update.status;
        return { ...app };
      }
    }
    return this.create({ userId: query.userId, schemeId: query.schemeId, status: update.status });
  },
  async countDocuments(query: { userId?: string } = {}): Promise<number> {
    let count = 0;
    for (const app of inMemoryDB.applications.values()) {
      if (!query.userId || app.userId === query.userId) {
        count++;
      }
    }
    return count;
  },
};

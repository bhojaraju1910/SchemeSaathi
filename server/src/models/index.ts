import mongoose, { Schema, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { DatabaseUnavailableError, isMongoConnected } from '../config/db.ts';

export type SchemeCategory =
  | 'education'
  | 'healthcare'
  | 'housing'
  | 'employment'
  | 'women_child'
  | 'senior_citizens'
  | 'agriculture';

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
  slug: string;
  title: string;
  shortDescription: string;
  category: SchemeCategory;
  level: 'central' | 'state';
  state: string;
  benefits: string[];
  documentsRequired: string[];
  applyUrl: string;
  sourceUrl: string;
  isActive: boolean;
  verified: boolean;
  lastVerified: Date | null;
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

// ---------- Real Mongoose Schemas & Indexes ----------

interface IUserDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  preferredLanguage: 'en' | 'kn' | 'hi';
  createdAt: Date;
}

const UserSchema = new Schema<IUserDoc>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  preferredLanguage: { type: String, enum: ['en', 'kn', 'hi'], default: 'en' },
  createdAt: { type: Date, default: Date.now },
});

interface IProfileDoc extends Document {
  userId: string;
  age?: number | null;
  incomeRange?: 'low' | 'lower_middle' | 'middle' | 'high';
  state?: string;
  category: string[];
  occupation?: string;
  familySize?: number;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfileDoc>({
  userId: { type: String, required: true, unique: true },
  age: { type: Number, default: null },
  incomeRange: { type: String, enum: ['low', 'lower_middle', 'middle', 'high'], default: 'low' },
  state: { type: String, default: 'Karnataka' },
  category: { type: [String], default: [] },
  occupation: { type: String, default: '' },
  familySize: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

interface ISchemeDoc extends Document {
  slug: string;
  title: string;
  shortDescription: string;
  category: SchemeCategory;
  level: 'central' | 'state';
  state: string;
  benefits: string[];
  documentsRequired: string[];
  applyUrl: string;
  sourceUrl: string;
  isActive: boolean;
  verified: boolean;
  lastVerified: Date | null;
  isSample: boolean;
  translations?: {
    kn?: { title?: string; shortDescription?: string; benefits?: string[] };
    hi?: { title?: string; shortDescription?: string; benefits?: string[] };
  };
  createdAt: Date;
}

const SchemeSchema = new Schema<ISchemeDoc>({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, required: true, trim: true },
  shortDescription: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      'education',
      'healthcare',
      'housing',
      'employment',
      'women_child',
      'senior_citizens',
      'agriculture',
    ],
    required: true,
  },
  level: { type: String, enum: ['central', 'state'], required: true },
  state: { type: String, default: 'All' },
  benefits: { type: [String], default: [] },
  documentsRequired: { type: [String], default: [] },
  applyUrl: { type: String, default: 'https://www.myscheme.gov.in/' },
  sourceUrl: { type: String, default: 'https://www.myscheme.gov.in/' },
  isActive: { type: Boolean, default: true },
  verified: { type: Boolean, default: false },
  lastVerified: { type: Date, default: null },
  isSample: { type: Boolean, default: false },
  translations: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

SchemeSchema.index({ slug: 1 }, { unique: true });
SchemeSchema.index({ isActive: 1, category: 1, level: 1, state: 1 });
SchemeSchema.index({ title: 'text', shortDescription: 'text' });

interface IEligibilityCriteriaDoc extends Document {
  schemeId: string;
  rules: ICriteriaRule[];
}

const EligibilityCriteriaSchema = new Schema<IEligibilityCriteriaDoc>({
  schemeId: { type: String, required: true, unique: true },
  rules: { type: [Schema.Types.Mixed] as unknown as ICriteriaRule[], default: [] },
});

interface ISavedSchemeDoc extends Document {
  userId: string;
  schemeId: string;
  savedAt: Date;
}

const SavedSchemeSchema = new Schema<ISavedSchemeDoc>({
  userId: { type: String, required: true },
  schemeId: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
});
SavedSchemeSchema.index({ userId: 1, schemeId: 1 }, { unique: true });

interface IApplicationDoc extends Document {
  userId: string;
  schemeId: string;
  linkClickedAt: Date;
  status: 'clicked' | 'applied' | 'not_applied';
}

const ApplicationSchema = new Schema<IApplicationDoc>({
  userId: { type: String, required: true },
  schemeId: { type: String, required: true },
  linkClickedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['clicked', 'applied', 'not_applied'], default: 'clicked' },
});
ApplicationSchema.index({ userId: 1, schemeId: 1 });

export const UserMongoModel =
  (mongoose.models.User as mongoose.Model<IUserDoc>) ||
  mongoose.model<IUserDoc>('User', UserSchema);

export const ProfileMongoModel =
  (mongoose.models.Profile as mongoose.Model<IProfileDoc>) ||
  mongoose.model<IProfileDoc>('Profile', ProfileSchema);

export const SchemeMongoModel =
  (mongoose.models.Scheme as mongoose.Model<ISchemeDoc>) ||
  mongoose.model<ISchemeDoc>('Scheme', SchemeSchema);

export const CriteriaMongoModel =
  (mongoose.models.EligibilityCriteria as mongoose.Model<IEligibilityCriteriaDoc>) ||
  mongoose.model<IEligibilityCriteriaDoc>('EligibilityCriteria', EligibilityCriteriaSchema);

export const SavedSchemeMongoModel =
  (mongoose.models.SavedScheme as mongoose.Model<ISavedSchemeDoc>) ||
  mongoose.model<ISavedSchemeDoc>('SavedScheme', SavedSchemeSchema);

export const ApplicationMongoModel =
  (mongoose.models.Application as mongoose.Model<IApplicationDoc>) ||
  mongoose.model<IApplicationDoc>('Application', ApplicationSchema);

// ---------- Local Dev In-Memory Store (used ONLY when MONGODB_URI is empty & NODE_ENV !== 'production') ----------

export const inMemoryDB = {
  users: new Map<string, IUser>(),
  profiles: new Map<string, IProfile>(),
  schemes: new Map<string, IScheme>(),
  criteria: new Map<string, IEligibilityCriteria>(),
  savedSchemes: new Map<string, ISavedScheme>(),
  applications: new Map<string, IApplication>(),
};

let idCounter = 1000;
export function generateId(): string {
  idCounter += 1;
  return `id_${Date.now()}_${idCounter}`;
}

export function toSlug(input: string): string {
  const cleaned = String(input || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return cleaned || `scheme-${Date.now()}`;
}

function useMongo(): boolean {
  if (isMongoConnected()) {
    return true;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new DatabaseUnavailableError(
      'Database connection is not active in production.'
    );
  }
  return false;
}

function normalizeDoc<T extends { _id: any }>(doc: any): T {
  return {
    ...doc,
    _id: String(doc._id),
  } as T;
}

const CARD_PROJECTION = {
  slug: 1,
  title: 1,
  shortDescription: 1,
  category: 1,
  level: 1,
  state: 1,
  benefits: 1,
  documentsRequired: 1,
  applyUrl: 1,
  sourceUrl: 1,
  isActive: 1,
  verified: 1,
  lastVerified: 1,
  isSample: 1,
  translations: 1,
  createdAt: 1,
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMongoSchemeFilter(filter: any = {}): Record<string, any> {
  const query: Record<string, any> = {};
  if (filter.includeInactive !== true) {
    query.isActive = { $ne: false };
  }
  if (filter.category) {
    query.category = filter.category;
  }
  if (filter.level && filter.level !== 'All') {
    query.level = filter.level;
  }
  if (filter.state && filter.state !== 'All') {
    query.$or = [{ state: filter.state }, { state: 'All' }];
  }
  if (filter.q && String(filter.q).trim()) {
    const regex = new RegExp(escapeRegex(String(filter.q).trim()), 'i');
    const searchClause = [
      { title: regex },
      { shortDescription: regex },
      { category: regex },
      { 'translations.kn.title': regex },
      { 'translations.hi.title': regex },
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: searchClause }];
      delete query.$or;
    } else {
      query.$or = searchClause;
    }
  }
  return query;
}

function filterMemorySchemes(list: IScheme[], filter: any = {}): IScheme[] {
  let result = list;
  if (filter.includeInactive !== true) {
    result = result.filter((s) => s.isActive !== false);
  }
  if (filter.category) {
    result = result.filter((s) => s.category === filter.category);
  }
  if (filter.level && filter.level !== 'All') {
    result = result.filter((s) => s.level === filter.level);
  }
  if (filter.state && filter.state !== 'All') {
    result = result.filter((s) => s.state === filter.state || s.state === 'All');
  }
  if (filter.q && String(filter.q).trim()) {
    const q = String(filter.q).toLowerCase().trim();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.translations?.kn?.title && s.translations.kn.title.toLowerCase().includes(q)) ||
        (s.translations?.hi?.title && s.translations.hi.title.toLowerCase().includes(q))
    );
  }
  return result;
}

// ---------- Idempotent Seed Helper (called ONLY by `npm run seed` CLI or tests) ----------

export function loadCanonicalSeedFile(): any[] {
  const canonicalPath = path.resolve(process.cwd(), 'server/src/seed/schemes.json');
  const fallbackPath = path.resolve(process.cwd(), 'server/seed/schemes.json');
  const target = fs.existsSync(canonicalPath) ? canonicalPath : fallbackPath;
  if (!fs.existsSync(target)) {
    throw new Error(`Seed file not found at ${canonicalPath}`);
  }
  const raw = fs.readFileSync(target, 'utf-8');
  return JSON.parse(raw);
}

export interface UpsertSeedSummary {
  schemesUpserted: number;
  criteriaUpserted: number;
  demoAccountsInserted: number;
}

/**
 * Idempotent upsert-by-slug seed routine.
 * - Never deletes user data or non-seed schemes.
 * - Upserts schemes by unique `slug` ($set).
 * - Upserts criteria by `schemeId` ($set).
 * - Upserts demo/admin accounts with $setOnInsert ONLY if missing.
 */
export async function upsertSeedData(
  seedItems?: any[]
): Promise<UpsertSeedSummary> {
  const items = seedItems || loadCanonicalSeedFile();
  let schemesUpserted = 0;
  let criteriaUpserted = 0;
  let demoAccountsInserted = 0;

  if (isMongoConnected()) {
    const normalizedItems = items.map((item) => {
      const slug = (item.slug || item.id || toSlug(item.title)).toLowerCase().trim();
      const verified = Boolean(item.verified);
      const lastVerified = verified && item.lastVerified ? new Date(item.lastVerified) : null;
      return { item, slug, verified, lastVerified };
    });

    if (normalizedItems.length > 0) {
      await SchemeMongoModel.bulkWrite(
        normalizedItems.map(({ item, slug, verified, lastVerified }) => ({
          updateOne: {
            filter: { slug },
            update: {
              $set: {
                slug,
                title: item.title,
                shortDescription: item.shortDescription,
                category: item.category,
                level: item.level,
                state: item.state || 'All',
                benefits: item.benefits || [],
                documentsRequired: item.documentsRequired || [],
                applyUrl: item.applyUrl || 'https://www.myscheme.gov.in/',
                sourceUrl: item.sourceUrl || 'https://www.myscheme.gov.in/',
                isActive: item.isActive !== false,
                verified,
                lastVerified,
                isSample: Boolean(item.isSample),
                translations: item.translations || {},
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
            },
            upsert: true,
          },
        })),
        { ordered: false }
      );
      schemesUpserted = normalizedItems.length;

      const slugs = normalizedItems.map((x) => x.slug);
      const schemeDocs = await SchemeMongoModel.find(
        { slug: { $in: slugs } },
        { _id: 1, slug: 1 }
      ).lean();
      const idBySlug = new Map<string, string>();
      for (const d of schemeDocs) {
        idBySlug.set(d.slug, String(d._id));
      }

      const criteriaOps = normalizedItems
        .filter(({ item, slug }) => Array.isArray(item.rules) && idBySlug.has(slug))
        .map(({ item, slug }) => {
          const schemeId = idBySlug.get(slug)!;
          return {
            updateOne: {
              filter: { schemeId },
              update: {
                $set: {
                  schemeId,
                  rules: item.rules,
                },
              },
              upsert: true,
            },
          };
        });

      if (criteriaOps.length > 0) {
        await CriteriaMongoModel.bulkWrite(criteriaOps, { ordered: false });
        criteriaUpserted = criteriaOps.length;
      }
    }

    // Seed demo/admin users ONLY if missing ($setOnInsert — preserves existing accounts)
    const adminExists = await UserMongoModel.findOne({ email: 'admin@schemesaathi.test' }).lean();
    if (!adminExists) {
      const adminHash = await bcrypt.hash('Admin@123', 10);
      await UserMongoModel.updateOne(
        { email: 'admin@schemesaathi.test' },
        {
          $setOnInsert: {
            name: 'Administrator',
            email: 'admin@schemesaathi.test',
            passwordHash: adminHash,
            role: 'admin',
            preferredLanguage: 'en',
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      demoAccountsInserted += 1;
    }

    let demoUser = await UserMongoModel.findOne({ email: 'demo@schemesaathi.test' }).lean();
    let demoCreated = false;
    if (!demoUser) {
      const demoHash = await bcrypt.hash('Demo@123', 10);
      demoUser = await UserMongoModel.findOneAndUpdate(
        { email: 'demo@schemesaathi.test' },
        {
          $setOnInsert: {
            name: 'Ramesh Kumar',
            email: 'demo@schemesaathi.test',
            passwordHash: demoHash,
            role: 'user',
            preferredLanguage: 'en',
            createdAt: new Date(),
          },
        },
        { upsert: true, new: true }
      ).lean();
      demoAccountsInserted += 1;
      demoCreated = true;
    }

    if (demoUser) {
      const demoUserId = String(demoUser._id);
      await ProfileMongoModel.updateOne(
        { userId: demoUserId },
        {
          $setOnInsert: {
            userId: demoUserId,
            age: 62,
            incomeRange: 'low',
            state: 'Karnataka',
            category: ['senior_citizen'],
            occupation: '',
            familySize: 3,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      if (demoCreated) {
        const starterSlugs = ['kar-006-sandhya-suraksha-yojana', 'kar-002-gruha-jyothi-scheme'];
        const starterSchemes = await SchemeMongoModel.find(
          { slug: { $in: starterSlugs } },
          { _id: 1 }
        ).lean();
        for (const s of starterSchemes) {
          await SavedSchemeMongoModel.updateOne(
            { userId: demoUserId, schemeId: String(s._id) },
            {
              $setOnInsert: {
                userId: demoUserId,
                schemeId: String(s._id),
                savedAt: new Date(),
              },
            },
            { upsert: true }
          );
        }
      }
    }

    return { schemesUpserted, criteriaUpserted, demoAccountsInserted };
  }

  // Dev in-memory idempotent upsert by slug
  const existingBySlug = new Map<string, IScheme>();
  for (const s of inMemoryDB.schemes.values()) {
    existingBySlug.set(s.slug, s);
  }

  for (const item of items) {
    const slug = (item.slug || item.id || toSlug(item.title)).toLowerCase().trim();
    const existing = existingBySlug.get(slug);
    const schemeId = existing?._id || item.id || item._id || generateId();
    const verified = Boolean(item.verified);

    const scheme: IScheme = {
      _id: schemeId,
      slug,
      title: item.title,
      shortDescription: item.shortDescription,
      category: item.category,
      level: item.level,
      state: item.state || 'All',
      benefits: item.benefits || [],
      documentsRequired: item.documentsRequired || [],
      applyUrl: item.applyUrl || 'https://www.myscheme.gov.in/',
      sourceUrl: item.sourceUrl || 'https://www.myscheme.gov.in/',
      isActive: item.isActive !== false,
      verified,
      lastVerified: verified && item.lastVerified ? new Date(item.lastVerified) : null,
      isSample: Boolean(item.isSample),
      translations: item.translations || {},
      createdAt: existing?.createdAt || new Date(),
    };
    inMemoryDB.schemes.set(schemeId, scheme);
    schemesUpserted += 1;

    if (Array.isArray(item.rules)) {
      inMemoryDB.criteria.set(schemeId, {
        _id: inMemoryDB.criteria.get(schemeId)?._id || generateId(),
        schemeId,
        rules: item.rules,
      });
      criteriaUpserted += 1;
    }
  }

  if (!Array.from(inMemoryDB.users.values()).some((u) => u.email === 'admin@schemesaathi.test')) {
    const adminHash = await bcrypt.hash('Admin@123', 10);
    inMemoryDB.users.set('user_admin', {
      _id: 'user_admin',
      name: 'Administrator',
      email: 'admin@schemesaathi.test',
      passwordHash: adminHash,
      role: 'admin',
      preferredLanguage: 'en',
      createdAt: new Date(),
    });
    demoAccountsInserted += 1;
  }

  if (!Array.from(inMemoryDB.users.values()).some((u) => u.email === 'demo@schemesaathi.test')) {
    const demoHash = await bcrypt.hash('Demo@123', 10);
    inMemoryDB.users.set('user_demo', {
      _id: 'user_demo',
      name: 'Ramesh Kumar',
      email: 'demo@schemesaathi.test',
      passwordHash: demoHash,
      role: 'user',
      preferredLanguage: 'en',
      createdAt: new Date(),
    });
    if (!inMemoryDB.profiles.has('user_demo')) {
      inMemoryDB.profiles.set('user_demo', {
        _id: 'profile_demo',
        userId: 'user_demo',
        age: 62,
        incomeRange: 'low',
        state: 'Karnataka',
        category: ['senior_citizen'],
        occupation: '',
        familySize: 3,
        updatedAt: new Date(),
      });
    }
    demoAccountsInserted += 1;
  }

  return { schemesUpserted, criteriaUpserted, demoAccountsInserted };
}

// ---------- Model Adapters (Real MongoDB first; memory only in dev when MONGODB_URI is empty) ----------

export const UserModel = {
  async findOne(query: { email?: string; _id?: string }): Promise<IUser | null> {
    if (useMongo()) {
      const mongoQuery: Record<string, any> = {};
      if (query.email) mongoQuery.email = query.email.trim().toLowerCase();
      if (query._id) {
        if (!mongoose.isValidObjectId(query._id)) return null;
        mongoQuery._id = query._id;
      }
      const doc = await UserMongoModel.findOne(mongoQuery).lean();
      return doc ? normalizeDoc<IUser>(doc) : null;
    }

    for (const u of inMemoryDB.users.values()) {
      if (query.email && u.email.toLowerCase() === query.email.toLowerCase()) return { ...u };
      if (query._id && u._id === query._id) return { ...u };
    }
    return null;
  },

  async findById(id: string): Promise<IUser | null> {
    if (useMongo()) {
      if (!mongoose.isValidObjectId(id)) return null;
      const doc = await UserMongoModel.findById(id).lean();
      return doc ? normalizeDoc<IUser>(doc) : null;
    }

    const u = inMemoryDB.users.get(id);
    return u ? { ...u } : null;
  },

  async create(data: Partial<IUser>): Promise<IUser> {
    if (useMongo()) {
      const created = await UserMongoModel.create({
        name: data.name || '',
        email: (data.email || '').trim().toLowerCase(),
        passwordHash: data.passwordHash || '',
        role: data.role || 'user',
        preferredLanguage: data.preferredLanguage || 'en',
        createdAt: new Date(),
      });
      return normalizeDoc<IUser>(created.toObject());
    }

    const _id = data._id || generateId();
    const newUser: IUser = {
      _id,
      name: data.name || '',
      email: (data.email || '').trim().toLowerCase(),
      passwordHash: data.passwordHash || '',
      role: data.role || 'user',
      preferredLanguage: data.preferredLanguage || 'en',
      createdAt: new Date(),
    };
    inMemoryDB.users.set(_id, newUser);
    return { ...newUser };
  },

  async updateOne(query: { _id: string }, update: Partial<IUser>): Promise<void> {
    if (useMongo()) {
      if (!mongoose.isValidObjectId(query._id)) return;
      await UserMongoModel.updateOne({ _id: query._id }, { $set: update });
      return;
    }

    const u = inMemoryDB.users.get(query._id);
    if (u) {
      Object.assign(u, update);
    }
  },

  async findAll(): Promise<Omit<IUser, 'passwordHash'>[]> {
    if (useMongo()) {
      const docs = await UserMongoModel.find({}, { passwordHash: 0 })
        .sort({ createdAt: -1 })
        .lean();
      return docs.map((d) => normalizeDoc<Omit<IUser, 'passwordHash'>>(d));
    }

    return Array.from(inMemoryDB.users.values())
      .map(({ passwordHash: _pw, ...publicUser }) => ({ ...publicUser }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async countDocuments(): Promise<number> {
    if (useMongo()) {
      return UserMongoModel.countDocuments();
    }
    return inMemoryDB.users.size;
  },

  async deleteById(id: string): Promise<boolean> {
    if (useMongo()) {
      if (!mongoose.isValidObjectId(id)) return false;
      const deleted = await UserMongoModel.findByIdAndDelete(id);
      if (!deleted) return false;
      const uid = String(deleted._id);
      await Promise.all([
        ProfileMongoModel.deleteOne({ userId: uid }),
        SavedSchemeMongoModel.deleteMany({ userId: uid }),
        ApplicationMongoModel.deleteMany({ userId: uid }),
      ]);
      return true;
    }

    const existed = inMemoryDB.users.delete(id);
    if (existed) {
      inMemoryDB.profiles.delete(id);
      for (const [key, item] of inMemoryDB.savedSchemes.entries()) {
        if (item.userId === id) inMemoryDB.savedSchemes.delete(key);
      }
      for (const [key, item] of inMemoryDB.applications.entries()) {
        if (item.userId === id) inMemoryDB.applications.delete(key);
      }
    }
    return existed;
  },
};

export const ProfileModel = {
  async findOne(query: { userId: string }): Promise<IProfile | null> {
    if (useMongo()) {
      const doc = await ProfileMongoModel.findOne({ userId: query.userId }).lean();
      return doc ? normalizeDoc<IProfile>(doc) : null;
    }

    const p = inMemoryDB.profiles.get(query.userId);
    return p ? { ...p } : null;
  },

  async findOneAndUpdate(
    query: { userId: string },
    update: Partial<IProfile>,
    _opts?: any
  ): Promise<IProfile> {
    if (useMongo()) {
      const doc = await ProfileMongoModel.findOneAndUpdate(
        { userId: query.userId },
        {
          $set: {
            ...update,
            userId: query.userId,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      ).lean();
      return normalizeDoc<IProfile>(doc);
    }

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

export const SchemeModel = {
  async find(filter: any = {}): Promise<IScheme[]> {
    if (useMongo()) {
      const query = buildMongoSchemeFilter(filter);
      const docs = await SchemeMongoModel.find(query, CARD_PROJECTION)
        .sort({ level: -1, createdAt: -1 })
        .lean();
      return docs.map((d) => normalizeDoc<IScheme>(d));
    }

    const all = Array.from(inMemoryDB.schemes.values());
    return filterMemorySchemes(all, filter).map((s) => ({ ...s }));
  },

  async findPaginated(options: {
    filter?: any;
    page?: number;
    limit?: number;
  }): Promise<{
    schemes: IScheme[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 12));

    if (useMongo()) {
      const query = buildMongoSchemeFilter(options.filter);
      const [docs, total] = await Promise.all([
        SchemeMongoModel.find(query, CARD_PROJECTION)
          .sort({ level: -1, createdAt: 1, title: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        SchemeMongoModel.countDocuments(query),
      ]);
      return {
        schemes: docs.map((d) => normalizeDoc<IScheme>(d)),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        limit,
      };
    }

    const all = filterMemorySchemes(Array.from(inMemoryDB.schemes.values()), options.filter);
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    return {
      schemes: all.slice(start, start + limit).map((s) => ({ ...s })),
      total,
      page,
      totalPages,
      limit,
    };
  },

  async findActiveForMatching(): Promise<IScheme[]> {
    if (useMongo()) {
      const docs = await SchemeMongoModel.find({ isActive: { $ne: false } }, CARD_PROJECTION)
        .lean();
      return docs.map((d) => normalizeDoc<IScheme>(d));
    }

    return Array.from(inMemoryDB.schemes.values())
      .filter((s) => s.isActive !== false)
      .map((s) => ({ ...s }));
  },

  async findByIds(ids: string[]): Promise<IScheme[]> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return [];

    if (useMongo()) {
      const objectIds = uniqueIds.filter((id) => mongoose.isValidObjectId(id));
      const docs = await SchemeMongoModel.find(
        {
          $or: [
            ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
            { slug: { $in: uniqueIds.map((x) => x.toLowerCase()) } },
          ],
        },
        CARD_PROJECTION
      ).lean();
      return docs.map((d) => normalizeDoc<IScheme>(d));
    }

    const found: IScheme[] = [];
    for (const id of uniqueIds) {
      const direct = inMemoryDB.schemes.get(id);
      if (direct) {
        found.push({ ...direct });
        continue;
      }
      for (const s of inMemoryDB.schemes.values()) {
        if (s.slug === id.toLowerCase()) {
          found.push({ ...s });
          break;
        }
      }
    }
    return found;
  },

  async findById(id: string): Promise<IScheme | null> {
    if (!id) return null;

    if (useMongo()) {
      const query = mongoose.isValidObjectId(id)
        ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
        : { slug: id.toLowerCase() };
      const doc = await SchemeMongoModel.findOne(query).lean();
      return doc ? normalizeDoc<IScheme>(doc) : null;
    }

    const s = inMemoryDB.schemes.get(id);
    if (s) return { ...s };
    for (const item of inMemoryDB.schemes.values()) {
      if (item.slug === id.toLowerCase()) return { ...item };
    }
    return null;
  },

  async countDocuments(filter: any = {}): Promise<number> {
    if (useMongo()) {
      const query = buildMongoSchemeFilter(filter);
      return SchemeMongoModel.countDocuments(query);
    }
    return filterMemorySchemes(Array.from(inMemoryDB.schemes.values()), filter).length;
  },

  async countVerified(): Promise<number> {
    if (useMongo()) {
      return SchemeMongoModel.countDocuments({ isActive: { $ne: false }, verified: true });
    }
    return Array.from(inMemoryDB.schemes.values()).filter(
      (s) => s.isActive !== false && s.verified === true
    ).length;
  },

  async create(data: Partial<IScheme>): Promise<IScheme> {
    const slug = (data.slug || toSlug(data.title || '')).toLowerCase().trim();
    const verified = Boolean(data.verified);
    const lastVerified = verified ? (data.lastVerified ? new Date(data.lastVerified) : new Date()) : null;

    if (useMongo()) {
      const created = await SchemeMongoModel.create({
        slug,
        title: data.title || '',
        shortDescription: data.shortDescription || '',
        category: data.category || 'employment',
        level: data.level || 'central',
        state: data.state || 'All',
        benefits: data.benefits || [],
        documentsRequired: data.documentsRequired || [],
        applyUrl: data.applyUrl || 'https://www.myscheme.gov.in/',
        sourceUrl: data.sourceUrl || 'https://www.myscheme.gov.in/',
        isActive: data.isActive !== false,
        verified,
        lastVerified,
        isSample: Boolean(data.isSample),
        translations: data.translations || {},
        createdAt: new Date(),
      });
      return normalizeDoc<IScheme>(created.toObject());
    }

    const _id = data._id || generateId();
    const newScheme: IScheme = {
      _id,
      slug,
      title: data.title || '',
      shortDescription: data.shortDescription || '',
      category: (data.category as SchemeCategory) || 'employment',
      level: data.level || 'central',
      state: data.state || 'All',
      benefits: data.benefits || [],
      documentsRequired: data.documentsRequired || [],
      applyUrl: data.applyUrl || 'https://www.myscheme.gov.in/',
      sourceUrl: data.sourceUrl || 'https://www.myscheme.gov.in/',
      isActive: data.isActive !== false,
      verified,
      lastVerified,
      isSample: Boolean(data.isSample),
      translations: data.translations || {},
      createdAt: new Date(),
    };
    inMemoryDB.schemes.set(_id, newScheme);
    return { ...newScheme };
  },

  async findByIdAndUpdate(
    id: string,
    data: Partial<IScheme>,
    _opts?: any
  ): Promise<IScheme | null> {
    if (useMongo()) {
      const query = mongoose.isValidObjectId(id)
        ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
        : { slug: id.toLowerCase() };
      const doc = await SchemeMongoModel.findOneAndUpdate(
        query,
        { $set: data },
        { new: true }
      ).lean();
      return doc ? normalizeDoc<IScheme>(doc) : null;
    }

    const existing = await this.findById(id);
    if (!existing) return null;
    const stored = inMemoryDB.schemes.get(existing._id);
    if (!stored) return null;
    Object.assign(stored, data);
    return { ...stored };
  },

  async findByIdAndDelete(id: string): Promise<boolean> {
    if (useMongo()) {
      const existing = await this.findById(id);
      if (!existing) return false;
      const deleted = await SchemeMongoModel.findByIdAndDelete(existing._id);
      if (deleted) {
        await CriteriaMongoModel.deleteOne({ schemeId: existing._id });
      }
      return Boolean(deleted);
    }

    const existing = await this.findById(id);
    if (!existing) return false;
    inMemoryDB.criteria.delete(existing._id);
    return inMemoryDB.schemes.delete(existing._id);
  },
};

export const CriteriaModel = {
  async findOne(query: { schemeId: string }): Promise<IEligibilityCriteria | null> {
    if (useMongo()) {
      const doc = await CriteriaMongoModel.findOne({ schemeId: query.schemeId }).lean();
      return doc ? normalizeDoc<IEligibilityCriteria>(doc) : null;
    }
    const c = inMemoryDB.criteria.get(query.schemeId);
    return c ? { ...c } : null;
  },

  async find(): Promise<IEligibilityCriteria[]> {
    if (useMongo()) {
      const docs = await CriteriaMongoModel.find().lean();
      return docs.map((d) => normalizeDoc<IEligibilityCriteria>(d));
    }
    return Array.from(inMemoryDB.criteria.values()).map((c) => ({ ...c }));
  },

  async findBySchemeIds(schemeIds: string[]): Promise<IEligibilityCriteria[]> {
    const unique = Array.from(new Set(schemeIds.filter(Boolean)));
    if (unique.length === 0) return [];

    if (useMongo()) {
      const docs = await CriteriaMongoModel.find({ schemeId: { $in: unique } }).lean();
      return docs.map((d) => normalizeDoc<IEligibilityCriteria>(d));
    }

    const result: IEligibilityCriteria[] = [];
    for (const id of unique) {
      const c = inMemoryDB.criteria.get(id);
      if (c) result.push({ ...c });
    }
    return result;
  },

  async findOneAndUpdate(
    query: { schemeId: string },
    update: { rules: ICriteriaRule[] },
    _opts?: any
  ): Promise<IEligibilityCriteria> {
    if (useMongo()) {
      const doc = await CriteriaMongoModel.findOneAndUpdate(
        { schemeId: query.schemeId },
        { $set: { schemeId: query.schemeId, rules: update.rules || [] } },
        { upsert: true, new: true }
      ).lean();
      return normalizeDoc<IEligibilityCriteria>(doc);
    }

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
    if (useMongo()) {
      await CriteriaMongoModel.deleteOne({ schemeId: query.schemeId });
      return;
    }
    inMemoryDB.criteria.delete(query.schemeId);
  },
};

export const SavedSchemeModel = {
  async findOne(query: { userId: string; schemeId: string }): Promise<ISavedScheme | null> {
    if (useMongo()) {
      const doc = await SavedSchemeMongoModel.findOne({
        userId: query.userId,
        schemeId: query.schemeId,
      }).lean();
      return doc ? normalizeDoc<ISavedScheme>(doc) : null;
    }

    const key = `${query.userId}_${query.schemeId}`;
    const s = inMemoryDB.savedSchemes.get(key);
    return s ? { ...s } : null;
  },

  async find(query: { userId: string }): Promise<ISavedScheme[]> {
    if (useMongo()) {
      const docs = await SavedSchemeMongoModel.find({ userId: query.userId })
        .sort({ savedAt: -1 })
        .lean();
      return docs.map((d) => normalizeDoc<ISavedScheme>(d));
    }

    const list: ISavedScheme[] = [];
    for (const item of inMemoryDB.savedSchemes.values()) {
      if (item.userId === query.userId) {
        list.push({ ...item });
      }
    }
    list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    return list;
  },

  async create(data: { userId: string; schemeId: string }): Promise<ISavedScheme> {
    if (useMongo()) {
      const doc = await SavedSchemeMongoModel.findOneAndUpdate(
        { userId: data.userId, schemeId: data.schemeId },
        { $setOnInsert: { userId: data.userId, schemeId: data.schemeId, savedAt: new Date() } },
        { upsert: true, new: true }
      ).lean();
      return normalizeDoc<ISavedScheme>(doc);
    }

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
    if (useMongo()) {
      const res = await SavedSchemeMongoModel.deleteOne({
        userId: query.userId,
        schemeId: query.schemeId,
      });
      return (res.deletedCount || 0) > 0;
    }

    const key = `${query.userId}_${query.schemeId}`;
    return inMemoryDB.savedSchemes.delete(key);
  },

  async countDocuments(query: { userId: string }): Promise<number> {
    if (useMongo()) {
      return SavedSchemeMongoModel.countDocuments({ userId: query.userId });
    }

    let count = 0;
    for (const item of inMemoryDB.savedSchemes.values()) {
      if (item.userId === query.userId) count++;
    }
    return count;
  },
};

export const ApplicationModel = {
  async create(data: {
    userId: string;
    schemeId: string;
    status?: 'clicked' | 'applied' | 'not_applied';
  }): Promise<IApplication> {
    if (useMongo()) {
      const doc = await ApplicationMongoModel.create({
        userId: data.userId,
        schemeId: data.schemeId,
        linkClickedAt: new Date(),
        status: data.status || 'clicked',
      });
      return normalizeDoc<IApplication>(doc.toObject());
    }

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
    if (useMongo()) {
      const doc = await ApplicationMongoModel.findOneAndUpdate(
        { userId: query.userId, schemeId: query.schemeId },
        {
          $set: { status: update.status },
          $setOnInsert: { linkClickedAt: new Date(), userId: query.userId, schemeId: query.schemeId },
        },
        { upsert: true, new: true }
      ).lean();
      return doc ? normalizeDoc<IApplication>(doc) : null;
    }

    for (const app of inMemoryDB.applications.values()) {
      if (app.userId === query.userId && app.schemeId === query.schemeId) {
        app.status = update.status;
        return { ...app };
      }
    }
    return this.create({ userId: query.userId, schemeId: query.schemeId, status: update.status });
  },

  async countDocuments(query: { userId?: string } = {}): Promise<number> {
    if (useMongo()) {
      return ApplicationMongoModel.countDocuments(query.userId ? { userId: query.userId } : {});
    }

    let count = 0;
    for (const app of inMemoryDB.applications.values()) {
      if (!query.userId || app.userId === query.userId) {
        count++;
      }
    }
    return count;
  },
};

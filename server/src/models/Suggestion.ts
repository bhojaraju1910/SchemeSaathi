import mongoose, { Schema, Document } from 'mongoose';
import {
  SanitizedSuggestion,
  SuggestionStatus,
  SuggestionType,
} from '../utils/suggestionValidation';

export interface ISuggestion {
  _id: string;
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
  status: SuggestionStatus;
  createdAt: Date;
}

export interface ISuggestionDocument extends Document {
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
  status: SuggestionStatus;
  createdAt: Date;
}

const SuggestionSchema = new Schema<ISuggestionDocument>({
  type: {
    type: String,
    enum: ['scheme', 'feature', 'other'],
    required: true,
  },
  title: { type: String, trim: true, maxlength: 100, default: '' },
  details: { type: String, trim: true, maxlength: 1000, default: '' },
  schemeName: { type: String, trim: true, maxlength: 100, default: '' },
  schemeState: { type: String, trim: true, maxlength: 80, default: '' },
  schemeLink: { type: String, trim: true, maxlength: 500, default: '' },
  targetGroup: { type: String, trim: true, maxlength: 200, default: '' },
  name: { type: String, trim: true, maxlength: 100, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 150, default: '' },
  userId: { type: String, required: false },
  status: {
    type: String,
    enum: ['new', 'planned', 'done', 'rejected'],
    default: 'new',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Suggestion =
  (mongoose.models.Suggestion as mongoose.Model<ISuggestionDocument>) ||
  mongoose.model<ISuggestionDocument>('Suggestion', SuggestionSchema);

// In-memory store matching existing SchemeSaathi pattern when MONGODB_URI is unset
const inMemorySuggestions = new Map<string, ISuggestion>();
let suggestionCounter = 100;

function nextSuggestionId(): string {
  suggestionCounter += 1;
  return `sug_${Date.now()}_${suggestionCounter}`;
}

function isMongooseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export const SuggestionModel = {
  async create(data: SanitizedSuggestion): Promise<ISuggestion> {
    if (isMongooseConnected()) {
      const created = await Suggestion.create({
        ...data,
        status: 'new',
        createdAt: new Date(),
      });
      return {
        _id: String(created._id),
        type: created.type,
        title: created.title,
        details: created.details,
        schemeName: created.schemeName,
        schemeState: created.schemeState,
        schemeLink: created.schemeLink,
        targetGroup: created.targetGroup,
        name: created.name,
        email: created.email,
        userId: created.userId,
        status: created.status,
        createdAt: created.createdAt,
      };
    }

    const item: ISuggestion = {
      _id: nextSuggestionId(),
      type: data.type,
      title: data.title,
      details: data.details,
      schemeName: data.schemeName,
      schemeState: data.schemeState,
      schemeLink: data.schemeLink,
      targetGroup: data.targetGroup,
      name: data.name,
      email: data.email,
      userId: data.userId,
      status: 'new',
      createdAt: new Date(),
    };
    inMemorySuggestions.set(item._id, item);
    return { ...item };
  },

  async findPaginated(options: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    suggestions: ISuggestion[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const filter: Record<string, string> = {};
    if (options.type && ['scheme', 'feature', 'other'].includes(options.type)) {
      filter.type = options.type;
    }
    if (options.status && ['new', 'planned', 'done', 'rejected'].includes(options.status)) {
      filter.status = options.status;
    }

    if (isMongooseConnected()) {
      const [docs, total] = await Promise.all([
        Suggestion.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Suggestion.countDocuments(filter),
      ]);
      const suggestions: ISuggestion[] = docs.map((d: any) => ({
        _id: String(d._id),
        type: d.type,
        title: d.title || '',
        details: d.details || '',
        schemeName: d.schemeName || '',
        schemeState: d.schemeState || '',
        schemeLink: d.schemeLink || '',
        targetGroup: d.targetGroup || '',
        name: d.name || '',
        email: d.email || '',
        userId: d.userId,
        status: d.status || 'new',
        createdAt: d.createdAt,
      }));
      return {
        suggestions,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    let list = Array.from(inMemorySuggestions.values());
    if (filter.type) {
      list = list.filter((s) => s.type === filter.type);
    }
    if (filter.status) {
      list = list.filter((s) => s.status === filter.status);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const suggestions = list.slice(start, start + limit).map((s) => ({ ...s }));
    return { suggestions, total, page, totalPages };
  },

  async updateStatus(id: string, status: SuggestionStatus): Promise<ISuggestion | null> {
    if (isMongooseConnected()) {
      const updated = await Suggestion.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).lean();
      if (!updated) return null;
      return {
        _id: String(updated._id),
        type: updated.type,
        title: updated.title || '',
        details: updated.details || '',
        schemeName: updated.schemeName || '',
        schemeState: updated.schemeState || '',
        schemeLink: updated.schemeLink || '',
        targetGroup: updated.targetGroup || '',
        name: updated.name || '',
        email: updated.email || '',
        userId: updated.userId,
        status: updated.status,
        createdAt: updated.createdAt,
      };
    }

    const existing = inMemorySuggestions.get(id);
    if (!existing) return null;
    existing.status = status;
    return { ...existing };
  },

  async deleteById(id: string): Promise<boolean> {
    if (isMongooseConnected()) {
      const deleted = await Suggestion.findByIdAndDelete(id);
      return Boolean(deleted);
    }
    return inMemorySuggestions.delete(id);
  },
};

import { Router, Request, Response } from 'express';
import { SchemeModel, CriteriaModel, ProfileModel } from '../models/index';
import { auth, AuthRequest } from '../middleware/auth';
import { matchSchemes } from '../services/eligibilityEngine';
import {
  getCachedActiveSchemesWithRules,
  getCachedCatalogMeta,
} from '../services/schemeCache';

const router = Router();

const PUBLIC_CACHE_HEADER = 'no-store';

// Public list with server-side pagination, projection, and search
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, category, state, level, page = '1', limit = '12' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit as string, 10) || 12));

    const filter: any = {};
    if (q) filter.q = q;
    if (category) filter.category = category;
    if (state && state !== 'All') filter.state = state;
    if (level && level !== 'All') filter.level = level;

    const result = await SchemeModel.findPaginated({
      filter,
      page: pageNum,
      limit: limitNum,
    });

    res.set('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to fetch schemes' });
  }
});

// Lightweight cached category & level counts for Landing & filters
router.get('/meta', async (_req: Request, res: Response): Promise<void> => {
  try {
    const meta = await getCachedCatalogMeta();
    res.set('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json(meta);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to fetch scheme metadata' });
  }
});

// Lightweight cached active schemes + rules for instant client Quick Check & Live Preview
router.get('/quick-catalog', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await getCachedActiveSchemesWithRules();
    const compact = items.map(({ scheme, rules }) => ({
      _id: scheme._id,
      slug: scheme.slug,
      title: scheme.title,
      shortDescription: scheme.shortDescription,
      category: scheme.category,
      level: scheme.level,
      state: scheme.state,
      benefits: scheme.benefits,
      documentsRequired: scheme.documentsRequired,
      applyUrl: scheme.applyUrl,
      sourceUrl: scheme.sourceUrl,
      verified: Boolean(scheme.verified),
      lastVerified: scheme.lastVerified,
      isSample: Boolean(scheme.isSample),
      translations: scheme.translations,
      rules,
    }));
    res.set('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json({ schemes: compact, total: compact.length });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to load quick catalog' });
  }
});

// Single scheme details (by ObjectId or slug) with plain-language criteria
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheme = await SchemeModel.findById(req.params.id);
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    const criteria = await CriteriaModel.findOne({ schemeId: scheme._id });
    const rules = criteria ? criteria.rules : [];

    res.set('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json({
      scheme,
      criteria: {
        rules,
        plainLanguageSummary: rules.map((r) => r.label || `${r.field} ${r.op} ${r.value}`),
      },
    });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to fetch scheme details' });
  }
});

// Match schemes against user profile using 5-minute cached active catalog
router.post('/match', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const savedProfile = await ProfileModel.findOne({ userId: req.user!.id });
    const profile = {
      ...(savedProfile || {}),
      ...(req.body || {}),
    };

    const schemesWithRules = await getCachedActiveSchemesWithRules();
    const matchResults = matchSchemes(profile, schemesWithRules);

    res.status(200).json(matchResults);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to evaluate scheme matches' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { SchemeModel, CriteriaModel, ProfileModel } from '../models/index';
import { auth, AuthRequest } from '../middleware/auth';
import { matchSchemes, SchemeWithRules } from '../services/eligibilityEngine';

const router = Router();

// Public list with filters and search
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

    const allMatched = await SchemeModel.find(filter);
    const total = allMatched.length;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const startIndex = (pageNum - 1) * limitNum;
    const paginatedSchemes = allMatched.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      schemes: paginatedSchemes,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch schemes' });
  }
});

// Single scheme details with plain-language criteria
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const scheme = await SchemeModel.findById(req.params.id);
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    const criteria = await CriteriaModel.findOne({ schemeId: scheme._id });
    const rules = criteria ? criteria.rules : [];

    res.status(200).json({
      scheme,
      criteria: {
        rules,
        plainLanguageSummary: rules.map((r) => r.label || `${r.field} ${r.op} ${r.value}`),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch scheme details' });
  }
});

// Match schemes against user profile
router.post('/match', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Look up saved user profile, or merge with body override
    const savedProfile = await ProfileModel.findOne({ userId: req.user!.id });
    const profile = {
      ...(savedProfile || {}),
      ...(req.body || {}),
    };

    // Fetch all schemes
    const allSchemes = await SchemeModel.find();
    const allCriteria = await CriteriaModel.find();

    const criteriaMap = new Map<string, any[]>();
    for (const c of allCriteria) {
      criteriaMap.set(c.schemeId, c.rules);
    }

    const schemesWithRules: SchemeWithRules[] = allSchemes.map((s) => ({
      scheme: s,
      rules: criteriaMap.get(s._id) || [],
    }));

    const matchResults = matchSchemes(profile, schemesWithRules);

    res.status(200).json(matchResults);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to evaluate scheme matches' });
  }
});

export default router;

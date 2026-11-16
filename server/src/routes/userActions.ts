import { Router, Response } from 'express';
import {
  SavedSchemeModel,
  SchemeModel,
  ApplicationModel,
  ProfileModel,
} from '../models/index';
import { auth, AuthRequest } from '../middleware/auth';
import { matchSchemes } from '../services/eligibilityEngine';
import { getCachedActiveSchemesWithRules } from '../services/schemeCache';

const router = Router();

// Save a scheme
router.post('/saved', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schemeId } = req.body;
    if (!schemeId) {
      res.status(400).json({ message: 'schemeId is required' });
      return;
    }

    const scheme = await SchemeModel.findById(schemeId);
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    const resolvedId = scheme._id;
    const existing = await SavedSchemeModel.findOne({
      userId: req.user!.id,
      schemeId: resolvedId,
    });

    if (existing) {
      res.status(200).json({ message: 'Scheme already saved', saved: existing });
      return;
    }

    const saved = await SavedSchemeModel.create({
      userId: req.user!.id,
      schemeId: resolvedId,
    });

    res.status(201).json({ message: 'Scheme saved successfully', saved });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to save scheme' });
  }
});

// Get user's saved schemes using single batch $in query (no N+1 loop)
router.get('/saved', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const savedRecords = await SavedSchemeModel.find({ userId: req.user!.id });
    if (savedRecords.length === 0) {
      res.status(200).json([]);
      return;
    }

    const schemes = await SchemeModel.findByIds(savedRecords.map((r) => r.schemeId));
    const schemeByKey = new Map<string, (typeof schemes)[number]>();
    for (const s of schemes) {
      schemeByKey.set(s._id, s);
      if (s.slug) schemeByKey.set(s.slug, s);
    }

    const schemeList = savedRecords
      .map((record) => {
        const scheme = schemeByKey.get(record.schemeId);
        if (!scheme) return null;
        return {
          ...record,
          scheme,
        };
      })
      .filter(Boolean);

    res.status(200).json(schemeList);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to fetch saved schemes' });
  }
});

// Remove saved scheme
router.delete('/saved/:schemeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schemeId } = req.params;
    await SavedSchemeModel.deleteOne({ userId: req.user!.id, schemeId });
    res.status(200).json({ message: 'Scheme removed from saved list' });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to remove saved scheme' });
  }
});

// Log link click
router.post('/applications/click', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schemeId, status = 'clicked' } = req.body;
    if (!schemeId) {
      res.status(400).json({ message: 'schemeId is required' });
      return;
    }

    const record = await ApplicationModel.create({
      userId: req.user!.id,
      schemeId,
      status: ['clicked', 'applied', 'not_applied'].includes(status) ? status : 'clicked',
    });

    res.status(200).json({ message: 'Application interaction recorded', record });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to record click' });
  }
});

// Update application status
router.post('/applications/status', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schemeId, status } = req.body;
    if (!schemeId || !status) {
      res.status(400).json({ message: 'schemeId and status are required' });
      return;
    }

    const record = await ApplicationModel.findOneAndUpdate(
      { userId: req.user!.id, schemeId },
      { status }
    );

    res.status(200).json({ message: 'Application status updated', record });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to update application status' });
  }
});

// Dashboard stats (uses cached active schemes + criteria)
router.get('/dashboard/stats', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [savedSchemes, applicationLinks, profile, schemesWithRules] = await Promise.all([
      SavedSchemeModel.countDocuments({ userId: req.user!.id }),
      ApplicationModel.countDocuments({ userId: req.user!.id }),
      ProfileModel.findOne({ userId: req.user!.id }),
      getCachedActiveSchemesWithRules(),
    ]);

    const availableSchemes = schemesWithRules.length;
    const matches = matchSchemes(profile, schemesWithRules);
    const potentialMatches = matches.length;

    res.status(200).json({
      availableSchemes,
      potentialMatches,
      savedSchemes,
      applicationLinks,
      topMatches: matches.slice(0, 3),
    });
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to fetch dashboard stats' });
  }
});

// Match schemes against user profile (uses cached active schemes + criteria)
router.post('/match', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [savedProfile, schemesWithRules] = await Promise.all([
      ProfileModel.findOne({ userId: req.user!.id }),
      getCachedActiveSchemesWithRules(),
    ]);

    const profile = {
      ...(savedProfile || {}),
      ...(req.body || {}),
    };

    const matchResults = matchSchemes(profile, schemesWithRules);
    res.status(200).json(matchResults);
  } catch (err: any) {
    res.status(err?.statusCode || 500).json({ message: err.message || 'Failed to evaluate scheme matches' });
  }
});

export default router;

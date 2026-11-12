import { Router, Response } from 'express';
import {
  SavedSchemeModel,
  SchemeModel,
  ApplicationModel,
  ProfileModel,
  CriteriaModel,
} from '../models/index';
import { auth, AuthRequest } from '../middleware/auth';
import { matchSchemes, SchemeWithRules } from '../services/eligibilityEngine';

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

    const existing = await SavedSchemeModel.findOne({
      userId: req.user!.id,
      schemeId,
    });

    if (existing) {
      res.status(200).json({ message: 'Scheme already saved', saved: existing });
      return;
    }

    const saved = await SavedSchemeModel.create({
      userId: req.user!.id,
      schemeId,
    });

    res.status(201).json({ message: 'Scheme saved successfully', saved });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to save scheme' });
  }
});

// Get user's saved schemes
router.get('/saved', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const savedRecords = await SavedSchemeModel.find({ userId: req.user!.id });
    const schemeList = [];

    for (const record of savedRecords) {
      const scheme = await SchemeModel.findById(record.schemeId);
      if (scheme) {
        schemeList.push({
          ...record,
          scheme,
        });
      }
    }

    res.status(200).json(schemeList);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch saved schemes' });
  }
});

// Remove saved scheme
router.delete('/saved/:schemeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schemeId } = req.params;
    await SavedSchemeModel.deleteOne({ userId: req.user!.id, schemeId });
    res.status(200).json({ message: 'Scheme removed from saved list' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to remove saved scheme' });
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
    res.status(500).json({ message: err.message || 'Failed to record click' });
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
    res.status(500).json({ message: err.message || 'Failed to update application status' });
  }
});

// Dashboard stats
router.get('/dashboard/stats', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const availableSchemes = await SchemeModel.countDocuments();
    const savedSchemes = await SavedSchemeModel.countDocuments({ userId: req.user!.id });
    const applicationLinks = await ApplicationModel.countDocuments({ userId: req.user!.id });

    // Calculate potential matches based on profile
    const profile = await ProfileModel.findOne({ userId: req.user!.id });
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
    res.status(500).json({ message: err.message || 'Failed to fetch dashboard stats' });
  }
});

// Match schemes against user profile
router.post('/match', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const savedProfile = await ProfileModel.findOne({ userId: req.user!.id });
    const profile = {
      ...(savedProfile || {}),
      ...(req.body || {}),
    };

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

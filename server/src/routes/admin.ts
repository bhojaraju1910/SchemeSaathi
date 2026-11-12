import { Router, Response } from 'express';
import { SchemeModel, CriteriaModel } from '../models/index';
import { auth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Protect all admin routes with JWT and admin role
router.use(auth);
router.use(requireRole('admin'));

// Get all schemes with their criteria for admin management
router.get('/schemes', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schemes = await SchemeModel.find();
    const criteria = await CriteriaModel.find();
    const criteriaMap = new Map<string, any[]>();
    for (const c of criteria) {
      criteriaMap.set(c.schemeId, c.rules);
    }

    const result = schemes.map((s) => ({
      ...s,
      rules: criteriaMap.get(s._id) || [],
    }));

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch admin schemes' });
  }
});

// Create new scheme
router.post('/schemes', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      shortDescription,
      category,
      level,
      state,
      benefits,
      documentsRequired,
      applyUrl,
      sourceUrl,
      rules,
      isSample = true,
      translations,
    } = req.body;

    if (!title || !shortDescription || !category) {
      res.status(400).json({ message: 'Title, short description, and category are required.' });
      return;
    }

    const scheme = await SchemeModel.create({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      category,
      level: level || 'central',
      state: state || 'All',
      benefits: Array.isArray(benefits) ? benefits : [benefits].filter(Boolean),
      documentsRequired: Array.isArray(documentsRequired) ? documentsRequired : [documentsRequired].filter(Boolean),
      applyUrl: applyUrl || 'https://www.myscheme.gov.in/',
      sourceUrl: sourceUrl || 'https://www.myscheme.gov.in/',
      lastVerified: new Date(),
      isSample: Boolean(isSample),
      translations: translations || {},
    });

    if (rules && Array.isArray(rules)) {
      await CriteriaModel.findOneAndUpdate(
        { schemeId: scheme._id },
        { rules },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ message: 'Scheme created successfully', scheme });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to create scheme' });
  }
});

// Update scheme
router.put('/schemes/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      shortDescription,
      category,
      level,
      state,
      benefits,
      documentsRequired,
      applyUrl,
      sourceUrl,
      isSample,
      translations,
      rules,
    } = req.body;

    const existing = await SchemeModel.findById(id);
    if (!existing) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    const updated = await SchemeModel.findByIdAndUpdate(
      id,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(shortDescription !== undefined && { shortDescription: shortDescription.trim() }),
        ...(category !== undefined && { category }),
        ...(level !== undefined && { level }),
        ...(state !== undefined && { state }),
        ...(benefits !== undefined && { benefits: Array.isArray(benefits) ? benefits : [benefits] }),
        ...(documentsRequired !== undefined && {
          documentsRequired: Array.isArray(documentsRequired) ? documentsRequired : [documentsRequired],
        }),
        ...(applyUrl !== undefined && { applyUrl }),
        ...(sourceUrl !== undefined && { sourceUrl }),
        ...(isSample !== undefined && { isSample: Boolean(isSample) }),
        ...(translations !== undefined && { translations }),
        lastVerified: new Date(),
      },
      { new: true }
    );

    // If rules are also provided, update criteria
    if (rules && Array.isArray(rules)) {
      await CriteriaModel.findOneAndUpdate(
        { schemeId: id },
        { rules },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: 'Scheme updated successfully', scheme: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update scheme' });
  }
});

// Delete scheme
router.delete('/schemes/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await SchemeModel.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    await CriteriaModel.deleteOne({ schemeId: id });

    res.status(200).json({ message: 'Scheme and associated criteria deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to delete scheme' });
  }
});

// Update criteria rules specifically for a scheme
router.put('/criteria/:schemeId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schemeId } = req.params;
    const { rules } = req.body;

    if (!Array.isArray(rules)) {
      res.status(400).json({ message: 'Rules must be an array of rule objects' });
      return;
    }

    const scheme = await SchemeModel.findById(schemeId);
    if (!scheme) {
      res.status(404).json({ message: 'Scheme not found' });
      return;
    }

    const updated = await CriteriaModel.findOneAndUpdate(
      { schemeId },
      { rules },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Eligibility criteria updated successfully', criteria: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update criteria' });
  }
});

export default router;

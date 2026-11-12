import { Router, Response } from 'express';
import { ProfileModel, UserModel } from '../models/index';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get profile of current user
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await ProfileModel.findOne({ userId: req.user!.id });
    if (!profile) {
      res.status(200).json({
        userId: req.user!.id,
        age: null,
        incomeRange: 'low',
        state: 'Karnataka',
        category: [],
        occupation: '',
        familySize: null,
      });
      return;
    }
    res.status(200).json(profile);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch profile' });
  }
});

// Create or update profile
router.put('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { age, incomeRange, state, category, occupation, familySize, preferredLanguage } = req.body;

    // Validate age
    let cleanAge: number | null = null;
    if (age !== undefined && age !== null && age !== '') {
      const parsedAge = Number(age);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
        res.status(400).json({ message: 'Age must be a valid number between 0 and 125.' });
        return;
      }
      cleanAge = parsedAge;
    }

    // Validate income range
    const validIncomeRanges = ['low', 'lower_middle', 'middle', 'high'];
    if (incomeRange && !validIncomeRanges.includes(incomeRange)) {
      res.status(400).json({ message: 'Invalid income range selected.' });
      return;
    }

    // Validate categories
    const validCategories = ['senior_citizen', 'student', 'woman', 'farmer', 'disabled', 'child', 'general'];
    let cleanCategories: string[] = [];
    if (Array.isArray(category)) {
      cleanCategories = category.filter((c) => validCategories.includes(c));
    }

    // Clean familySize
    let cleanFamilySize: number | undefined = undefined;
    if (familySize !== undefined && familySize !== null && familySize !== '') {
      const parsedFS = Number(familySize);
      if (!isNaN(parsedFS) && parsedFS > 0 && parsedFS <= 50) {
        cleanFamilySize = parsedFS;
      }
    }

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: req.user!.id },
      {
        userId: req.user!.id,
        age: cleanAge,
        incomeRange: incomeRange || 'low',
        state: state ? String(state).trim() : 'Karnataka',
        category: cleanCategories as any,
        occupation: occupation ? String(occupation).trim() : '',
        familySize: cleanFamilySize,
      },
      { upsert: true, new: true }
    );

    // If preferredLanguage was updated
    if (preferredLanguage && ['en', 'kn', 'hi'].includes(preferredLanguage)) {
      await UserModel.updateOne({ _id: req.user!.id }, { preferredLanguage });
    }

    res.status(200).json(updatedProfile);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
});

export default router;

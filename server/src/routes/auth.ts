import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, ProfileModel } from '../models/index';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'schemesaathi_super_secret_jwt_key_2026';

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, preferredLanguage = 'en' } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ message: 'Full name is required (minimum 2 characters).' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      res.status(400).json({ message: 'A valid email address is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalizedEmail });

    if (existing) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      preferredLanguage: ['en', 'kn', 'hi'].includes(preferredLanguage) ? preferredLanguage : 'en',
    });

    // Create an empty profile for the new user
    await ProfileModel.findOneAndUpdate(
      { userId: user._id },
      { category: [], occupation: '', state: 'Karnataka' },
      { upsert: true }
    );

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

// Current User Me
router.get('/me', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch user' });
  }
});

export default router;

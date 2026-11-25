import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/index.ts';
import { getJwtSecret } from '../utils/jwt.ts';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
    name: string;
    preferredLanguage: 'en' | 'kn' | 'hi';
  };
}

export async function auth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: 'user' | 'admin' };
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: 'Invalid authentication token: user no longer exists.' });
      return;
    }

    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      preferredLanguage: user.preferredLanguage,
    };
    next();
  } catch (err: any) {
    res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

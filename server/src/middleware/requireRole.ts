import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requireRole(role: 'admin' | 'user') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ message: `Access denied. Requires '${role}' privilege.` });
      return;
    }

    next();
  };
}

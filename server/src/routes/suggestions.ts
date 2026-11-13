import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { SuggestionModel } from '../models/Suggestion';
import { validateAndSanitizeSuggestion } from '../utils/suggestionValidation';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'schemesaathi_super_secret_jwt_key_2026';

// Rate-limit public suggestion submissions to 5 per hour per IP
const suggestionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: 'Too many suggestions submitted from this connection. Please try again in an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function extractOptionalUserId(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string };
      if (decoded?.id) {
        return String(decoded.id);
      }
    } catch {
      // Public route: ignore invalid/expired/mirror token
    }
  }
  if (typeof req.body?.userId === 'string' && req.body.userId.trim()) {
    return req.body.userId.trim().slice(0, 100);
  }
  return undefined;
}

// Public POST /api/suggestions
router.post('/', suggestionLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = extractOptionalUserId(req);
    const result = validateAndSanitizeSuggestion({
      type: req.body?.type,
      title: req.body?.title,
      details: req.body?.details,
      schemeName: req.body?.schemeName,
      schemeState: req.body?.schemeState,
      schemeLink: req.body?.schemeLink,
      targetGroup: req.body?.targetGroup,
      name: req.body?.name,
      email: req.body?.email,
      userId,
      honeypot: req.body?.honeypot,
      website: req.body?.website,
    });

    if (!result.valid || !result.data) {
      res.status(400).json({
        message: result.message || 'Please check your suggestion details and try again.',
        errors: result.errors,
      });
      return;
    }

    await SuggestionModel.create(result.data);

    // Return a generic confirmation only (never return email or stored PII)
    res.status(201).json({
      message: 'Thank you. We read every suggestion.',
    });
  } catch (err: any) {
    res.status(500).json({
      message: 'Unable to submit your suggestion right now. Please try again later.',
    });
  }
});

export default router;

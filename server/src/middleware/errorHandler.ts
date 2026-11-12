import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[SchemeSaathi Error]', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error occurred';

  res.status(statusCode).json({
    message,
    errors: err.errors || undefined,
  });
}

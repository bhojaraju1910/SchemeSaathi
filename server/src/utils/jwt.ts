import crypto from 'crypto';

const globalForJwt = globalThis as unknown as {
  __ssRuntimeJwtSecret?: string;
};

export function getJwtSecret(): string {
  const configured = (process.env.JWT_SECRET || '').trim();
  if (configured) {
    return configured;
  }
  if (!globalForJwt.__ssRuntimeJwtSecret) {
    globalForJwt.__ssRuntimeJwtSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalForJwt.__ssRuntimeJwtSecret;
}

import { isIP } from 'node:net';
import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';

/**
 * Extracts the rightmost valid client IP from an RFC 7239 `Forwarded` header.
 * Handles quoted values, IPv4 with optional port, bracketed IPv6 with optional port,
 * and comma-separated multi-hop proxy chains while ignoring obfuscated tokens (`_hidden`, `unknown`).
 */
export function extractForwardedForIp(
  headerValue: string | string[] | undefined
): string | null {
  if (!headerValue) return null;
  const raw = Array.isArray(headerValue) ? headerValue.join(',') : headerValue;
  if (!raw.trim()) return null;

  const validIps: string[] = [];
  const hops = raw.split(',');

  for (const hop of hops) {
    const params = hop.split(';');
    for (const param of params) {
      const trimmed = param.trim();
      if (!/^for\s*=/i.test(trimmed)) continue;

      let value = trimmed.replace(/^for\s*=/i, '').trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1).trim();
      }

      if (!value || value.startsWith('_') || value.toLowerCase() === 'unknown') {
        continue;
      }

      // Bracketed IPv6, e.g. [2001:db8:cafe::17] or [2001:db8:cafe::17]:4711
      if (value.startsWith('[')) {
        const closingIdx = value.indexOf(']');
        if (closingIdx > 1) {
          const candidate = value.slice(1, closingIdx);
          if (isIP(candidate) !== 0) {
            validIps.push(candidate);
          }
        }
        continue;
      }

      // Bare IPv6 or IPv4 without port
      if (isIP(value) !== 0) {
        validIps.push(value);
        continue;
      }

      // IPv4 with port, e.g. 192.0.2.60:4700
      const lastColon = value.lastIndexOf(':');
      if (lastColon > 0 && value.indexOf(':') === lastColon) {
        const hostPart = value.slice(0, lastColon);
        if (isIP(hostPart) !== 0) {
          validIps.push(hostPart);
        }
      }
    }
  }

  // Rightmost valid IP corresponds to the immediate proxy-appended peer hop
  return validIps.length > 0 ? validIps[validIps.length - 1] : null;
}

export function getRateLimitClientIp(req: Request): string {
  const forwardedIp = extractForwardedForIp(req.headers?.forwarded);
  if (forwardedIp) {
    return forwardedIp;
  }

  const candidate = req.ip || req.socket?.remoteAddress || '';
  if (candidate && isIP(candidate) !== 0) {
    return candidate;
  }

  return '127.0.0.1';
}

export function rateLimitKeyGenerator(req: Request): string {
  const ip = getRateLimitClientIp(req);
  return ipKeyGenerator(ip);
}

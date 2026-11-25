import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  extractForwardedForIp,
  getRateLimitClientIp,
  rateLimitKeyGenerator,
} from '../src/utils/rateLimitKey';

test('extractForwardedForIp parses IPv4, quoted values, ports, and bracketed IPv6', () => {
  assert.equal(extractForwardedForIp('for=192.0.2.60;proto=http;by=203.0.113.43'), '192.0.2.60');
  assert.equal(extractForwardedForIp('for="198.51.100.17:4711";proto=https'), '198.51.100.17');
  assert.equal(extractForwardedForIp('for="[2001:db8:cafe::17]:4711";proto=https'), '2001:db8:cafe::17');
  assert.equal(extractForwardedForIp('for="[2001:db8:cafe::17]"'), '2001:db8:cafe::17');
  assert.equal(extractForwardedForIp('for=_hidden, for=203.0.113.195'), '203.0.113.195');
  assert.equal(extractForwardedForIp('for=unknown;proto=https'), null);
  assert.equal(extractForwardedForIp(undefined), null);
});

test('extractForwardedForIp selects rightmost valid IP in multi-hop proxy chain', () => {
  assert.equal(
    extractForwardedForIp('for=10.0.0.1;proto=http, for=203.0.113.99;proto=https'),
    '203.0.113.99'
  );
});

test('getRateLimitClientIp and rateLimitKeyGenerator handle IPv6 subnets and fallbacks', () => {
  const ipv6Req = {
    headers: { forwarded: 'for="[2001:db8:cafe:1234::55]:443"' },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  } as any;
  assert.equal(getRateLimitClientIp(ipv6Req), '2001:db8:cafe:1234::55');
  assert.equal(rateLimitKeyGenerator(ipv6Req), '2001:db8:cafe:1200::/56');

  const fallbackReq = {
    headers: {},
    ip: '203.0.113.5',
    socket: { remoteAddress: '127.0.0.1' },
  } as any;
  assert.equal(getRateLimitClientIp(fallbackReq), '203.0.113.5');
  assert.equal(rateLimitKeyGenerator(fallbackReq), '203.0.113.5');
});

test('Express rateLimit with trust proxy 1 and rateLimitKeyGenerator emits no ValidationError on X-Forwarded-For and Forwarded headers', async () => {
  const loggedErrors: string[] = [];
  const app = express();
  app.set('trust proxy', 1);

  const limiter = rateLimit({
    windowMs: 60_000,
    max: 2,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rateLimitKeyGenerator,
    logger: {
      error: (err, msg) => loggedErrors.push(`${String(err)} ${msg ?? ''}`),
      warn: (err, msg) => loggedErrors.push(`${String(err)} ${msg ?? ''}`),
    },
  });

  app.get('/ping', limiter, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  const server = app.listen(0);
  try {
    const addr = server.address();
    assert.ok(addr && typeof addr === 'object');
    const url = `http://127.0.0.1:${addr.port}/ping`;

    const headers = {
      'X-Forwarded-For': '198.51.100.42',
      Forwarded: 'for="198.51.100.42";proto=https',
    };

    const r1 = await fetch(url, { headers });
    const r2 = await fetch(url, { headers });
    const r3 = await fetch(url, { headers });

    assert.equal(r1.status, 200);
    assert.equal(r2.status, 200);
    assert.equal(r3.status, 429);
    assert.deepEqual(loggedErrors, []);
  } finally {
    server.close();
  }
});

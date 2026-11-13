import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearMirrorStateForTesting,
  getMirrorDashboardStats,
  getMirrorProfile,
  getMirrorSavedSchemes,
  isApiUnavailableError,
  isMirrorToken,
  mirrorLogin,
  mirrorRegister,
  recordMirrorApplicationStatus,
  addMirrorSavedScheme,
  removeMirrorSavedScheme,
  saveMirrorProfile,
} from './authMirrorService';

test('mirrorLogin authenticates Demo User and Admin User and rejects invalid passwords', () => {
  clearMirrorStateForTesting();

  const demo = mirrorLogin('demo@schemesaathi.test', 'Demo@123');
  assert.equal(demo.user.id, 'user_demo');
  assert.equal(demo.user.role, 'user');
  assert.equal(isMirrorToken(demo.token), true);

  const admin = mirrorLogin('admin@schemesaathi.test', 'Admin@123');
  assert.equal(admin.user.id, 'user_admin');
  assert.equal(admin.user.role, 'admin');

  assert.throws(() => mirrorLogin('demo@schemesaathi.test', 'WrongPass'), /Invalid email or password/);
  assert.throws(() => mirrorLogin('missing@example.com', 'Demo@123'), /Invalid email or password/);
});

test('mirrorRegister creates account, enforces duplicate/validation checks, and persists login & profile', () => {
  clearMirrorStateForTesting();

  assert.throws(() => mirrorRegister('A', 'test@example.com', 'Pass@123'), /minimum 2 characters/);
  assert.throws(() => mirrorRegister('Ananya', 'bad-email', 'Pass@123'), /valid email/);
  assert.throws(() => mirrorRegister('Ananya', 'ananya@example.com', '123'), /at least 6 characters/);

  const reg = mirrorRegister('Ananya Rao', 'Ananya@Example.com', 'Secret@123', 'kn');
  assert.equal(reg.user.email, 'ananya@example.com');
  assert.equal(reg.user.preferredLanguage, 'kn');
  assert.equal(isMirrorToken(reg.token), true);

  assert.throws(() => mirrorRegister('Duplicate', 'ananya@example.com', 'Secret@123'), /already exists/);

  const loggedIn = mirrorLogin('ananya@example.com', 'Secret@123');
  assert.equal(loggedIn.user.id, reg.user.id);

  saveMirrorProfile(reg.user.id, {
    age: 26,
    state: 'Karnataka',
    incomeRange: 'lower_middle',
    category: ['woman'],
  });
  const profile = getMirrorProfile(reg.user.id);
  assert.equal(profile.age, 26);
  assert.deepEqual(profile.category, ['woman']);
});

test('mirror saved schemes, application status, and dashboard stats work for Demo User', () => {
  clearMirrorStateForTesting();

  const demoProfile = getMirrorProfile('user_demo');
  assert.equal(demoProfile.age, 62);
  assert.equal(demoProfile.state, 'Karnataka');

  addMirrorSavedScheme('user_demo', 'kar-006');
  recordMirrorApplicationStatus('user_demo', 'kar-006', 'applied');

  const saved = getMirrorSavedSchemes('user_demo');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].scheme?.id, 'kar-006');
  assert.equal(saved[0].status, 'applied');

  const stats = getMirrorDashboardStats('user_demo');
  assert.equal(stats.availableSchemes, 22);
  assert.equal(stats.savedSchemes, 1);
  assert.equal(stats.applicationLinks, 1);
  assert.ok(stats.potentialMatches >= 2);

  removeMirrorSavedScheme('user_demo', 'kar-006');
  assert.equal(getMirrorSavedSchemes('user_demo').length, 0);
});

test('isApiUnavailableError identifies 404, network, and HTML SPA rewrite responses without swallowing 401/400 JSON errors', () => {
  assert.equal(isApiUnavailableError(new Error('NON_JSON_HTML_RESPONSE')), true);
  assert.equal(isApiUnavailableError({ message: 'Network Error' }), true);
  assert.equal(isApiUnavailableError({ response: { status: 404, data: 'Not Found' } }), true);
  assert.equal(isApiUnavailableError({ response: { status: 500, data: {} } }), true);
  assert.equal(isApiUnavailableError({ response: { status: 200, data: '<!doctype html><html></html>' } }), true);

  assert.equal(isApiUnavailableError({ response: { status: 401, data: { message: 'Invalid email or password.' } } }), false);
  assert.equal(isApiUnavailableError({ response: { status: 400, data: { message: 'Validation error' } } }), false);
});

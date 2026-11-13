import test from 'node:test';
import assert from 'node:assert/strict';
import { HARDCODED_SCHEMES } from '../data/schemes';
import {
  queryHardcodedSchemes,
  getHardcodedSchemeById,
  evaluateRule,
  matchHardcodedSchemes,
} from './schemeMirrorService';

test('HARDCODED_SCHEMES contains exact 22 Karnataka (12) and Central (10) non-sample schemes', () => {
  assert.equal(HARDCODED_SCHEMES.length, 22);

  const stateSchemes = HARDCODED_SCHEMES.filter((s) => s.level === 'state');
  const centralSchemes = HARDCODED_SCHEMES.filter((s) => s.level === 'central');

  assert.equal(stateSchemes.length, 12);
  assert.equal(centralSchemes.length, 10);
  assert.ok(HARDCODED_SCHEMES.every((s) => s.isSample === false));
});

test('queryHardcodedSchemes mirrors search and pagination for Gruha schemes', () => {
  const res = queryHardcodedSchemes({ q: 'Gruha', page: 1, limit: 9 });
  assert.equal(res.total, 2);
  assert.equal(res.schemes.length, 2);
  assert.deepEqual(
    res.schemes.map((s) => s._id).sort(),
    ['kar-001', 'kar-002']
  );

  const page2 = queryHardcodedSchemes({ page: 2, limit: 9 });
  assert.equal(page2.total, 22);
  assert.equal(page2.totalPages, 3);
  assert.equal(page2.schemes.length, 9);

  const page3 = queryHardcodedSchemes({ page: 3, limit: 9 });
  assert.equal(page3.schemes.length, 4);
});

test('queryHardcodedSchemes filters by category, level, and state', () => {
  const agri = queryHardcodedSchemes({ category: 'agriculture', level: 'central' });
  assert.equal(agri.total, 2);
  assert.deepEqual(
    agri.schemes.map((s) => s._id).sort(),
    ['cen-001', 'cen-009']
  );

  const maharashtra = queryHardcodedSchemes({ state: 'Maharashtra', limit: 30 });
  assert.equal(maharashtra.total, 10);
  assert.ok(maharashtra.schemes.every((s) => s.state === 'All'));
});

test('getHardcodedSchemeById returns scheme details and plain-language criteria', () => {
  const details = getHardcodedSchemeById('kar-001');
  assert.ok(details !== null);
  assert.equal(details.scheme.title.includes('Gruha Lakshmi'), true);
  assert.equal(details.criteria.rules.length, 4);
  assert.equal(details.criteria.plainLanguageSummary.includes('Resident of Karnataka'), true);

  assert.equal(getHardcodedSchemeById('non-existent'), null);
});

test('evaluateRule and matchHardcodedSchemes match backend eligibility engine parity', () => {
  assert.equal(
    evaluateRule({ field: 'age', op: 'gte', value: 60, label: 'Age 60+' }, { age: 62 }),
    true
  );
  assert.equal(
    evaluateRule({ field: 'age', op: 'gte', value: 60, label: 'Age 60+' }, {}),
    'unknown'
  );

  const matches = matchHardcodedSchemes({
    age: 62,
    incomeRange: 'low',
    state: 'Karnataka',
    category: ['senior_citizen'],
  });

  const sandhya = matches.find((m) => m.scheme._id === 'kar-006');
  const ignoaps = matches.find((m) => m.scheme._id === 'cen-005');
  const gruhaLakshmi = matches.find((m) => m.scheme._id === 'kar-001');

  assert.ok(sandhya && sandhya.match === 'High');
  assert.ok(ignoaps && ignoaps.match === 'High');
  assert.equal(gruhaLakshmi, undefined);
});

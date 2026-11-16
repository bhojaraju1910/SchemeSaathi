import test from 'node:test';
import assert from 'node:assert/strict';
import { HARDCODED_SCHEMES } from '../data/schemes';
import {
  queryHardcodedSchemes,
  getHardcodedSchemeById,
  evaluateRule,
  matchHardcodedSchemes,
} from './schemeMirrorService';

test('HARDCODED_SCHEMES contains exact 60 Karnataka (30) and Central (30) unverified non-sample schemes with unique slugs', () => {
  assert.equal(HARDCODED_SCHEMES.length, 60);

  const stateSchemes = HARDCODED_SCHEMES.filter((s) => s.level === 'state');
  const centralSchemes = HARDCODED_SCHEMES.filter((s) => s.level === 'central');

  assert.equal(stateSchemes.length, 30);
  assert.equal(centralSchemes.length, 30);
  assert.ok(HARDCODED_SCHEMES.every((s) => s.isSample === false));
  assert.ok(HARDCODED_SCHEMES.every((s) => s.verified === false && s.lastVerified === null));

  const slugs = new Set(HARDCODED_SCHEMES.map((s) => s.slug));
  assert.equal(slugs.size, 60);
});

test('queryHardcodedSchemes mirrors search and pagination (limit=12 across 60 schemes)', () => {
  const res = queryHardcodedSchemes({ q: 'Gruha', page: 1, limit: 12 }, HARDCODED_SCHEMES);
  assert.equal(res.total, 2);
  assert.equal(res.schemes.length, 2);
  assert.deepEqual(
    res.schemes.map((s) => s._id).sort(),
    ['kar-001', 'kar-002']
  );

  const page1 = queryHardcodedSchemes({ page: 1, limit: 12 }, HARDCODED_SCHEMES);
  assert.equal(page1.total, 60);
  assert.equal(page1.totalPages, 5);
  assert.equal(page1.schemes.length, 12);

  const page5 = queryHardcodedSchemes({ page: 5, limit: 12 }, HARDCODED_SCHEMES);
  assert.equal(page5.schemes.length, 12);
});

test('queryHardcodedSchemes filters by category, level, and state', () => {
  const agri = queryHardcodedSchemes({ category: 'agriculture', level: 'central', limit: 30 }, HARDCODED_SCHEMES);
  assert.ok(agri.total >= 2);
  assert.ok(agri.schemes.every((s) => s.category === 'agriculture' && s.level === 'central'));

  const maharashtra = queryHardcodedSchemes({ state: 'Maharashtra', limit: 40 }, HARDCODED_SCHEMES);
  assert.equal(maharashtra.total, 30);
  assert.ok(maharashtra.schemes.every((s) => s.state === 'All'));
});

test('getHardcodedSchemeById returns scheme details and plain-language criteria', () => {
  const details = getHardcodedSchemeById('kar-001', HARDCODED_SCHEMES);
  assert.ok(details !== null);
  assert.equal(details.scheme.title.includes('Gruha Lakshmi'), true);
  assert.equal(details.criteria.rules.length, 4);
  assert.equal(details.criteria.plainLanguageSummary.includes('Resident of Karnataka'), true);

  assert.equal(getHardcodedSchemeById('non-existent', HARDCODED_SCHEMES), null);
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

  const matches = matchHardcodedSchemes(
    {
      age: 62,
      incomeRange: 'low',
      state: 'Karnataka',
      category: ['senior_citizen'],
    },
    HARDCODED_SCHEMES
  );

  const sandhya = matches.find((m) => m.scheme._id === 'kar-006');
  const ignoaps = matches.find((m) => m.scheme._id === 'cen-005');
  const gruhaLakshmi = matches.find((m) => m.scheme._id === 'kar-001');

  assert.ok(sandhya && sandhya.match === 'High');
  assert.ok(ignoaps && ignoaps.match === 'High');
  assert.equal(gruhaLakshmi, undefined);
});

test('matchHardcodedSchemes never scores empty-rule scheme as High', () => {
  const matches = matchHardcodedSchemes(
    { age: 30, state: 'Karnataka', incomeRange: 'low', category: ['general'] },
    [
      {
        _id: 'empty-rules-1',
        id: 'empty-rules-1',
        slug: 'empty-rules-1',
        title: 'No Rules Yet Scheme',
        level: 'central',
        state: 'All',
        category: 'employment',
        shortDescription: 'Needs official confirmation.',
        benefits: ['Varies'],
        documentsRequired: [],
        applyUrl: 'https://www.myscheme.gov.in/',
        sourceUrl: 'https://www.myscheme.gov.in/',
        isActive: true,
        isSample: false,
        verified: false,
        lastVerified: null,
        rules: [],
      },
    ]
  );

  assert.equal(matches.length, 1);
  assert.equal(matches[0].match, 'Medium');
  assert.ok(matches[0].missing.length > 0);
});

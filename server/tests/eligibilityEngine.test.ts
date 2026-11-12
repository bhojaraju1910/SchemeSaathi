import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateRule,
  matchSchemes,
  Rule,
  UserProfile,
  SchemeWithRules,
} from '../src/services/eligibilityEngine';

test('evaluateRule: gte operator', () => {
  const rule: Rule = { field: 'age', op: 'gte', value: 60, label: 'Age 60 or above' };
  assert.equal(evaluateRule(rule, { age: 62 }), true);
  assert.equal(evaluateRule(rule, { age: 60 }), true);
  assert.equal(evaluateRule(rule, { age: 59 }), false);
  assert.equal(evaluateRule(rule, {}), 'unknown');
  assert.equal(evaluateRule(rule, { age: null }), 'unknown');
});

test('evaluateRule: lte operator', () => {
  const rule: Rule = { field: 'age', op: 'lte', value: 25, label: 'Age 25 or below' };
  assert.equal(evaluateRule(rule, { age: 20 }), true);
  assert.equal(evaluateRule(rule, { age: 25 }), true);
  assert.equal(evaluateRule(rule, { age: 26 }), false);
  assert.equal(evaluateRule(rule, {}), 'unknown');
});

test('evaluateRule: eq operator', () => {
  const rule: Rule = { field: 'state', op: 'eq', value: 'Karnataka', label: 'Resident of Karnataka' };
  assert.equal(evaluateRule(rule, { state: 'Karnataka' }), true);
  assert.equal(evaluateRule(rule, { state: 'karnataka' }), true);
  assert.equal(evaluateRule(rule, { state: 'Maharashtra' }), false);
  assert.equal(evaluateRule(rule, {}), 'unknown');
});

test('evaluateRule: in operator', () => {
  const rule: Rule = {
    field: 'incomeRange',
    op: 'in',
    value: ['low', 'lower_middle'],
    label: 'Low or lower-middle income',
  };
  assert.equal(evaluateRule(rule, { incomeRange: 'low' }), true);
  assert.equal(evaluateRule(rule, { incomeRange: 'lower_middle' }), true);
  assert.equal(evaluateRule(rule, { incomeRange: 'high' }), false);
  assert.equal(evaluateRule(rule, {}), 'unknown');
});

test('evaluateRule: includesAny operator for arrays', () => {
  const rule: Rule = {
    field: 'category',
    op: 'includesAny',
    value: ['senior_citizen'],
    label: 'Senior citizen category',
  };
  assert.equal(evaluateRule(rule, { category: ['senior_citizen', 'general'] }), true);
  assert.equal(evaluateRule(rule, { category: ['student'] }), false);
  assert.equal(evaluateRule(rule, { category: [] }), 'unknown');
  assert.equal(evaluateRule(rule, {}), 'unknown');
});

test('matchSchemes: required vs optional rule failure', () => {
  const profile: UserProfile = { age: 40, state: 'Karnataka' };

  const schemes: SchemeWithRules[] = [
    {
      scheme: { title: 'Scheme A' },
      rules: [
        { field: 'age', op: 'gte', value: 60, required: true, label: 'Age 60+' },
        { field: 'state', op: 'eq', value: 'Karnataka', required: true, label: 'Karnataka' },
      ],
    },
    {
      scheme: { title: 'Scheme B' },
      rules: [
        { field: 'age', op: 'gte', value: 60, required: false, label: 'Preferred age 60+' },
        { field: 'state', op: 'eq', value: 'Karnataka', required: true, label: 'Karnataka' },
      ],
    },
  ];

  const results = matchSchemes(profile, schemes);
  // Scheme A has required age 60+ which fails -> excluded
  // Scheme B has optional age 60+ which fails -> included!
  assert.equal(results.length, 1);
  assert.equal(results[0].scheme.title, 'Scheme B');
  assert.deepEqual(results[0].reasons, ['Karnataka']);
});

test('matchSchemes: High vs Medium match and unknown handling', () => {
  // Demo profile: age 62, state Karnataka, income low, category senior_citizen
  const demoProfile: UserProfile = {
    age: 62,
    state: 'Karnataka',
    incomeRange: 'low',
    category: ['senior_citizen'],
    // occupation is missing
  };

  const schemes: SchemeWithRules[] = [
    {
      scheme: { title: 'Senior Citizen Pension' },
      rules: [
        { field: 'age', op: 'gte', value: 60, required: true, label: 'Age 60 or above' },
        { field: 'state', op: 'in', value: ['Karnataka', 'All'], required: true, label: 'Karnataka resident' },
        { field: 'incomeRange', op: 'in', value: ['low', 'lower_middle'], required: true, label: 'Low income' },
        { field: 'category', op: 'includesAny', value: ['senior_citizen'], required: true, label: 'Senior citizen' },
      ],
    },
    {
      scheme: { title: 'Senior Artisan Grant' },
      rules: [
        { field: 'age', op: 'gte', value: 60, required: true, label: 'Age 60 or above' },
        { field: 'occupation', op: 'eq', value: 'Artisan', required: true, label: 'Registered artisan' },
      ],
    },
  ];

  const results = matchSchemes(demoProfile, schemes);
  assert.equal(results.length, 2);

  // First result should be High match (Senior Citizen Pension)
  assert.equal(results[0].scheme.title, 'Senior Citizen Pension');
  assert.equal(results[0].match, 'High');
  assert.equal(results[0].missing.length, 0);
  assert.equal(results[0].reasons.length, 4);

  // Second result should be Medium match (occupation is missing)
  assert.equal(results[1].scheme.title, 'Senior Artisan Grant');
  assert.equal(results[1].match, 'Medium');
  assert.deepEqual(results[1].missing, ['Registered artisan']);
  assert.deepEqual(results[1].reasons, ['Age 60 or above']);
});

test('matchSchemes: sorting High before Medium', () => {
  const profile: UserProfile = { age: 25 };
  const schemes: SchemeWithRules[] = [
    {
      scheme: { title: 'Medium Scheme' },
      rules: [
        { field: 'age', op: 'lte', value: 30, label: 'Under 30' },
        { field: 'state', op: 'eq', value: 'Karnataka', label: 'Karnataka resident' }, // unknown
      ],
    },
    {
      scheme: { title: 'High Scheme' },
      rules: [
        { field: 'age', op: 'lte', value: 30, label: 'Under 30' },
      ],
    },
  ];

  const results = matchSchemes(profile, schemes);
  assert.equal(results[0].scheme.title, 'High Scheme');
  assert.equal(results[0].match, 'High');
  assert.equal(results[1].scheme.title, 'Medium Scheme');
  assert.equal(results[1].match, 'Medium');
});

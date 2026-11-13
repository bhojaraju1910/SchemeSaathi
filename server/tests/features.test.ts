import test from 'node:test';
import assert from 'node:assert/strict';
import { matchFaq, FAQS } from '../../src/data/faqs';
import { validateAndSanitizeSuggestion } from '../src/utils/suggestionValidation';

test('matchFaq: matches relevant FAQ by keyword scoring (case-insensitive)', () => {
  const guaranteeMatch = matchFaq('Does SchemeSaathi GUARANTEE approval?');
  assert.ok(guaranteeMatch);
  assert.equal(guaranteeMatch.id, 'guarantee-scheme');

  const highMediumMatch = matchFaq('What is the difference between high and medium match?');
  assert.ok(highMediumMatch);
  assert.equal(highMediumMatch.id, 'high-medium-match');

  const safeMatch = matchFaq('Is my Aadhaar or bank data safe?');
  assert.ok(safeMatch);
  assert.equal(safeMatch.id, 'data-safe');
});

test('matchFaq: returns null when no keywords match', () => {
  assert.equal(matchFaq('xyzzy quantum rocket launch'), null);
  assert.equal(matchFaq('   '), null);
});

test('FAQS dataset contains at least 12 entries and never says "you are eligible"', () => {
  assert.ok(FAQS.length >= 12);
  for (const faq of FAQS) {
    assert.equal(faq.answer.en.toLowerCase().includes('you are eligible'), false);
    assert.equal(faq.answer.kn.toLowerCase().includes('you are eligible'), false);
    assert.equal(faq.answer.hi.toLowerCase().includes('you are eligible'), false);
  }
});

test('validateAndSanitizeSuggestion: accepts valid scheme, feature, and feedback entries', () => {
  const schemeRes = validateAndSanitizeSuggestion({
    type: 'scheme',
    schemeName: '  Yuva Nidhi Scheme  ',
    schemeState: 'Karnataka',
    targetGroup: 'Unemployed graduates',
    schemeLink: 'https://sevasindhugs.karnataka.gov.in/',
    name: '  Asha  ',
    email: 'ASHA@Example.com',
  });
  assert.equal(schemeRes.valid, true);
  assert.equal(schemeRes.data?.schemeName, 'Yuva Nidhi Scheme');
  assert.equal(schemeRes.data?.email, 'asha@example.com');

  const featureRes = validateAndSanitizeSuggestion({
    type: 'feature',
    title: 'Add district filter',
    details: 'Let families filter Karnataka schemes by district.',
  });
  assert.equal(featureRes.valid, true);

  const otherRes = validateAndSanitizeSuggestion({
    type: 'other',
    details: 'Very helpful portal for senior citizens.',
  });
  assert.equal(otherRes.valid, true);
});

test('validateAndSanitizeSuggestion: rejects honeypot spam, invalid URLs, invalid emails, and length overflows', () => {
  const spamRes = validateAndSanitizeSuggestion({
    type: 'other',
    details: 'Buy cheap stuff',
    website: 'http://spam.example',
  });
  assert.equal(spamRes.valid, false);
  assert.equal(spamRes.isSpam, true);

  const badUrlRes = validateAndSanitizeSuggestion({
    type: 'scheme',
    schemeName: 'Test Scheme',
    schemeLink: 'javascript:alert(1)',
  });
  assert.equal(badUrlRes.valid, false);
  assert.ok(badUrlRes.errors.schemeLink);

  const badEmailRes = validateAndSanitizeSuggestion({
    type: 'other',
    details: 'Nice site',
    email: 'not-an-email',
  });
  assert.equal(badEmailRes.valid, false);
  assert.ok(badEmailRes.errors.email);

  const longTitleRes = validateAndSanitizeSuggestion({
    type: 'feature',
    title: 'x'.repeat(101),
    details: 'Details here',
  });
  assert.equal(longTitleRes.valid, false);
  assert.ok(longTitleRes.errors.title);

  const longMsgRes = validateAndSanitizeSuggestion({
    type: 'other',
    details: 'm'.repeat(1001),
  });
  assert.equal(longMsgRes.valid, false);
  assert.ok(longMsgRes.errors.details);
});

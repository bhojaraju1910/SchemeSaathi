import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HARDCODED_SCHEMES } from '../data/schemes';
import {
  computeNextBestStep,
  computeProfileStrength,
  computeSavedDocumentsReady,
  getChecklistProgress,
  getChecklistStorageKey,
  getRuleProgress,
  MAX_COMPARE_ITEMS,
  readChecklist,
  readCompareIds,
  readTextSize,
  runQuickCheck,
  StorageLike,
  toggleCompareId,
  writeChecklist,
  writeCompareIds,
  writeTextSize,
} from './schemeTools';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('schemeTools pure helpers', () => {
  it('enforces a maximum of 3 schemes in compare queue', () => {
    let state = toggleCompareId([], 'kar-001');
    assert.deepEqual(state.ids, ['kar-001']);
    assert.equal(state.added, true);
    assert.equal(state.limitReached, false);

    state = toggleCompareId(state.ids, 'kar-002');
    state = toggleCompareId(state.ids, 'kar-003');
    assert.equal(state.ids.length, MAX_COMPARE_ITEMS);

    const fourth = toggleCompareId(state.ids, 'cen-001');
    assert.equal(fourth.limitReached, true);
    assert.equal(fourth.added, false);
    assert.deepEqual(fourth.ids, ['kar-001', 'kar-002', 'kar-003']);

    const removed = toggleCompareId(fourth.ids, 'kar-002');
    assert.equal(removed.removed, true);
    assert.deepEqual(removed.ids, ['kar-001', 'kar-003']);
  });

  it('reads and writes compare ids cleanly to storage', () => {
    const store = createMemoryStorage();
    writeCompareIds(['a', 'b', 'c', 'd'], store);
    assert.deepEqual(readCompareIds(store), ['a', 'b', 'c']);
  });

  it('persists and computes checklist progress under ss_checklist_<id>', () => {
    const store = createMemoryStorage();
    assert.equal(getChecklistStorageKey('kar-001'), 'ss_checklist_kar-001');

    const initial = readChecklist('kar-001', 4, store);
    assert.deepEqual(initial, [false, false, false, false]);

    writeChecklist('kar-001', [true, false, true, true], store);
    const reloaded = readChecklist('kar-001', 4, store);
    assert.deepEqual(reloaded, [true, false, true, true]);

    const progress = getChecklistProgress(reloaded, 4);
    assert.deepEqual(progress, { done: 3, total: 4, percentage: 75 });
  });

  it('reads and writes valid text size options under ss_textsize', () => {
    const store = createMemoryStorage();
    assert.equal(readTextSize(store), '100');
    writeTextSize('125', store);
    assert.equal(readTextSize(store), '125');
  });

  it('computes profile strength out of 5 accurately', () => {
    const empty = computeProfileStrength({});
    assert.equal(empty.completed, 0);
    assert.equal(empty.total, 5);
    assert.equal(empty.percentage, 0);

    const partial = computeProfileStrength({
      age: 64,
      state: 'Karnataka',
      incomeRange: 'low',
    });
    assert.equal(partial.completed, 3);
    assert.equal(partial.percentage, 60);
    assert.deepEqual(partial.missingFields, ['Categories', 'Occupation']);
  });

  it('runs quick check matching using provided catalog rules', () => {
    const result = runQuickCheck(
      {
        age: '65',
        state: 'Karnataka',
        incomeRange: 'low',
        categories: ['senior_citizen'],
      },
      HARDCODED_SCHEMES
    );
    assert.ok(result.totalMatches > 0);
    assert.ok(result.topThree.length > 0 && result.topThree.length <= 3);
    assert.equal(result.highCount + result.mediumCount, result.totalMatches);
  });

  it('computes rule progress rings accurately', () => {
    const progress = getRuleProgress('kar-001', 3, 1, 4);
    assert.deepEqual(progress, { passed: 3, total: 4, percent: 75 });
  });

  it('aggregates Documents Ready ("x of y") cleanly across unique saved schemes', () => {
    const store = createMemoryStorage();
    writeChecklist('s1', [true, false, true], store);
    writeChecklist('s2', [true, true], store);

    const summary = computeSavedDocumentsReady(
      [
        { schemeId: 's1', scheme: { _id: 's1', documentsRequired: ['Aadhaar', 'Income Cert', 'Bank'] } },
        { schemeId: 's1', scheme: { _id: 's1', documentsRequired: ['Aadhaar', 'Income Cert', 'Bank'] } }, // duplicate skipped
        { schemeId: 's2', scheme: { _id: 's2', documentsRequired: ['Ration Card', 'Photo'] } },
        { schemeId: 's3', scheme: { _id: 's3', documentsRequired: [] } }, // zero-doc skipped
      ],
      store
    );

    assert.equal(summary.done, 4);
    assert.equal(summary.total, 5);
    assert.equal(summary.formatted, '4 of 5');
  });

  it('determines deterministic Next best step across user readiness stages', () => {
    assert.equal(
      computeNextBestStep({
        profileCompleted: 2,
        potentialMatchesCount: 5,
        savedCount: 0,
        docsDone: 0,
        docsTotal: 0,
        portalClicksCount: 0,
      }).id,
      'complete_profile'
    );

    assert.equal(
      computeNextBestStep({
        profileCompleted: 5,
        potentialMatchesCount: 4,
        savedCount: 0,
        docsDone: 0,
        docsTotal: 0,
        portalClicksCount: 0,
      }).id,
      'save_matches'
    );

    assert.equal(
      computeNextBestStep({
        profileCompleted: 5,
        potentialMatchesCount: 4,
        savedCount: 2,
        docsDone: 1,
        docsTotal: 4,
        portalClicksCount: 0,
      }).id,
      'gather_documents'
    );

    assert.equal(
      computeNextBestStep({
        profileCompleted: 5,
        potentialMatchesCount: 4,
        savedCount: 2,
        docsDone: 4,
        docsTotal: 4,
        portalClicksCount: 0,
      }).id,
      'visit_portal'
    );

    assert.equal(
      computeNextBestStep({
        profileCompleted: 5,
        potentialMatchesCount: 4,
        savedCount: 2,
        docsDone: 4,
        docsTotal: 4,
        portalClicksCount: 1,
      }).id,
      'stay_updated'
    );
  });
});

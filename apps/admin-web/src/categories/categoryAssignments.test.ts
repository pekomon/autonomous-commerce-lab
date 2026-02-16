import { describe, expect, it } from 'vitest';

import { computeCategoryAssignmentDiff } from './categoryAssignments';

describe('computeCategoryAssignmentDiff', () => {
  it('returns inserts and deletes between current and next assignments', () => {
    const diff = computeCategoryAssignmentDiff(['cat-a', 'cat-b'], ['cat-b', 'cat-c']);

    expect(diff).toEqual({
      toInsert: ['cat-c'],
      toDelete: ['cat-a'],
    });
  });

  it('handles duplicate ids in inputs safely', () => {
    const diff = computeCategoryAssignmentDiff(['cat-a', 'cat-a'], ['cat-a', 'cat-b', 'cat-b']);

    expect(diff).toEqual({
      toInsert: ['cat-b'],
      toDelete: [],
    });
  });

  it('returns empty arrays when assignments are unchanged', () => {
    const diff = computeCategoryAssignmentDiff(['cat-a', 'cat-b'], ['cat-b', 'cat-a']);

    expect(diff).toEqual({
      toInsert: [],
      toDelete: [],
    });
  });
});

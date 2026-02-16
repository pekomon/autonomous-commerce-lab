export interface CategoryAssignmentDiff {
  toInsert: string[];
  toDelete: string[];
}

export function computeCategoryAssignmentDiff(
  currentCategoryIds: string[],
  nextCategoryIds: string[],
): CategoryAssignmentDiff {
  const currentSet = new Set(currentCategoryIds);
  const nextSet = new Set(nextCategoryIds);

  const toInsert: string[] = [];
  for (const categoryId of nextSet) {
    if (!currentSet.has(categoryId)) {
      toInsert.push(categoryId);
    }
  }

  const toDelete: string[] = [];
  for (const categoryId of currentSet) {
    if (!nextSet.has(categoryId)) {
      toDelete.push(categoryId);
    }
  }

  return { toInsert, toDelete };
}

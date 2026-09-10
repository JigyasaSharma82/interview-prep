const confidenceRank = (confidence) =>
  confidence === 1 || confidence === 2 || confidence === 3
    ? confidence
    : 0;

const priorityRank = (priority) => (priority === "must" ? 0 : 1);

export const sortPracticeItems = (items) =>
  [...items].sort((left, right) => {
    const confidenceDifference =
      confidenceRank(left.confidence) - confidenceRank(right.confidence);

    if (confidenceDifference !== 0) return confidenceDifference;

    const priorityDifference =
      priorityRank(left.requirement?.priority) -
      priorityRank(right.requirement?.priority);

    if (priorityDifference !== 0) return priorityDifference;

    const difficultyDifference =
      (right.difficulty || 0) - (left.difficulty || 0);

    if (difficultyDifference !== 0) return difficultyDifference;

    const leftUpdated = left.updatedAt
      ? new Date(left.updatedAt).getTime()
      : 0;
    const rightUpdated = right.updatedAt
      ? new Date(right.updatedAt).getTime()
      : 0;

    if (leftUpdated !== rightUpdated) return leftUpdated - rightUpdated;

    return left.item_id.localeCompare(right.item_id);
  });

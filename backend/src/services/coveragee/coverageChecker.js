export const checkCoverage = (requirements, questions) => {
  const coveredRequirementIds = new Set();

  for (const question of questions) {
    for (const requirementId of question.requirement_ids || []) {
      coveredRequirementIds.add(requirementId);
    }
  }

  const uncoveredRequirementIds = requirements
    .filter((requirement) => requirement.priority === "must")
    .filter(
      (requirement) =>
        !coveredRequirementIds.has(requirement.id)
    )
    .map((requirement) => requirement.id);

  return {
    uncovered_requirement_ids: uncoveredRequirementIds,
    all_must_have_covered:
      uncoveredRequirementIds.length === 0,
  };
};
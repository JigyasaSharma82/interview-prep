const getRequirementMap = (requirements) =>
  new Map(requirements.map((requirement) => [requirement.id, requirement]));

export const normalizeGeneratedQuestion = (
  question,
  requirements,
  context = "Generated question"
) => {
  if (!question?.requirement_id) {
    console.error("[QUESTION GENERATION ERROR] Question is missing requirement_id");
    throw new Error(`${context} is missing requirement_id`);
  }

  const requirementMap = getRequirementMap(requirements);
  if (!requirementMap.has(question.requirement_id)) {
    throw new Error(
      `${context} references unknown requirement_id ${question.requirement_id}`
    );
  }

  return {
    requirement_ids: [question.requirement_id],
    category: question.category,
    prompt: question.prompt,
    answer_outline: question.answer_outline,
    difficulty: question.difficulty,
  };
};

export const validateCanonicalQuestion = (
  question,
  requirements,
  context = "Canonical question"
) => {
  const requirementMap = getRequirementMap(requirements);

  if (
    !Array.isArray(question?.requirement_ids) ||
    question.requirement_ids.length !== 1 ||
    !question.requirement_ids[0]
  ) {
    throw new Error(`${context} has invalid requirement_ids`);
  }

  if (!requirementMap.has(question.requirement_ids[0])) {
    throw new Error(
      `${context} references unknown requirement_id ${question.requirement_ids[0]}`
    );
  }

  return question;
};

export const validateStoredQuestionReferences = (kit) => {
  const requirementMap = getRequirementMap(kit.role.requirements);

  for (const question of kit.questions) {
    if (
      !Array.isArray(question.requirement_ids) ||
      question.requirement_ids.length !== 1 ||
      !question.requirement_ids[0] ||
      !requirementMap.has(question.requirement_ids[0])
    ) {
      throw new Error(
        `Stored question ${question.id} has invalid requirement_ids`
      );
    }
  }
};

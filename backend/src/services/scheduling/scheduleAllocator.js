const getPriorityScore = (requirement) => {
  return requirement.priority === "must" ? 2 : 1;
};

const getQuestionScore = (question, requirementsMap) => {
  const requirement = requirementsMap.get(
    question.requirement_ids[0]
  );

  const priorityScore = requirement
    ? getPriorityScore(requirement)
    : 0;

  return priorityScore * 10 + question.difficulty;
};

export const allocateSchedule = (
  requirements,
  questions,
  daysAvailable
) => {
  if (!Number.isInteger(daysAvailable)) {
    throw new Error(
      "daysAvailable must be an integer"
    );
  }

  if (daysAvailable < 1 || daysAvailable > 60) {
    throw new Error(
      "daysAvailable must be between 1 and 60"
    );
  }

  const requirementsMap = new Map(
    requirements.map((requirement) => [
      requirement.id,
      requirement,
    ])
  );

  const mustHaveRequirements =
    requirements.filter(
      (requirement) =>
        requirement.priority === "must"
    );

  // Sort questions:
  // 1. must-have requirements first
  // 2. higher difficulty first
  // 3. stable ID as deterministic tie-breaker
  const sortedQuestions = [...questions].sort(
    (a, b) => {
      const scoreA = getQuestionScore(
        a,
        requirementsMap
      );

      const scoreB = getQuestionScore(
        b,
        requirementsMap
      );

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return a.id.localeCompare(b.id);
    }
  );

  // Create exactly the requested number of days.
  const days = Array.from(
    { length: daysAvailable },
    (_, index) => ({
      day: index + 1,
      focus: "",
      question_ids: [],
      minutes: 0,
    })
  );

  // Track which must-have requirements
  // have already been scheduled.
  const scheduledMustHave =
    new Set();
  const scheduledQuestionIds = new Set();

  // First pass:
  // Put at least one question for every
  // must-have requirement into the schedule.
  for (const requirement of mustHaveRequirements) {
    const question = sortedQuestions.find(
      (item) =>
        item.requirement_ids.includes(
          requirement.id
        )
    );

    if (!question) {
      throw new Error(
        `No question exists for must-have requirement ${requirement.id}`
      );
    }

    if (scheduledQuestionIds.has(question.id)) {
      scheduledMustHave.add(requirement.id);
      continue;
    }

    const dayIndex =
      scheduledMustHave.size %
      daysAvailable;

    days[dayIndex].question_ids.push(
      question.id
    );

    days[dayIndex].minutes += 60;
    scheduledQuestionIds.add(question.id);

    scheduledMustHave.add(
      requirement.id
    );
  }

  // Track questions already scheduled.
  // Second pass:
  // Distribute remaining questions.
  let nextDayIndex = 0;

  for (const question of sortedQuestions) {
    if (
      scheduledQuestionIds.has(question.id)
    ) {
      continue;
    }

    days[nextDayIndex].question_ids.push(
      question.id
    );

    days[nextDayIndex].minutes += 60;

    scheduledQuestionIds.add(question.id);

    nextDayIndex =
      (nextDayIndex + 1) %
      daysAvailable;
  }

  // Generate focus for each day.
  for (const day of days) {
    const dayRequirements =
      new Set();

    for (const questionId of day.question_ids) {
      const question = questions.find(
        (item) => item.id === questionId
      );

      if (!question) {
        continue;
      }

      for (const requirementId of question.requirement_ids) {
        dayRequirements.add(
          requirementId
        );
      }
    }

    const focusRequirements = [
      ...dayRequirements,
    ]
      .map((requirementId) =>
        requirementsMap.get(
          requirementId
        )?.text
      )
      .filter(Boolean);

    day.focus =
      focusRequirements.length > 0
        ? focusRequirements.join("; ")
        : "General interview preparation";
  }

  return {
    days_available: daysAvailable,
    days,
  };
};
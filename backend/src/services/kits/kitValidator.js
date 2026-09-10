import { z } from "zod";

const contentStateSchema = z.object({
  origin: z.enum(["generated", "edited", "handwritten"]).default("generated"),
  is_pinned: z.boolean().default(false),
});

const requirementSchema = z.object({
  id: z.string().regex(/^r\d+$/),
  text: z.string().min(1),
  kind: z.enum([
    "technical",
    "behavioral",
    "domain",
    "other",
  ]),
  priority: z.enum(["must", "nice"]),
  content_state: contentStateSchema.default({}),
});

const questionSchema = z.object({
  id: z.string().regex(/^q\d+$/),
  requirement_ids: z
    .array(z.string().regex(/^r\d+$/))
    .min(1),
  category: z.enum([
    "technical",
    "behavioral",
    "system-design",
    "company-fit",
  ]),
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
  content_state: contentStateSchema.default({}),
});

const flashcardSchema = z.object({
  id: z.string().regex(/^f\d+$/),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z
    .array(z.string().regex(/^r\d+$/))
    .min(1),
  content_state: contentStateSchema.default({}),
});

const scheduleDaySchema = z.object({
  day: z.number().int().min(1),
  focus: z.string(),
  question_ids: z.array(
    z.string().regex(/^q\d+$/)
  ),
  minutes: z.number().int().min(0),
});

const kitSchema = z.object({
  source: z.object({
    company: z.string(),
    company_url: z.string().url(),
    role: z.string(),
    location: z.string(),
    jd_chars: z.number().int().min(0),
    researched_at: z.string(),
    pages_used: z.array(z.string().url()),
  }),

  company_brief: z.object({
    summary: z.string(),
    what_they_do: z.string(),
    interview_process: z.string().default(""),
    sources: z.array(z.string().url()),
    content_state: contentStateSchema.default({}),
  }),

  role: z.object({
    title: z.string(),
    seniority: z.string(),
    responsibilities: z.array(z.string()),
    requirements: z.array(requirementSchema),
  }),

  questions: z.array(questionSchema),

  flashcards: z.array(flashcardSchema),

  schedule: z.object({
    days_available: z.number().int().min(1).max(60),
    days: z.array(scheduleDaySchema),
  }),

  coverage: z.object({
    uncovered_requirement_ids: z.array(
      z.string().regex(/^r\d+$/)
    ),
    passes: z.number().int().min(0),
  }),
});

export const validateKit = (kit) => {
  return kitSchema.parse(kit);
};
export const validateKitReferences = (kit) => {
  const assertUniqueIds = (items, label) => {
    const ids = items.map((item) => item.id);

    if (new Set(ids).size !== ids.length) {
      throw new Error(`${label} contain duplicate IDs`);
    }
  };

  assertUniqueIds(kit.role.requirements, "Requirements");
  assertUniqueIds(kit.questions, "Questions");
  assertUniqueIds(kit.flashcards, "Flashcards");

  const requirementIds = new Set(
    kit.role.requirements.map(
      (requirement) => requirement.id
    )
  );

  for (const question of kit.questions) {
    if (question.requirement_ids.length !== 1) {
      throw new Error(
        `Question ${question.id} must reference exactly one requirement`
      );
    }

    for (const requirementId of question.requirement_ids) {
      if (!requirementIds.has(requirementId)) {
        throw new Error(
          `Question ${question.id} references unknown requirement ${requirementId}`
        );
      }
    }
  }

  for (const flashcard of kit.flashcards) {
    for (const requirementId of flashcard.requirement_ids) {
      if (!requirementIds.has(requirementId)) {
        throw new Error(
          `Flashcard ${flashcard.id} references unknown requirement ${requirementId}`
        );
      }
    }
  }

  const questionIds = new Set(
    kit.questions.map(
      (question) => question.id
    )
  );

  const scheduledQuestionIds = [];
  const scheduleDays = new Set();

  for (const day of kit.schedule.days) {
    if (day.day > kit.schedule.days_available) {
      throw new Error(
        `Schedule day ${day.day} exceeds days_available`
      );
    }

    if (scheduleDays.has(day.day)) {
      throw new Error(`Schedule contains duplicate day ${day.day}`);
    }

    scheduleDays.add(day.day);

    for (const questionId of day.question_ids) {
      if (!questionIds.has(questionId)) {
        throw new Error(
          `Schedule day ${day.day} references unknown question ${questionId}`
        );
      }

      scheduledQuestionIds.push(questionId);
    }
  }

  if (scheduleDays.size !== kit.schedule.days_available) {
    throw new Error("Schedule must contain every requested day");
  }

  if (
    new Set(scheduledQuestionIds).size !== scheduledQuestionIds.length ||
    new Set(scheduledQuestionIds).size !== questionIds.size
  ) {
    throw new Error(
      "Every question must be scheduled exactly once"
    );
  }

  const coveredMustHaveIds = new Set(
    kit.questions.flatMap((question) => question.requirement_ids)
  );
  const expectedUncoveredIds = kit.role.requirements
    .filter((requirement) => requirement.priority === "must")
    .filter((requirement) => !coveredMustHaveIds.has(requirement.id))
    .map((requirement) => requirement.id);

  if (
    JSON.stringify([...expectedUncoveredIds].sort()) !==
    JSON.stringify([...kit.coverage.uncovered_requirement_ids].sort())
  ) {
    throw new Error(
      "Coverage metadata does not match question references"
    );
  }

  return true;
};
export const validateCompleteKit = (kit) => {
  const validatedKit = validateKit(kit);

  validateKitReferences(validatedKit);

  return validatedKit;
};
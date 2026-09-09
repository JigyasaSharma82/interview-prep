import { z } from "zod";

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
});

const questionSchema = z.object({
  id: z.string().regex(/^q\d+$/),
  requirement_ids: z
    .array(z.string().regex(/^r\d+$/))
    .min(1),
  category: z.string().min(1),
  prompt: z.string().min(1),
  answer_outline: z.string().min(1),
  difficulty: z.number().int().min(1).max(3),
});

const flashcardSchema = z.object({
  id: z.string().regex(/^f\d+$/),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z
    .array(z.string().regex(/^r\d+$/))
    .min(1),
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
    sources: z.array(z.string().url()),
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
  const requirementIds = new Set(
    kit.role.requirements.map(
      (requirement) => requirement.id
    )
  );

  for (const question of kit.questions) {
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

  for (const day of kit.schedule.days) {
    for (const questionId of day.question_ids) {
      if (!questionIds.has(questionId)) {
        throw new Error(
          `Schedule day ${day.day} references unknown question ${questionId}`
        );
      }
    }
  }

  return true;
};
export const validateCompleteKit = (kit) => {
  const validatedKit = validateKit(kit);

  validateKitReferences(validatedKit);

  return validatedKit;
};
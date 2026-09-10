import { z } from "zod";

const contentStateSchema = z.object({
  origin: z.enum(["generated", "edited", "handwritten"]).optional(),
  is_pinned: z.boolean().optional(),
});

export const createKitSchema = z.object({
  jd: z
    .string()
    .trim()
    .min(1, "Job description is required"),

  company_url: z
    .string()
    .trim()
    .url("Invalid company URL"),

  days: z
    .number()
    .int("Days must be an integer")
    .min(1, "Days must be at least 1")
    .max(60, "Days cannot exceed 60"),
});
export const extractedRequirementsSchema = z.object({
  title: z.string(),
  seniority: z.string(),
  responsibilities: z.array(z.string()),
  requirements: z.array(
    z.object({
      id: z.string().regex(/^r\d+$/, "Invalid requirement ID"),
      text: z.string().min(1),
      kind: z.enum(["technical", "behavioral", "domain", "other"]),
      priority: z.enum(["must", "nice"]),
    })
  ),
});
export const updateKitSchema = z.object({
  company_brief: z
    .object({
      summary: z.string(),
      what_they_do: z.string(),
      interview_process: z.string().optional(),
      sources: z.array(z.string().url()),
      content_state: contentStateSchema.optional(),
    })
    .optional(),

  role: z
    .object({
      title: z.string(),
      seniority: z.string(),
      responsibilities: z.array(z.string()),
      requirements: z.array(
        z.object({
          id: z.string().regex(/^r\d+$/, "Invalid requirement ID"),
          text: z.string().min(1),
          kind: z.enum([
            "technical",
            "behavioral",
            "domain",
            "other",
          ]),
          priority: z.enum(["must", "nice"]),
          content_state: contentStateSchema.optional(),
        })
      ),
    })
    .optional(),

  questions: z
    .array(
      z.object({
        id: z.string().regex(/^q\d+$/, "Invalid question ID"),
        requirement_ids: z.array(
          z.string().regex(/^r\d+$/, "Invalid requirement ID")
        ),
        category: z.enum([
          "technical",
          "behavioral",
          "system-design",
          "company-fit",
        ]),
        prompt: z.string().min(1),
        answer_outline: z.string(),
        difficulty: z.number().int().min(1).max(3),
        content_state: contentStateSchema.optional(),
      })
    )
    .optional(),

  flashcards: z
    .array(
      z.object({
        id: z.string().regex(/^f\d+$/, "Invalid flashcard ID"),
        front: z.string().min(1),
        back: z.string().min(1),
        requirement_ids: z.array(
          z.string().regex(/^r\d+$/, "Invalid requirement ID")
        ),
        content_state: contentStateSchema.optional(),
      })
    )
    .optional(),

  schedule: z
    .object({
      days_available: z.number().int().min(1).max(60),
      days: z.array(
        z.object({
          day: z.number().int().min(1),
          focus: z.string(),
          question_ids: z.array(
            z.string().regex(/^q\d+$/, "Invalid question ID")
          ),
          minutes: z.number().int().min(0),
        })
      ),
    })
    .optional(),
}).strict();
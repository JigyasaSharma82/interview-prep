import { z } from "zod";

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
import { generateContentWithRetry, model } from "./gemini.js";
import {
  extractedRequirementsSchema,
} from "../../validators/kit.schemas.js";

const requirementSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    seniority: {
      type: "string",
    },
    responsibilities: {
      type: "array",
      items: {
        type: "string",
      },
    },
    requirements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          text: {
            type: "string",
          },
          kind: {
            type: "string",
            enum: ["technical", "behavioral", "domain", "other"],
          },
          priority: {
            type: "string",
            enum: ["must", "nice"],
          },
        },
        required: ["id", "text", "kind", "priority"],
      },
    },
  },
  required: [
    "title",
    "seniority",
    "responsibilities",
    "requirements",
  ],
};

export const extractRequirements = async (jd) => {
  const prompt = `
You are extracting structured requirements from a job description.

IMPORTANT RULES:
1. Use ONLY information explicitly supported by the job description.
2. Do not invent technologies, responsibilities, experience, or qualifications.
3. If the job description is very short or thin, keep the extracted result thin.
4. Every requirement must have a stable ID such as r1, r2, r3.
5. Mark a requirement as "must" only when the wording clearly indicates it is required.
6. Mark optional, preferred, bonus, or nice-to-have items as "nice".
7. Classify each requirement as technical, behavioral, domain, or other.
8. Separate responsibilities from requirements.
9. Return valid JSON matching the requested schema.
10. Do not infer seniority from years of experience. If seniority is not explicitly stated, return an empty string.

JOB DESCRIPTION:

${jd}
`;

  const response = await generateContentWithRetry({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: requirementSchema,
    },
  });

  const parsedResult = JSON.parse(response.text);

  return extractedRequirementsSchema.parse(parsedResult);
};
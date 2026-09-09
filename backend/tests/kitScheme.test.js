import { describe, it, expect } from "vitest";
import { updateKitSchema } from "../src/validators/kit.schemas.js";

describe("updateKitSchema", () => {
  it("accepts a valid questions update", () => {
    const result = updateKitSchema.safeParse({
      questions: [
        {
          id: "q1",
          requirement_ids: ["r1"],
          category: "technical",
          prompt: "Explain the Node.js event loop.",
          answer_outline: "Discuss event loop phases.",
          difficulty: 3,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid question difficulty", () => {
    const result = updateKitSchema.safeParse({
      questions: [
        {
          id: "q1",
          requirement_ids: ["r1"],
          category: "technical",
          prompt: "Explain Node.js.",
          answer_outline: "Discuss Node.js.",
          difficulty: 5,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid question ID", () => {
    const result = updateKitSchema.safeParse({
      questions: [
        {
          id: "question-1",
          requirement_ids: ["r1"],
          category: "technical",
          prompt: "Explain Node.js.",
          answer_outline: "Discuss Node.js.",
          difficulty: 2,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts a partial update", () => {
    const result = updateKitSchema.safeParse({
      company_brief: {
        summary: "A technology company.",
        what_they_do: "Build software.",
        sources: ["https://example.com"],
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid requirement ID", () => {
    const result = updateKitSchema.safeParse({
      questions: [
        {
          id: "q1",
          requirement_ids: ["invalid"],
          category: "technical",
          prompt: "Explain Node.js.",
          answer_outline: "Discuss Node.js.",
          difficulty: 2,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
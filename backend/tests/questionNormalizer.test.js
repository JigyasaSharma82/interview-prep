import { describe, expect, it } from "vitest";
import {
  normalizeGeneratedQuestion,
  validateStoredQuestionReferences,
} from "../src/services/kits/questionNormalizer.js";

const requirements = [
  { id: "r1", text: "Node.js", kind: "technical", priority: "must" },
];

const generated = {
  requirement_id: "r1",
  category: "technical",
  prompt: "How does Node.js work?",
  answer_outline: "Explain the runtime.",
  difficulty: 2,
};

describe("questionNormalizer", () => {
  it("maps a valid singular requirement ID to canonical plural structure", () => {
    expect(normalizeGeneratedQuestion(generated, requirements)).toEqual({
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "How does Node.js work?",
      answer_outline: "Explain the runtime.",
      difficulty: 2,
    });
  });

  it("rejects a missing requirement ID", () => {
    expect(() => normalizeGeneratedQuestion({ ...generated, requirement_id: undefined }, requirements)).toThrow("missing requirement_id");
  });

  it("rejects an unknown requirement ID", () => {
    expect(() => normalizeGeneratedQuestion({ ...generated, requirement_id: "r999" }, requirements)).toThrow("unknown requirement_id");
  });

  it("rejects malformed stored question references", () => {
    expect(() => validateStoredQuestionReferences({
      role: { requirements },
      questions: [{ id: "q1", requirement_ids: [undefined] }],
    })).toThrow("invalid requirement_ids");
  });
});

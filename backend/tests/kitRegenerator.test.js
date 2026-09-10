import { describe, expect, it } from "vitest";
import {
  collectFreshCanonicalQuestions,
  mergeQuestionsForCategory,
} from "../src/services/kits/kitRegenerator.js";

const generated = (id, category, prompt) => ({
  id,
  category,
  requirement_ids: ["r1"],
  prompt,
  answer_outline: "outline",
  difficulty: 2,
});
const requirements = [{ id: "r1", text: "Node.js", kind: "technical", priority: "must" }];

describe("mergeQuestionsForCategory", () => {
  it("keeps raw retry attempts separate from canonical questions", async () => {
    const requirementsForRetry = Array.from({ length: 2 }, (_, index) => ({
      id: `r${index + 1}`,
      text: `Requirement ${index + 1}`,
      kind: "technical",
      priority: "must",
    }));
    const existingPrompts = Array.from({ length: 9 }, (_, index) => `Old question ${index + 1}`);
    const rawQuestion = (index, prompt) => ({
      requirement_id: `r${(index % 2) + 1}`,
      category: "technical",
      prompt,
      answer_outline: "outline",
      difficulty: 2,
    });
    const attempts = [
      [
        ...Array.from({ length: 7 }, (_, index) => rawQuestion(index, `Fresh question ${index + 1}`)),
        rawQuestion(0, "Old question 1"),
        rawQuestion(1, "Old question 2"),
      ],
      [rawQuestion(0, "Fresh retry question 1"), rawQuestion(1, "Fresh retry question 2")],
    ];
    const requestedCounts = [];
    let attempt = 0;

    const result = await collectFreshCanonicalQuestions({
      targetCount: 9,
      existingPrompts,
      requirements: requirementsForRetry,
      fetchRawQuestions: async ({ requestedCount }) => {
        requestedCounts.push(requestedCount);
        return attempts[attempt++];
      },
    });

    expect(requestedCounts).toEqual([9, 2]);
    expect(result.newCanonicalQuestions).toHaveLength(9);
    expect(result.duplicateCount).toBe(2);
    expect(result.newCanonicalQuestions.every((question) =>
      question.requirement_ids.every((requirementId) => ["r1", "r2"].includes(requirementId))
    )).toBe(true);
    expect(result.newCanonicalQuestions.some((question) => question.requirement_id)).toBe(false);
  });

  it("preserves edited, pinned, handwritten, and unrelated questions", () => {
    const existing = [
      { id: "q1", category: "technical", prompt: "edited", content_state: { origin: "edited", is_pinned: false } },
      { id: "q2", category: "technical", prompt: "pinned", content_state: { origin: "generated", is_pinned: true } },
      { id: "q3", category: "technical", prompt: "handwritten", content_state: { origin: "handwritten", is_pinned: false } },
      { id: "q4", category: "behavioral", prompt: "unrelated", content_state: { origin: "generated", is_pinned: false } },
    ];

    const result = mergeQuestionsForCategory(
      existing,
        [generated("new", "technical", "replacement")],
      "technical",
      requirements
    );

    expect(result.filter((question) => question.id).map((question) => question.id)).toEqual(["q1", "q2", "q3", "q4", "q5"]);
    expect(result.slice(0, 4).map((question) => question.prompt)).toEqual(["edited", "pinned", "handwritten", "unrelated"]);
    expect(result[4].content_state).toEqual({ origin: "generated", is_pinned: false });
  });

  it("does not replace generated questions in other categories", () => {
    const existing = [{ id: "q1", category: "behavioral", prompt: "keep", content_state: { origin: "generated", is_pinned: false } }];
    const result = mergeQuestionsForCategory(existing, [generated("new", "technical", "new")], "technical", requirements);
    expect(result[0]).toEqual(existing[0]);
    expect(result[1].category).toBe("technical");
  });

  it("rejects duplicate prompts and allocates IDs above all existing IDs", () => {
    const existing = [
      { id: "q1", category: "technical", prompt: "Old question", content_state: { origin: "generated", is_pinned: false } },
      { id: "q9", category: "behavioral", prompt: "Other question", content_state: { origin: "generated", is_pinned: false } },
    ];
    const result = mergeQuestionsForCategory(
      existing,
      [
        generated("new-1", "technical", "New question!"),
        generated("new-2", "technical", "new question"),
        generated("new-3", "technical", "Another new question"),
      ],
      "technical",
      requirements
    );

    expect(result.map((question) => question.id)).toEqual(["q9", "q10", "q11"]);
    expect(result.map((question) => question.prompt)).toEqual([
      "Other question",
      "New question!",
      "Another new question",
    ]);
  });
});

import { describe, it, expect } from "vitest";

import {
  validateCompleteKit,
} from "../src/services/kits/kitValidator.js";

const validKit = {
  source: {
    company: "Example Company",
    company_url: "https://example.com",
    role: "Backend Developer",
    location: "",
    jd_chars: 100,
    researched_at: new Date().toISOString(),
    pages_used: [
      "https://example.com",
    ],
  },

  company_brief: {
    summary: "A software company.",
    what_they_do: "They build software.",
    sources: [
      "https://example.com",
    ],
  },

  role: {
    title: "Backend Developer",
    seniority: "",
    responsibilities: [
      "Build APIs",
    ],
    requirements: [
      {
        id: "r1",
        text: "Node.js experience",
        kind: "technical",
        priority: "must",
      },
    ],
  },

  questions: [
    {
      id: "q1",
      requirement_ids: ["r1"],
      category: "technical",
      prompt: "Explain Node.js.",
      answer_outline: "Explain the runtime and event loop.",
      difficulty: 2,
    },
  ],

  flashcards: [
    {
      id: "f1",
      front: "What is Node.js?",
      back: "A JavaScript runtime.",
      requirement_ids: ["r1"],
    },
  ],

  schedule: {
    days_available: 1,
    days: [
      {
        day: 1,
        focus: "Node.js",
        question_ids: ["q1"],
        minutes: 60,
      },
    ],
  },

  coverage: {
    uncovered_requirement_ids: [],
    passes: 1,
  },
};

describe("kitValidator", () => {
  it("accepts a valid kit", () => {
    expect(() =>
      validateCompleteKit(validKit)
    ).not.toThrow();
  });

  it("rejects an invalid question difficulty", () => {
    const kit = structuredClone(validKit);

    kit.questions[0].difficulty = 5;

    expect(() =>
      validateCompleteKit(kit)
    ).toThrow();
  });

  it("rejects a question referencing an unknown requirement", () => {
    const kit = structuredClone(validKit);

    kit.questions[0].requirement_ids = [
      "r999",
    ];

    expect(() =>
      validateCompleteKit(kit)
    ).toThrow(
      "references unknown requirement"
    );
  });

  it("rejects a flashcard referencing an unknown requirement", () => {
    const kit = structuredClone(validKit);

    kit.flashcards[0].requirement_ids = [
      "r999",
    ];

    expect(() =>
      validateCompleteKit(kit)
    ).toThrow(
      "references unknown requirement"
    );
  });

  it("rejects a schedule referencing an unknown question", () => {
    const kit = structuredClone(validKit);

    kit.schedule.days[0].question_ids = [
      "q999",
    ];

    expect(() =>
      validateCompleteKit(kit)
    ).toThrow(
      "references unknown question"
    );
  });

  it("rejects invalid requirement priority", () => {
    const kit = structuredClone(validKit);

    kit.role.requirements[0].priority =
      "high";

    expect(() =>
      validateCompleteKit(kit)
    ).toThrow();
  });
});
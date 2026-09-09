import { describe, it, expect } from "vitest";
import { allocateSchedule } from "../src/services/scheduling/scheduleAllocator.js";

const requirements = [
  {
    id: "r1",
    text: "3+ years of experience with Node.js",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r2",
    text: "Experience with MongoDB",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r3",
    text: "Strong understanding of REST APIs",
    kind: "technical",
    priority: "must",
  },
];

const questions = [
  {
    id: "q1",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "Explain Node.js event loop.",
    answer_outline: "Explain event loop and asynchronous execution.",
    difficulty: 3,
  },
  {
    id: "q2",
    requirement_ids: ["r2"],
    category: "technical",
    prompt: "Explain MongoDB indexing.",
    answer_outline: "Explain indexes and query performance.",
    difficulty: 3,
  },
  {
    id: "q3",
    requirement_ids: ["r3"],
    category: "technical",
    prompt: "Design a REST API.",
    answer_outline: "Discuss resources, methods and status codes.",
    difficulty: 2,
  },
  {
    id: "q4",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "How do you debug Node.js?",
    answer_outline: "Discuss debugging and profiling.",
    difficulty: 2,
  },
];

describe("allocateSchedule", () => {
  it("creates exactly the requested number of days", () => {
    const schedule = allocateSchedule(
      requirements,
      questions,
      5
    );

    expect(schedule.days).toHaveLength(5);
    expect(schedule.days_available).toBe(5);
  });

  it("assigns valid question IDs", () => {
    const schedule = allocateSchedule(
      requirements,
      questions,
      3
    );

    const questionIds = new Set(
      questions.map((question) => question.id)
    );

    for (const day of schedule.days) {
      for (const questionId of day.question_ids) {
        expect(questionIds.has(questionId)).toBe(true);
      }
    }
  });

  it("assigns every question exactly once", () => {
    const schedule = allocateSchedule(
      requirements,
      questions,
      3
    );

    const scheduledQuestionIds =
      schedule.days.flatMap(
        (day) => day.question_ids
      );

    expect(scheduledQuestionIds).toHaveLength(
      questions.length
    );

    expect(
      new Set(scheduledQuestionIds).size
    ).toBe(questions.length);
  });

  it("uses integer minutes", () => {
    const schedule = allocateSchedule(
      requirements,
      questions,
      3
    );

    for (const day of schedule.days) {
      expect(
        Number.isInteger(day.minutes)
      ).toBe(true);
    }
  });

  it("is deterministic", () => {
    const first = allocateSchedule(
      requirements,
      questions,
      3
    );

    const second = allocateSchedule(
      requirements,
      questions,
      3
    );

    expect(first).toEqual(second);
  });

  it("rejects invalid number of days", () => {
    expect(() =>
      allocateSchedule(
        requirements,
        questions,
        0
      )
    ).toThrow();

    expect(() =>
      allocateSchedule(
        requirements,
        questions,
        61
      )
    ).toThrow();
  });
});
it("covers every must-have requirement", () => {
  const schedule = allocateSchedule(
    requirements,
    questions,
    3
  );

  const scheduledQuestionIds =
    new Set(
      schedule.days.flatMap(
        (day) => day.question_ids
      )
    );

  const coveredRequirements =
    new Set();

  for (const question of questions) {
    if (
      scheduledQuestionIds.has(question.id)
    ) {
      for (const requirementId of question.requirement_ids) {
        coveredRequirements.add(
          requirementId
        );
      }
    }
  }

  for (const requirement of requirements) {
    if (requirement.priority === "must") {
      expect(
        coveredRequirements.has(
          requirement.id
        )
      ).toBe(true);
    }
  }
});

it("throws when a must-have requirement has no question", () => {
  const incompleteQuestions = questions.filter(
    (question) =>
      !question.requirement_ids.includes(
        "r2"
      )
  );

  expect(() =>
    allocateSchedule(
      requirements,
      incompleteQuestions,
      3
    )
  ).toThrow(
    "No question exists for must-have requirement r2"
  );
});
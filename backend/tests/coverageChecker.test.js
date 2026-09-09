import { describe, it, expect } from "vitest";
import { checkCoverage } from "../src/services/coverage/coverageChecker.js";

const requirements = [
  {
    id: "r1",
    text: "Node.js experience",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r2",
    text: "MongoDB experience",
    kind: "technical",
    priority: "must",
  },
  {
    id: "r3",
    text: "Communication skills",
    kind: "behavioral",
    priority: "nice",
  },
];

describe("checkCoverage", () => {
  it("detects when all must-have requirements are covered", () => {
    const questions = [
      {
        id: "q1",
        requirement_ids: ["r1"],
      },
      {
        id: "q2",
        requirement_ids: ["r2"],
      },
    ];

    const result = checkCoverage(
      requirements,
      questions
    );

    expect(
      result.uncovered_requirement_ids
    ).toEqual([]);

    expect(
      result.all_must_have_covered
    ).toBe(true);
  });

  it("detects uncovered must-have requirements", () => {
    const questions = [
      {
        id: "q1",
        requirement_ids: ["r1"],
      },
    ];

    const result = checkCoverage(
      requirements,
      questions
    );

    expect(
      result.uncovered_requirement_ids
    ).toEqual(["r2"]);

    expect(
      result.all_must_have_covered
    ).toBe(false);
  });

  it("does not require nice-to-have requirements", () => {
    const questions = [
      {
        id: "q1",
        requirement_ids: ["r1"],
      },
      {
        id: "q2",
        requirement_ids: ["r2"],
      },
    ];

    const result = checkCoverage(
      requirements,
      questions
    );

    expect(
      result.uncovered_requirement_ids
    ).toEqual([]);

    expect(
      result.all_must_have_covered
    ).toBe(true);
  });

  it("supports multiple questions for the same requirement", () => {
    const questions = [
      {
        id: "q1",
        requirement_ids: ["r1"],
      },
      {
        id: "q2",
        requirement_ids: ["r1"],
      },
      {
        id: "q3",
        requirement_ids: ["r2"],
      },
    ];

    const result = checkCoverage(
      requirements,
      questions
    );

    expect(
      result.uncovered_requirement_ids
    ).toEqual([]);
  });

  it("handles an empty question list", () => {
    const result = checkCoverage(
      requirements,
      []
    );

    expect(
      result.uncovered_requirement_ids
    ).toEqual(["r1", "r2"]);

    expect(
      result.all_must_have_covered
    ).toBe(false);
  });
});
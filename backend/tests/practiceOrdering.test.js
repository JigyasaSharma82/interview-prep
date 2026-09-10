import { describe, expect, it } from "vitest";
import { sortPracticeItems } from "../src/services/practice/practiceOrdering.js";

const item = (item_id, confidence, priority = "nice", difficulty = 1) => ({
  item_id,
  confidence,
  difficulty,
  requirement: { priority },
});

describe("sortPracticeItems", () => {
  it("puts low confidence before medium and high", () => {
    const result = sortPracticeItems([
      item("q3", 3),
      item("q1", 1),
      item("q2", 2),
    ]);

    expect(result.map((entry) => entry.item_id)).toEqual(["q1", "q2", "q3"]);
  });

  it("puts must-have before nice-to-have at equal confidence", () => {
    const result = sortPracticeItems([
      item("q2", 1, "nice"),
      item("q1", 1, "must"),
    ]);

    expect(result.map((entry) => entry.item_id)).toEqual(["q1", "q2"]);
  });

  it("puts higher difficulty first at equal confidence and priority", () => {
    const result = sortPracticeItems([
      item("q1", 1, "must", 1),
      item("q3", 1, "must", 3),
      item("q2", 1, "must", 2),
    ]);

    expect(result.map((entry) => entry.item_id)).toEqual(["q3", "q2", "q1"]);
  });

  it("puts missing confidence before rated items deterministically", () => {
    const result = sortPracticeItems([
      item("q2", 2),
      item("q3", null),
      item("q1", undefined),
    ]);

    expect(result.map((entry) => entry.item_id)).toEqual(["q1", "q3", "q2"]);
  });
});

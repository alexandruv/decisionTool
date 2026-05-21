import { describe, expect, it } from "vitest";

import { buildDecisionResult, decayedSum, gateCheck, gravityValue } from "./engine";
import { type Decision } from "@/domain/types";

function makeBaseDecision(): Decision {
  const now = new Date().toISOString();

  return {
    id: "d1",
    title: "Test decision",
    description: "test",
    alternatives: [
      { id: "a1", name: "Option A" },
      { id: "a2", name: "Option B" },
    ],
    categories: [
      { id: "cat1", name: "Value", weight: 1 },
      { id: "cat2", name: "Risk", weight: 1 },
    ],
    factors: [
      {
        id: "f1",
        alternativeId: "a1",
        categoryId: "cat1",
        description: "Strong upside",
        direction: "pro",
        gravity: 5,
        probability: 0.9,
        evidenceConfidence: "strong",
      },
      {
        id: "f2",
        alternativeId: "a2",
        categoryId: "cat1",
        description: "Moderate upside",
        direction: "pro",
        gravity: 3,
        probability: 0.7,
        evidenceConfidence: "strong",
      },
    ],
    constraints: [],
    riskPreference: "balanced",
    createdAt: now,
    updatedAt: now,
  };
}

describe("gravityValue", () => {
  it("uses non-linear mapping", () => {
    expect(gravityValue(1)).toBe(1);
    expect(gravityValue(2)).toBe(3);
    expect(gravityValue(3)).toBe(8);
    expect(gravityValue(4)).toBe(20);
    expect(gravityValue(5)).toBe(50);
  });
});

describe("decayedSum", () => {
  it("applies diminishing returns by rank", () => {
    const total = decayedSum([10, 8, 6, 4, 2, 1]);
    expect(total).toBeCloseTo(18);
  });
});

describe("gateCheck", () => {
  it("fails must-have constraints", () => {
    const gate = gateCheck("a1", [
      {
        id: "c1",
        description: "Must have",
        type: "must_have",
        appliesToAlternativeIds: ["a1"],
        satisfied: false,
      },
    ]);

    expect(gate).toBe("FAIL");
  });
});

describe("buildDecisionResult", () => {
  it("returns recommended for clear winning pass option", () => {
    const result = buildDecisionResult(makeBaseDecision());
    expect(result.status).toBe("recommended");
    expect(result.recommendedAlternativeId).toBe("a1");
  });

  it("returns more_data_needed for high gravity low-confidence winner", () => {
    const decision = makeBaseDecision();
    decision.factors[0].evidenceConfidence = "intuition";

    const result = buildDecisionResult(decision);
    expect(result.status).toBe("more_data_needed");
  });

  it("returns not_recommended when all options fail gates", () => {
    const decision = makeBaseDecision();
    decision.constraints = [
      {
        id: "c1",
        description: "must have fails",
        type: "must_have",
        appliesToAlternativeIds: ["a1", "a2"],
        satisfied: false,
      },
    ];

    const result = buildDecisionResult(decision);
    expect(result.status).toBe("not_recommended");
    expect(result.recommendedAlternativeId).toBeUndefined();
  });

  it("adds guardrail warning for high-stakes domains", () => {
    const decision = makeBaseDecision();
    decision.title = "Should I make this medical treatment investment decision?";

    const result = buildDecisionResult(decision);
    expect(result.guardrailWarnings.length).toBeGreaterThan(0);
  });
});

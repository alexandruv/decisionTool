import { describe, expect, it } from "vitest";

import { type Decision } from "../types";
import { runDecisionSimulation } from "./simulation";

function makeSimulationDecision(): Decision {
  const now = new Date().toISOString();

  return {
    id: "sim-1",
    title: "Simulation",
    description: "Simulation fixture",
    alternatives: [
      { id: "a1", name: "A1" },
      { id: "a2", name: "A2" },
    ],
    categories: [{ id: "c1", name: "Value", weight: 1 }],
    factors: [
      {
        id: "f1",
        alternativeId: "a1",
        categoryId: "c1",
        description: "A1 upside",
        direction: "pro",
        gravity: 4,
        probability: 0.8,
        probabilityLow: 0.6,
        probabilityHigh: 0.9,
        evidenceConfidence: "some",
      },
      {
        id: "f2",
        alternativeId: "a2",
        categoryId: "c1",
        description: "A2 upside",
        direction: "pro",
        gravity: 3,
        probability: 0.6,
        probabilityLow: 0.5,
        probabilityHigh: 0.7,
        evidenceConfidence: "some",
      },
    ],
    constraints: [],
    riskPreference: "balanced",
    createdAt: now,
    updatedAt: now,
  };
}

describe("runDecisionSimulation", () => {
  it("returns per-alternative stats and recommended alternative", () => {
    const result = runDecisionSimulation(makeSimulationDecision(), {
      iterations: 500,
      rng: () => 0.5,
    });

    expect(result.iterations).toBe(500);
    expect(result.alternatives).toHaveLength(2);
    expect(result.recommendedAlternativeId).toBeDefined();

    const totalWinProbability = result.alternatives.reduce(
      (sum, alternative) => sum + alternative.winProbability,
      0,
    );
    expect(totalWinProbability).toBeCloseTo(1, 3);

    result.alternatives.forEach((alternative) => {
      expect(alternative.percentile10).not.toBeNull();
      expect(alternative.percentile25).not.toBeNull();
      expect(alternative.percentile50).not.toBeNull();
      expect(alternative.percentile75).not.toBeNull();
      expect(alternative.percentile90).not.toBeNull();
      expect(alternative.confidenceBandLow).not.toBeNull();
      expect(alternative.confidenceBandHigh).not.toBeNull();

      expect((alternative.percentile10 as number) <= (alternative.percentile50 as number)).toBe(
        true,
      );
      expect((alternative.percentile50 as number) <= (alternative.percentile90 as number)).toBe(
        true,
      );
    });
  });

  it("enforces minimum iteration floor", () => {
    const result = runDecisionSimulation(makeSimulationDecision(), {
      iterations: 10,
      rng: () => 0.5,
    });

    expect(result.iterations).toBe(100);
  });
});

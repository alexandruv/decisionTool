import { describe, expect, it } from "vitest";

import { type DecisionResult, type DecisionSimulationResult } from "../types";
import {
  applySimulationRecommendationPolicy,
  DEFAULT_RECOMMENDATION_THRESHOLDS,
} from "./recommendationPolicy";

function makeBaseResult(status: DecisionResult["status"]): DecisionResult {
  return {
    status,
    recommendedAlternativeId: "a1",
    scores: [],
    topReasons: [],
    topRisks: [],
    flipConditions: [],
    nextBestData: [],
  };
}

function makeSimulation(winProbability: number, robustness: number): DecisionSimulationResult {
  return {
    iterations: 1000,
    recommendedAlternativeId: "a1",
    robustness,
    alternatives: [
      {
        alternativeId: "a1",
        alternativeName: "A1",
        gate: "PASS",
        meanScore: 2,
        scoreStdDev: 1,
        minScore: 0,
        maxScore: 4,
        winProbability,
      },
      {
        alternativeId: "a2",
        alternativeName: "A2",
        gate: "PASS",
        meanScore: 1,
        scoreStdDev: 1,
        minScore: -1,
        maxScore: 3,
        winProbability: 1 - winProbability,
      },
    ],
  };
}

describe("applySimulationRecommendationPolicy", () => {
  it("keeps more_data_needed unchanged", () => {
    const output = applySimulationRecommendationPolicy(
      makeBaseResult("more_data_needed"),
      makeSimulation(0.95, 0.95),
    );

    expect(output.status).toBe("more_data_needed");
  });

  it("returns too_close for low top win probability", () => {
    const output = applySimulationRecommendationPolicy(
      makeBaseResult("recommended"),
      makeSimulation(0.52, 0.9),
      DEFAULT_RECOMMENDATION_THRESHOLDS,
    );

    expect(output.status).toBe("too_close");
  });

  it("returns leaning when confidence is below recommendation threshold", () => {
    const output = applySimulationRecommendationPolicy(
      makeBaseResult("recommended"),
      makeSimulation(0.68, 0.79),
      DEFAULT_RECOMMENDATION_THRESHOLDS,
    );

    expect(output.status).toBe("leaning");
  });

  it("returns recommended when win and robustness meet thresholds", () => {
    const output = applySimulationRecommendationPolicy(
      makeBaseResult("recommended"),
      makeSimulation(0.82, 0.85),
      DEFAULT_RECOMMENDATION_THRESHOLDS,
    );

    expect(output.status).toBe("recommended");
  });
});

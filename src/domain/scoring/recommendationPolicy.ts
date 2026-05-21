import { type DecisionResult, type DecisionSimulationResult, type RecommendationStatus } from "../types";

export type RecommendationPolicyThresholds = {
  recommendedWinProbability: number;
  recommendedRobustness: number;
  tooCloseWinProbability: number;
};

export type PolicyRecommendation = {
  status: RecommendationStatus;
  recommendedAlternativeId?: string;
  reason: string;
};

export const DEFAULT_RECOMMENDATION_THRESHOLDS: RecommendationPolicyThresholds = {
  recommendedWinProbability: 0.7,
  recommendedRobustness: 0.8,
  tooCloseWinProbability: 0.55,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function applySimulationRecommendationPolicy(
  baseResult: DecisionResult,
  simulationResult: DecisionSimulationResult | null,
  thresholds: RecommendationPolicyThresholds = DEFAULT_RECOMMENDATION_THRESHOLDS,
): PolicyRecommendation {
  if (!simulationResult) {
    return {
      status: baseResult.status,
      recommendedAlternativeId: baseResult.recommendedAlternativeId,
      reason: "We could not run uncertainty scenarios, so this result is based only on your direct inputs.",
    };
  }

  if (
    baseResult.status === "not_recommended" ||
    baseResult.status === "more_data_needed"
  ) {
    return {
      status: baseResult.status,
      recommendedAlternativeId: baseResult.recommendedAlternativeId,
      reason: "A hard rule failed or important evidence is missing, so confidence scoring cannot override that.",
    };
  }

  const passAlternatives = simulationResult.alternatives.filter(
    (alternative) => alternative.gate === "PASS",
  );

  if (passAlternatives.length === 0) {
    return {
      status: "not_recommended",
      recommendedAlternativeId: undefined,
      reason: "None of the options currently pass your must-have or dealbreaker rules.",
    };
  }

  const topByWinProbability = [...passAlternatives].sort(
    (a, b) => b.winProbability - a.winProbability,
  )[0];

  const tooCloseWin = clamp01(thresholds.tooCloseWinProbability);
  const recommendedWin = clamp01(thresholds.recommendedWinProbability);
  const recommendedRobustness = clamp01(thresholds.recommendedRobustness);

  if (topByWinProbability.winProbability < tooCloseWin) {
    return {
      status: "too_close",
      recommendedAlternativeId: topByWinProbability.alternativeId,
      reason: `The leading option only wins ${(topByWinProbability.winProbability * 100).toFixed(1)}% of simulated futures, which is too close to call with confidence.`,
    };
  }

  if (
    topByWinProbability.winProbability < recommendedWin ||
    simulationResult.robustness < recommendedRobustness
  ) {
    return {
      status: "leaning",
      recommendedAlternativeId: topByWinProbability.alternativeId,
      reason: `There is a current front-runner, but confidence is moderate (wins ${(topByWinProbability.winProbability * 100).toFixed(1)}% of runs, robustness ${(simulationResult.robustness * 100).toFixed(1)}%).`,
    };
  }

  return {
    status: "recommended",
    recommendedAlternativeId: topByWinProbability.alternativeId,
    reason: `This option stays ahead across scenarios (wins ${(topByWinProbability.winProbability * 100).toFixed(1)}% of runs, robustness ${(simulationResult.robustness * 100).toFixed(1)}%).`,
  };
}

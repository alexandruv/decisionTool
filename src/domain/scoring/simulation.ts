import { scoreAlternative } from "./engine";
import {
  type Decision,
  type DecisionSimulationResult,
  type Factor,
  type SimulationAlternativeStats,
} from "../types";

type SimulationOptions = {
  iterations?: number;
  rng?: () => number;
};

const CONFIDENCE_WIDTH: Record<Factor["evidenceConfidence"], number> = {
  strong: 0.1,
  some: 0.25,
  intuition: 0.45,
};

const RISK_LAMBDA: Record<Decision["riskPreference"], number> = {
  comfortable: 0,
  balanced: 0.5,
  cautious: 1,
};

const CONFIDENCE_BAND_PERCENTILES = {
  low: 0.1,
  high: 0.9,
};

function clampProbability(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function probabilityRange(factor: Factor): [number, number] {
  if (
    typeof factor.probabilityLow === "number" &&
    typeof factor.probabilityHigh === "number"
  ) {
    const low = clampProbability(Math.min(factor.probabilityLow, factor.probabilityHigh));
    const high = clampProbability(
      Math.max(factor.probabilityLow, factor.probabilityHigh),
    );
    return [low, high];
  }

  const width = CONFIDENCE_WIDTH[factor.evidenceConfidence];
  const center = clampProbability(factor.probability);
  return [clampProbability(center - width), clampProbability(center + width)];
}

function sampleProbability(factor: Factor, rng: () => number): number {
  const [low, high] = probabilityRange(factor);
  const mode = clampProbability(factor.probability);

  if (high - low <= 0.000001) {
    return low;
  }

  if (factor.evidenceConfidence === "strong") {
    return sampleTriangular(low, high, mode, rng);
  }

  if (factor.evidenceConfidence === "some") {
    const triangular = sampleTriangular(low, high, mode, rng);
    const uniform = low + (high - low) * rng();
    return clampProbability(triangular * 0.7 + uniform * 0.3);
  }

  const uniform = low + (high - low) * rng();
  const tail = (rng() - 0.5) * (high - low) * 0.35;
  return clampProbability(uniform + tail);
}

function sampleTriangular(
  low: number,
  high: number,
  mode: number,
  rng: () => number,
): number {
  const u = rng();
  const c = (mode - low) / (high - low);

  if (u <= c) {
    return low + Math.sqrt(u * (high - low) * (mode - low));
  }

  return high - Math.sqrt((1 - u) * (high - low) * (high - mode));
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) /
    values.length;
  return Math.sqrt(variance);
}

export function runDecisionSimulation(
  decision: Decision,
  options?: SimulationOptions,
): DecisionSimulationResult {
  const iterations = Math.max(100, options?.iterations ?? 10000);
  const rng = options?.rng ?? Math.random;

  const scoreSeriesByAlternative = new Map<string, number[]>();
  const winCountsByAlternative = new Map<string, number>();

  decision.alternatives.forEach((alternative) => {
    scoreSeriesByAlternative.set(alternative.id, []);
    winCountsByAlternative.set(alternative.id, 0);
  });

  for (let i = 0; i < iterations; i += 1) {
    const scenarioShock = (rng() - 0.5) * 0.08;
    const sampledFactors = decision.factors.map((factor) => ({
      ...factor,
      probability: clampProbability(sampleProbability(factor, rng) + scenarioShock),
    }));

    const sampledScores = decision.alternatives.map((alternative) =>
      scoreAlternative(
        alternative,
        decision.categories,
        sampledFactors,
        decision.constraints,
      ),
    );

    sampledScores.forEach((score) => {
      if (score.score !== null && Number.isFinite(score.score)) {
        scoreSeriesByAlternative.get(score.alternativeId)?.push(score.score);
      }
    });

    const rankedPass = sampledScores
      .filter((score) => score.gate === "PASS" && score.score !== null)
      .sort((a, b) => (b.score as number) - (a.score as number));

    if (rankedPass.length > 0) {
      const winnerId = rankedPass[0].alternativeId;
      winCountsByAlternative.set(
        winnerId,
        (winCountsByAlternative.get(winnerId) ?? 0) + 1,
      );
    }
  }

  const riskLambda = RISK_LAMBDA[decision.riskPreference];
  const alternativeStats: SimulationAlternativeStats[] = decision.alternatives.map(
    (alternative) => {
      const series = scoreSeriesByAlternative.get(alternative.id) ?? [];
      const gate = scoreAlternative(
        alternative,
        decision.categories,
        decision.factors,
        decision.constraints,
      ).gate;

      if (series.length === 0) {
        return {
          alternativeId: alternative.id,
          alternativeName: alternative.name,
          gate,
          meanScore: null,
          scoreStdDev: null,
          minScore: null,
          maxScore: null,
          percentile10: null,
          percentile25: null,
          percentile50: null,
          percentile75: null,
          percentile90: null,
          confidenceBandLow: null,
          confidenceBandHigh: null,
          winProbability: 0,
        };
      }

      const percentile10 = percentile(series, 0.1);
      const percentile25 = percentile(series, 0.25);
      const percentile50 = percentile(series, 0.5);
      const percentile75 = percentile(series, 0.75);
      const percentile90 = percentile(series, 0.9);

      return {
        alternativeId: alternative.id,
        alternativeName: alternative.name,
        gate,
        meanScore: mean(series),
        scoreStdDev: stdDev(series),
        minScore: Math.min(...series),
        maxScore: Math.max(...series),
        percentile10,
        percentile25,
        percentile50,
        percentile75,
        percentile90,
        confidenceBandLow: percentile(series, CONFIDENCE_BAND_PERCENTILES.low),
        confidenceBandHigh: percentile(series, CONFIDENCE_BAND_PERCENTILES.high),
        winProbability: (winCountsByAlternative.get(alternative.id) ?? 0) / iterations,
      };
    },
  );

  const rankedByRiskAdjustedMean = [...alternativeStats]
    .filter((entry) => entry.gate === "PASS" && entry.meanScore !== null)
    .sort((a, b) => {
      const aAdjusted = (a.meanScore as number) - riskLambda * (a.scoreStdDev as number);
      const bAdjusted = (b.meanScore as number) - riskLambda * (b.scoreStdDev as number);
      return bAdjusted - aAdjusted;
    });

  const recommendedAlternativeId = rankedByRiskAdjustedMean[0]?.alternativeId;
  const robustness = rankedByRiskAdjustedMean[0]?.winProbability ?? 0;

  return {
    iterations,
    recommendedAlternativeId,
    robustness,
    alternatives: alternativeStats,
  };
}

import {
  type Alternative,
  type AlternativeScore,
  type Category,
  type Constraint,
  type Decision,
  type DecisionResult,
  type Factor,
  type GateStatus,
  type RecommendationStatus,
} from "@/domain/types";

const GRAVITY_MAP: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 1,
  2: 3,
  3: 8,
  4: 20,
  5: 50,
};

const DECAY = [1, 0.6, 0.35, 0.2, 0.1];

const RISK_LAMBDA: Record<Decision["riskPreference"], number> = {
  comfortable: 0,
  balanced: 0.5,
  cautious: 1,
};

const CONFIDENCE_WIDTH: Record<Factor["evidenceConfidence"], number> = {
  strong: 0.1,
  some: 0.25,
  intuition: 0.45,
};

const MUST_NOT_FAIL_THRESHOLD = 0.25;
const RECOMMENDED_MARGIN = 5;
const TOO_CLOSE_MARGIN = 2;

const HIGH_STAKES_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /medical|health|treatment|surgery|diagnosis/i, label: "medical" },
  { pattern: /legal|law|contract|court|lawsuit/i, label: "legal" },
  { pattern: /tax|vat|irs|fiscal/i, label: "tax" },
  { pattern: /invest|portfolio|stock|crypto|bond/i, label: "investment" },
  {
    pattern: /real estate|property|mortgage|apartment|house|land/i,
    label: "real-estate",
  },
];

export function gravityValue(gravity: Factor["gravity"]): number {
  return GRAVITY_MAP[gravity];
}

export function decayedSum(impacts: number[]): number {
  const sorted = [...impacts].sort((a, b) => Math.abs(b) - Math.abs(a));

  return sorted.reduce((total, impact, index) => {
    const multiplier = index < DECAY.length ? DECAY[index] : 0.1;
    return total + impact * multiplier;
  }, 0);
}

function normalizedCategoryWeights(categories: Category[]): Record<string, number> {
  const total = categories.reduce((sum, category) => sum + category.weight, 0);

  if (total <= 0) {
    const evenWeight = categories.length > 0 ? 1 / categories.length : 0;
    return categories.reduce<Record<string, number>>((acc, category) => {
      acc[category.id] = evenWeight;
      return acc;
    }, {});
  }

  return categories.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = category.weight / total;
    return acc;
  }, {});
}

export function factorImpact(factor: Factor, categoryWeight: number): number {
  const direction = factor.direction === "pro" ? 1 : -1;
  const probability = Math.max(0, Math.min(1, factor.probability));
  return direction * categoryWeight * gravityValue(factor.gravity) * probability;
}

function categoryScoreForAlternative(
  alternativeId: string,
  categoryId: string,
  allFactors: Factor[],
  categoryWeight: number,
): number {
  const impacts = allFactors
    .filter(
      (factor) =>
        factor.alternativeId === alternativeId && factor.categoryId === categoryId,
    )
    .map((factor) => factorImpact(factor, categoryWeight));

  const pros = impacts.filter((impact) => impact > 0);
  const cons = impacts.filter((impact) => impact < 0).map(Math.abs);

  return decayedSum(pros) - decayedSum(cons);
}

export function gateCheck(
  alternativeId: string,
  constraints: Constraint[],
): GateStatus {
  const relevant = constraints.filter((constraint) =>
    constraint.appliesToAlternativeIds.includes(alternativeId),
  );

  for (const constraint of relevant) {
    if (constraint.type === "must_have" && !constraint.satisfied) {
      return "FAIL";
    }

    if (
      constraint.type === "must_not" &&
      (constraint.violationProbability ?? 0) >= MUST_NOT_FAIL_THRESHOLD
    ) {
      return "FAIL";
    }

    if (constraint.type === "dealbreaker" && !constraint.mitigated) {
      return "BLOCKED";
    }
  }

  return "PASS";
}

export function scoreAlternative(
  alternative: Alternative,
  categories: Category[],
  factors: Factor[],
  constraints: Constraint[],
): AlternativeScore {
  const gate = gateCheck(alternative.id, constraints);

  if (gate === "FAIL") {
    return {
      alternativeId: alternative.id,
      alternativeName: alternative.name,
      gate,
      score: Number.NEGATIVE_INFINITY,
      categoryScores: {},
    };
  }

  if (gate === "BLOCKED") {
    return {
      alternativeId: alternative.id,
      alternativeName: alternative.name,
      gate,
      score: null,
      categoryScores: {},
    };
  }

  const weights = normalizedCategoryWeights(categories);
  const categoryScores = categories.reduce<Record<string, number>>(
    (acc, category) => {
      acc[category.id] = categoryScoreForAlternative(
        alternative.id,
        category.id,
        factors,
        weights[category.id] ?? 0,
      );

      return acc;
    },
    {},
  );

  const score = Object.values(categoryScores).reduce(
    (sum, categoryScore) => sum + categoryScore,
    0,
  );

  return {
    alternativeId: alternative.id,
    alternativeName: alternative.name,
    gate,
    score,
    categoryScores,
  };
}

function rankAlternatives(scores: AlternativeScore[]): AlternativeScore[] {
  return [...scores].sort((a, b) => {
    if (a.score === null && b.score === null) {
      return 0;
    }

    if (a.score === null) {
      return 1;
    }

    if (b.score === null) {
      return -1;
    }

    return b.score - a.score;
  });
}

function topContributors(
  factors: Factor[],
  decision: Decision,
  alternativeId: string,
): { topReasons: Factor[]; topRisks: Factor[] } {
  const categoryWeight = normalizedCategoryWeights(decision.categories);

  const alternativeFactors = factors
    .filter((factor) => factor.alternativeId === alternativeId)
    .map((factor) => ({
      factor,
      impact: factorImpact(factor, categoryWeight[factor.categoryId] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const topReasons = alternativeFactors
    .filter((entry) => entry.impact > 0)
    .slice(0, 3)
    .map((entry) => entry.factor);

  const topRisks = alternativeFactors
    .filter((entry) => entry.impact < 0)
    .slice(0, 3)
    .map((entry) => entry.factor);

  return { topReasons, topRisks };
}

function detectMoreDataNeeded(decision: Decision, topAlternativeId?: string): boolean {
  if (!topAlternativeId) {
    return false;
  }

  return decision.factors.some(
    (factor) =>
      factor.alternativeId === topAlternativeId &&
      factor.gravity >= 4 &&
      factor.evidenceConfidence !== "strong",
  );
}

function flipConditions(
  decision: Decision,
  rankedScores: AlternativeScore[],
): string[] {
  const [top, second] = rankedScores.filter((entry) => entry.gate === "PASS");

  if (!top || !second || top.score === null || second.score === null) {
    return [];
  }

  const margin = top.score - second.score;
  const flippedByRisk =
    decision.riskPreference !== "comfortable" && margin < RECOMMENDED_MARGIN + 1;
  const conditions: string[] = [];

  if (margin < RECOMMENDED_MARGIN) {
    conditions.push(
      `If key assumptions shift by about ${margin.toFixed(1)} points, ${second.alternativeName} can overtake ${top.alternativeName}.`,
    );
  }

  if (flippedByRisk) {
    conditions.push(
      `${top.alternativeName} weakens for cautious profiles because uncertainty penalty (lambda=${RISK_LAMBDA[decision.riskPreference]}) reduces narrow leads.`,
    );
  }

  return conditions;
}

function nextBestData(decision: Decision, topAlternativeId?: string): string[] {
  if (!topAlternativeId) {
    return [];
  }

  const candidates = decision.factors
    .filter((factor) => factor.alternativeId === topAlternativeId)
    .map((factor) => {
      const uncertaintyWidth = CONFIDENCE_WIDTH[factor.evidenceConfidence];
      const sensitivity = gravityValue(factor.gravity) * factor.probability;
      const priority = gravityValue(factor.gravity) * uncertaintyWidth * sensitivity;

      return { factor, priority };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(
      ({ factor }) =>
        `Collect stronger evidence for "${factor.description}" (${factor.evidenceConfidence} confidence).`,
    );

  return candidates;
}

function decideStatus(
  ranked: AlternativeScore[],
  moreDataNeeded: boolean,
): RecommendationStatus {
  const passOnly = ranked.filter((entry) => entry.gate === "PASS" && entry.score !== null);

  if (passOnly.length === 0) {
    return "not_recommended";
  }

  if (moreDataNeeded) {
    return "more_data_needed";
  }

  if (passOnly.length === 1) {
    return "recommended";
  }

  const [top, second] = passOnly;
  const margin = (top.score as number) - (second.score as number);

  if (margin < TOO_CLOSE_MARGIN) {
    return "too_close";
  }

  if (margin < RECOMMENDED_MARGIN) {
    return "leaning";
  }

  return "recommended";
}

function detectGuardrailWarnings(decision: Decision): string[] {
  const haystack = [
    decision.title,
    decision.description,
    ...decision.constraints.map((constraint) => constraint.description),
    ...decision.factors.map((factor) => factor.description),
  ].join("\n");

  const matchedDomains = HIGH_STAKES_PATTERNS.filter(({ pattern }) =>
    pattern.test(haystack),
  ).map(({ label }) => label);

  if (matchedDomains.length === 0) {
    return [];
  }

  return [
    `This decision includes ${matchedDomains.join(", ")} considerations. Verify facts and consult a qualified professional before acting.`,
  ];
}

export function buildDecisionResult(decision: Decision): DecisionResult {
  const rawScores = decision.alternatives.map((alternative) =>
    scoreAlternative(
      alternative,
      decision.categories,
      decision.factors,
      decision.constraints,
    ),
  );

  const ranked = rankAlternatives(rawScores);
  const bestPass = ranked.find((entry) => entry.gate === "PASS" && entry.score !== null);
  const topAlternativeId = bestPass?.alternativeId;
  const moreDataNeeded = detectMoreDataNeeded(decision, topAlternativeId);
  const status = decideStatus(ranked, moreDataNeeded);

  const { topReasons, topRisks } = topAlternativeId
    ? topContributors(decision.factors, decision, topAlternativeId)
    : { topReasons: [], topRisks: [] };

  return {
    recommendedAlternativeId:
      status === "not_recommended" ? undefined : topAlternativeId,
    status,
    scores: ranked,
    topReasons,
    topRisks,
    flipConditions: flipConditions(decision, ranked),
    nextBestData: nextBestData(decision, topAlternativeId),
    guardrailWarnings: detectGuardrailWarnings(decision),
  };
}

export function formatStatusLabel(status: RecommendationStatus): string {
  switch (status) {
    case "recommended":
      return "Recommended";
    case "leaning":
      return "Leaning Toward";
    case "too_close":
      return "Too Close";
    case "more_data_needed":
      return "More Data Needed";
    case "not_recommended":
      return "Not Recommended";
    default:
      return status;
  }
}

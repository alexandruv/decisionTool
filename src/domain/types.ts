export type RiskPreference = "comfortable" | "balanced" | "cautious";

export type ConstraintType = "must_have" | "must_not" | "dealbreaker";

export type EvidenceConfidence = "strong" | "some" | "intuition";

export type RecommendationStatus =
  | "recommended"
  | "leaning"
  | "too_close"
  | "more_data_needed"
  | "not_recommended";

export type Decision = {
  id: string;
  title: string;
  description: string;
  alternatives: Alternative[];
  categories: Category[];
  factors: Factor[];
  constraints: Constraint[];
  riskPreference: RiskPreference;
  createdAt: string;
  updatedAt: string;
};

export type Alternative = {
  id: string;
  name: string;
  description?: string;
};

export type Category = {
  id: string;
  name: string;
  weight: number;
};

export type Factor = {
  id: string;
  alternativeId: string;
  categoryId: string;
  description: string;
  direction: "pro" | "con";
  gravity: 1 | 2 | 3 | 4 | 5;
  probability: number;
  evidenceConfidence: EvidenceConfidence;
  constraintType?: "none" | ConstraintType;
  mitigated?: boolean;
};

export type Constraint = {
  id: string;
  description: string;
  type: ConstraintType;
  appliesToAlternativeIds: string[];
  satisfied: boolean;
  violationProbability?: number;
  mitigated?: boolean;
};

export type GateStatus = "PASS" | "WARNING" | "BLOCKED" | "FAIL";

export type AlternativeScore = {
  alternativeId: string;
  alternativeName: string;
  gate: GateStatus;
  score: number | null;
  categoryScores: Record<string, number>;
};

export type DecisionResult = {
  recommendedAlternativeId?: string;
  status: RecommendationStatus;
  scores: AlternativeScore[];
  topReasons: Factor[];
  topRisks: Factor[];
  flipConditions: string[];
  nextBestData: string[];
};

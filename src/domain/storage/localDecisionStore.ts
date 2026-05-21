import { type Constraint, type EvidenceConfidence, type RiskPreference } from "@/domain/types";

export type FactorDraftSnapshot = {
  description: string;
  alternativeName: string;
  categoryName: string;
  direction: "pro" | "con";
  gravity: 1 | 2 | 3 | 4 | 5;
  probability: number;
  probabilityLow?: number;
  probabilityHigh?: number;
  evidenceConfidence: EvidenceConfidence;
};

export type ConstraintDraftSnapshot = {
  description: string;
  type: Constraint["type"];
  appliesToAlternativeName: string;
  satisfied: boolean;
  violationProbability?: number;
  mitigated?: boolean;
};

export type DecisionDraftSnapshot = {
  id: string;
  savedAt: string;
  title: string;
  description: string;
  riskPreference: RiskPreference;
  alternatives: string[];
  categories: Array<{ name: string; weight: number }>;
  factors: FactorDraftSnapshot[];
  constraints: ConstraintDraftSnapshot[];
};

const STORAGE_KEY = "decision-tool.drafts.v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAll(): DecisionDraftSnapshot[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as DecisionDraftSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: DecisionDraftSnapshot[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listDecisionDrafts(): DecisionDraftSnapshot[] {
  return readAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function saveDecisionDraft(
  draft: Omit<DecisionDraftSnapshot, "savedAt">,
): DecisionDraftSnapshot[] {
  const existing = readAll();
  const nextEntry: DecisionDraftSnapshot = {
    ...draft,
    savedAt: new Date().toISOString(),
  };

  const withoutCurrent = existing.filter((entry) => entry.id !== draft.id);
  const updated = [nextEntry, ...withoutCurrent];

  writeAll(updated);
  return updated;
}

export function loadDecisionDraft(id: string): DecisionDraftSnapshot | undefined {
  return readAll().find((entry) => entry.id === id);
}

export function deleteDecisionDraft(id: string): DecisionDraftSnapshot[] {
  const filtered = readAll().filter((entry) => entry.id !== id);
  writeAll(filtered);
  return filtered;
}

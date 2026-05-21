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

export type DecisionDraftHistoryEntry = {
  id: string;
  draftId: string;
  savedAt: string;
  status: "recommended" | "leaning" | "too_close" | "more_data_needed" | "not_recommended";
  recommendedAlternativeId?: string;
  recommendedAlternativeName?: string;
  topAlternativeScore: number | null;
  robustness: number | null;
  winProbability: number | null;
};

export type DecisionDraftHistorySummary = {
  status: DecisionDraftHistoryEntry["status"];
  recommendedAlternativeId?: string;
  recommendedAlternativeName?: string;
  topAlternativeScore: number | null;
  robustness: number | null;
  winProbability: number | null;
};

const STORAGE_KEY = "decision-tool.drafts.v1";
const HISTORY_KEY = "decision-tool.history.v1";

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

function readHistory(): DecisionDraftHistoryEntry[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(HISTORY_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as DecisionDraftHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: DecisionDraftHistoryEntry[]): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function listDecisionDrafts(): DecisionDraftSnapshot[] {
  return readAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function listDecisionDraftHistory(draftId: string): DecisionDraftHistoryEntry[] {
  return readHistory()
    .filter((entry) => entry.draftId === draftId)
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

export function saveDecisionDraft(
  draft: Omit<DecisionDraftSnapshot, "savedAt">,
  historySummary?: DecisionDraftHistorySummary,
): DecisionDraftSnapshot[] {
  const savedAt = new Date().toISOString();
  const existing = readAll();
  const nextEntry: DecisionDraftSnapshot = {
    ...draft,
    savedAt,
  };

  const withoutCurrent = existing.filter((entry) => entry.id !== draft.id);
  const updated = [nextEntry, ...withoutCurrent];

  writeAll(updated);

  if (historySummary) {
    const history = readHistory();
    const entry: DecisionDraftHistoryEntry = {
      id: crypto.randomUUID(),
      draftId: draft.id,
      savedAt,
      ...historySummary,
    };
    const draftHistory = history.filter((item) => item.draftId === draft.id);
    const otherHistory = history.filter((item) => item.draftId !== draft.id);
    const trimmedDraftHistory = [...draftHistory, entry].slice(-30);

    writeHistory([...otherHistory, ...trimmedDraftHistory]);
  }

  return updated;
}

export function loadDecisionDraft(id: string): DecisionDraftSnapshot | undefined {
  return readAll().find((entry) => entry.id === id);
}

export function deleteDecisionDraft(id: string): DecisionDraftSnapshot[] {
  const filtered = readAll().filter((entry) => entry.id !== id);
  const filteredHistory = readHistory().filter((entry) => entry.draftId !== id);
  writeAll(filtered);
  writeHistory(filteredHistory);
  return filtered;
}

"use client";

import { useMemo, useState } from "react";

import {
  buildDecisionResult,
  formatStatusLabel,
} from "@/domain/scoring/engine";
import { buildDecisionMarkdown } from "@/domain/export/decisionMarkdown";
import {
  applySimulationRecommendationPolicy,
  DEFAULT_RECOMMENDATION_THRESHOLDS,
} from "@/domain/scoring/recommendationPolicy";
import { runDecisionSimulation } from "@/domain/scoring/simulation";
import {
  type Constraint,
  type Decision,
  type EvidenceConfidence,
  type Factor,
  type RiskPreference,
} from "@/domain/types";
import {
  deleteDecisionDraft,
  listDecisionDrafts,
  loadDecisionDraft,
  saveDecisionDraft,
  type DecisionDraftSnapshot,
} from "@/domain/storage/localDecisionStore";

type FactorDraft = {
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

type ConstraintDraft = {
  description: string;
  type: Constraint["type"];
  appliesToAlternativeName: string;
  satisfied: boolean;
  violationProbability?: number;
  mitigated?: boolean;
};

const STEP_TITLES = [
  "Describe Decision",
  "Define Alternatives",
  "Define Categories",
  "Set Category Weights",
  "Add Factor Cards",
  "Rate Factors",
  "Constraints and Risk",
  "Run and Review",
];

export default function Home() {
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [savedDrafts, setSavedDrafts] = useState<DecisionDraftSnapshot[]>(() =>
    listDecisionDrafts(),
  );
  const [savedDraftId, setSavedDraftId] = useState(() => {
    const drafts = listDecisionDrafts();
    return drafts[0]?.id ?? "";
  });
  const [storageMessage, setStorageMessage] = useState("");
  const [recommendedWinThreshold, setRecommendedWinThreshold] = useState(
    DEFAULT_RECOMMENDATION_THRESHOLDS.recommendedWinProbability,
  );
  const [robustnessThreshold, setRobustnessThreshold] = useState(
    DEFAULT_RECOMMENDATION_THRESHOLDS.recommendedRobustness,
  );
  const [tooCloseThreshold, setTooCloseThreshold] = useState(
    DEFAULT_RECOMMENDATION_THRESHOLDS.tooCloseWinProbability,
  );
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("Should I sell my apartment now?");
  const [description, setDescription] = useState(
    "I want to compare selling now versus keeping the property.",
  );
  const [riskPreference, setRiskPreference] = useState<RiskPreference>(
    "balanced",
  );
  const [alternatives, setAlternatives] = useState<string[]>([
    "Sell now",
    "Keep and live in it",
    "Keep and rent it out",
  ]);
  const [categories, setCategories] = useState<Array<{ name: string; weight: number }>>([
    { name: "Wealth", weight: 0.25 },
    { name: "Liquidity", weight: 0.2 },
    { name: "Housing Security", weight: 0.25 },
    { name: "Stress", weight: 0.15 },
    { name: "Family Obligations", weight: 0.15 },
  ]);
  const [factors, setFactors] = useState<FactorDraft[]>([
    {
      description: "Immediate access to sale proceeds.",
      alternativeName: "Sell now",
      categoryName: "Liquidity",
      direction: "pro",
      gravity: 4,
      probability: 0.95,
      probabilityLow: 0.9,
      probabilityHigh: 0.98,
      evidenceConfidence: "strong",
    },
    {
      description: "Need to rent before next purchase.",
      alternativeName: "Sell now",
      categoryName: "Housing Security",
      direction: "con",
      gravity: 4,
      probability: 0.7,
      probabilityLow: 0.5,
      probabilityHigh: 0.85,
      evidenceConfidence: "some",
    },
  ]);
  const [constraints, setConstraints] = useState<ConstraintDraft[]>([
    {
      description: "Must be able to repay parents.",
      type: "must_have",
      appliesToAlternativeName: "Sell now",
      satisfied: true,
    },
  ]);

  const decision = useMemo((): Decision => {
    const now = new Date().toISOString();
    const alternativeLookup = new Map(
      alternatives
        .filter((name) => name.trim().length > 0)
        .map((name, index) => [name, `a-${index + 1}`]),
    );
    const categoryLookup = new Map(
      categories
        .filter((category) => category.name.trim().length > 0)
        .map((category, index) => [category.name, `c-${index + 1}`]),
    );

    const normalizedAlternatives = alternatives
      .filter((name) => name.trim().length > 0)
      .map((name, index) => ({ id: `a-${index + 1}`, name }));

    const normalizedCategories = categories
      .filter((category) => category.name.trim().length > 0)
      .map((category, index) => ({
        id: `c-${index + 1}`,
        name: category.name,
        weight: category.weight,
      }));

    const normalizedFactors: Factor[] = factors
      .filter(
        (factor) =>
          factor.description.trim().length > 0 &&
          alternativeLookup.has(factor.alternativeName) &&
          categoryLookup.has(factor.categoryName),
      )
      .map((factor, index) => ({
        id: `f-${index + 1}`,
        alternativeId: alternativeLookup.get(factor.alternativeName) as string,
        categoryId: categoryLookup.get(factor.categoryName) as string,
        description: factor.description,
        direction: factor.direction,
        gravity: factor.gravity,
        probability: factor.probability,
        probabilityLow: factor.probabilityLow,
        probabilityHigh: factor.probabilityHigh,
        evidenceConfidence: factor.evidenceConfidence,
      }));

    const normalizedConstraints: Constraint[] = constraints
      .filter(
        (constraint) =>
          constraint.description.trim().length > 0 &&
          alternativeLookup.has(constraint.appliesToAlternativeName),
      )
      .map((constraint, index) => ({
        id: `k-${index + 1}`,
        description: constraint.description,
        type: constraint.type,
        appliesToAlternativeIds: [
          alternativeLookup.get(constraint.appliesToAlternativeName) as string,
        ],
        satisfied: constraint.satisfied,
        violationProbability: constraint.violationProbability,
        mitigated: constraint.mitigated,
      }));

    return {
      id: "d-live",
      title,
      description,
      alternatives: normalizedAlternatives,
      categories: normalizedCategories,
      factors: normalizedFactors,
      constraints: normalizedConstraints,
      riskPreference,
      createdAt: now,
      updatedAt: now,
    };
  }, [alternatives, categories, constraints, description, factors, riskPreference, title]);

  const canRun =
    decision.alternatives.length >= 3 &&
    decision.categories.length > 0 &&
    decision.factors.length > 0;

  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const invalidCategoryWeightIndices: number[] = [];
    const invalidFactorLikelyIndices: number[] = [];
    const invalidFactorLowIndices: number[] = [];
    const invalidFactorHighIndices: number[] = [];
    const invalidFactorRangeOrderIndices: number[] = [];
    const factorLikelyOutsideRangeIndices: number[] = [];

    const weightSum = categories.reduce((sum, category) => sum + category.weight, 0);

    if (Math.abs(weightSum - 1) > 0.01) {
      warnings.push(
        `Category weights currently sum to ${weightSum.toFixed(2)} (target: 1.00).`,
      );
    }

    categories.forEach((category, index) => {
      if (category.weight < 0 || category.weight > 1) {
        invalidCategoryWeightIndices.push(index);
        errors.push(
          `Category ${index + 1} (${category.name || "Unnamed"}) weight must be between 0 and 1.`,
        );
      }
    });

    factors.forEach((factor, index) => {
      const label = factor.description || `Factor ${index + 1}`;

      if (factor.probability < 0 || factor.probability > 1) {
        invalidFactorLikelyIndices.push(index);
        errors.push(`${label}: likely probability must be between 0 and 1.`);
      }

      if (typeof factor.probabilityLow === "number") {
        if (factor.probabilityLow < 0 || factor.probabilityLow > 1) {
          invalidFactorLowIndices.push(index);
          errors.push(`${label}: low probability must be between 0 and 1.`);
        }
      }

      if (typeof factor.probabilityHigh === "number") {
        if (factor.probabilityHigh < 0 || factor.probabilityHigh > 1) {
          invalidFactorHighIndices.push(index);
          errors.push(`${label}: high probability must be between 0 and 1.`);
        }
      }

      if (
        typeof factor.probabilityLow === "number" &&
        typeof factor.probabilityHigh === "number"
      ) {
        if (factor.probabilityLow > factor.probabilityHigh) {
          invalidFactorRangeOrderIndices.push(index);
          errors.push(`${label}: low probability cannot be greater than high probability.`);
        }

        if (
          factor.probability < factor.probabilityLow ||
          factor.probability > factor.probabilityHigh
        ) {
          factorLikelyOutsideRangeIndices.push(index);
          warnings.push(
            `${label}: likely probability is outside the selected low/high range.`,
          );
        }
      }
    });

    return {
      errors,
      warnings,
      invalidCategoryWeightIndices,
      invalidFactorLikelyIndices,
      invalidFactorLowIndices,
      invalidFactorHighIndices,
      invalidFactorRangeOrderIndices,
      factorLikelyOutsideRangeIndices,
    };
  }, [categories, factors]);

  const canAnalyze = canRun && validation.errors.length === 0;
  const result = useMemo(() => buildDecisionResult(decision), [decision]);
  const simulationResult = useMemo(
    () => (canAnalyze ? runDecisionSimulation(decision, { iterations: 3000 }) : null),
    [canAnalyze, decision],
  );
  const policyRecommendation = useMemo(
    () =>
      applySimulationRecommendationPolicy(result, simulationResult, {
        recommendedWinProbability: recommendedWinThreshold,
        recommendedRobustness: robustnessThreshold,
        tooCloseWinProbability: tooCloseThreshold,
      }),
    [result, simulationResult, recommendedWinThreshold, robustnessThreshold, tooCloseThreshold],
  );

  function updateAlternative(index: number, value: string) {
    setAlternatives((current) =>
      current.map((entry, idx) => (idx === index ? value : entry)),
    );
  }

  function updateCategoryName(index: number, value: string) {
    setCategories((current) =>
      current.map((entry, idx) =>
        idx === index ? { ...entry, name: value } : entry,
      ),
    );
  }

  function updateCategoryWeight(index: number, value: number) {
    setCategories((current) =>
      current.map((entry, idx) =>
        idx === index ? { ...entry, weight: value } : entry,
      ),
    );
  }

  function updateFactor(index: number, patch: Partial<FactorDraft>) {
    setFactors((current) =>
      current.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry)),
    );
  }

  function updateConstraint(index: number, patch: Partial<ConstraintDraft>) {
    setConstraints((current) =>
      current.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry)),
    );
  }

  function clearStorageMessage() {
    window.setTimeout(() => setStorageMessage(""), 2500);
  }

  function handleSaveDraft() {
    const updated = saveDecisionDraft({
      id: draftId,
      title,
      description,
      riskPreference,
      alternatives,
      categories,
      factors,
      constraints,
    });

    setSavedDrafts(updated);
    setSavedDraftId(draftId);
    setStorageMessage("Draft saved locally.");
    clearStorageMessage();
  }

  function handleLoadDraft() {
    if (!savedDraftId) {
      return;
    }

    const loaded = loadDecisionDraft(savedDraftId);

    if (!loaded) {
      setStorageMessage("Selected draft was not found.");
      clearStorageMessage();
      return;
    }

    setDraftId(loaded.id);
    setTitle(loaded.title);
    setDescription(loaded.description);
    setRiskPreference(loaded.riskPreference);
    setAlternatives(loaded.alternatives);
    setCategories(loaded.categories);
    setFactors(loaded.factors);
    setConstraints(loaded.constraints);
    setStorageMessage(`Loaded draft from ${new Date(loaded.savedAt).toLocaleString()}.`);
    clearStorageMessage();
  }

  function handleDeleteDraft() {
    if (!savedDraftId) {
      return;
    }

    const updated = deleteDecisionDraft(savedDraftId);
    setSavedDrafts(updated);
    setSavedDraftId(updated[0]?.id ?? "");
    setStorageMessage("Draft deleted.");
    clearStorageMessage();
  }

  function handleNewDraft() {
    const id = crypto.randomUUID();
    setDraftId(id);
    setSavedDraftId("");
    setStep(0);
    setTitle("Should I sell my apartment now?");
    setDescription("I want to compare selling now versus keeping the property.");
    setRiskPreference("balanced");
    setAlternatives([
      "Sell now",
      "Keep and live in it",
      "Keep and rent it out",
    ]);
    setCategories([
      { name: "Wealth", weight: 0.25 },
      { name: "Liquidity", weight: 0.2 },
      { name: "Housing Security", weight: 0.25 },
      { name: "Stress", weight: 0.15 },
      { name: "Family Obligations", weight: 0.15 },
    ]);
    setFactors([
      {
        description: "Immediate access to sale proceeds.",
        alternativeName: "Sell now",
        categoryName: "Liquidity",
        direction: "pro",
        gravity: 4,
        probability: 0.95,
        probabilityLow: 0.9,
        probabilityHigh: 0.98,
        evidenceConfidence: "strong",
      },
      {
        description: "Need to rent before next purchase.",
        alternativeName: "Sell now",
        categoryName: "Housing Security",
        direction: "con",
        gravity: 4,
        probability: 0.7,
        probabilityLow: 0.5,
        probabilityHigh: 0.85,
        evidenceConfidence: "some",
      },
    ]);
    setConstraints([
      {
        description: "Must be able to repay parents.",
        type: "must_have",
        appliesToAlternativeName: "Sell now",
        satisfied: true,
      },
    ]);
    setStorageMessage("Started a new draft.");
    clearStorageMessage();
  }

  function handleExportMarkdown() {
    const markdown = buildDecisionMarkdown(decision, result);
    const safeTitle = decision.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const fileName = `${safeTitle || "decision"}-${new Date().toISOString().slice(0, 10)}.md`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    setStorageMessage("Markdown export downloaded.");
    clearStorageMessage();
  }

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div
        className="pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(248,206,213,0.55) 0%, rgba(248,206,213,0) 72%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-16 top-64 h-52 w-52 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(194,226,242,0.5) 0%, rgba(194,226,242,0) 70%)",
        }}
      />
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Gravity-Certainty Engine
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-zinc-900 sm:text-5xl">
          Guided Decision Builder
        </h1>
        <p className="mt-2 text-zinc-600 sm:text-[1.02rem]">
          Step {step + 1} of {STEP_TITLES.length}: {STEP_TITLES[step]}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Structure your decision with values, constraints, and uncertainty before acting.
        </p>
        <div className="mt-4 h-2 rounded-full bg-zinc-200">
          <div
            className="h-2 rounded-full bg-zinc-900 transition-all"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <select
            value={savedDraftId}
            onChange={(event) => setSavedDraftId(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select saved draft</option>
            {savedDrafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.title} ({new Date(draft.savedAt).toLocaleDateString()})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleLoadDraft}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Load Draft
          </button>
          <button
            type="button"
            onClick={handleDeleteDraft}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Delete Draft
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleNewDraft}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            New Draft
          </button>
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Export Markdown
          </button>
          <p className="text-sm text-zinc-600">
            Draft ID: <span className="font-mono text-[0.78rem]">{draftId}</span>
          </p>
          {storageMessage && (
            <p className="text-sm font-medium text-emerald-700">{storageMessage}</p>
          )}
        </div>

        {validation.errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="font-semibold">Input errors to fix</p>
            <ul className="mt-1 list-disc pl-5">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Validation warnings</p>
            <ul className="mt-1 list-disc pl-5">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {step === 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-zinc-700">Decision title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
          <label className="mt-4 block text-sm font-medium text-zinc-700">
            Context
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-28 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </section>
      )}

      {step === 1 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Add at least three realistic options you could choose.
          </p>
          <div className="mt-4 space-y-3">
            {alternatives.map((alternative, index) => (
              <input
                key={`alternative-${index}`}
                value={alternative}
                onChange={(event) => updateAlternative(index, event.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                placeholder={`Alternative ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAlternatives((current) => [...current, ""])}
            className="mt-4 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Add alternative
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Group factors by value areas that matter most for this decision.
          </p>
          <div className="mt-4 space-y-3">
            {categories.map((category, index) => (
              <input
                key={`category-${index}`}
                value={category.name}
                onChange={(event) => updateCategoryName(index, event.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                placeholder={`Category ${index + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setCategories((current) => [...current, { name: "", weight: 0.1 }])
            }
            className="mt-4 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Add category
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Set category importance using normalized weights between 0 and 1.
          </p>
          <div className="mt-4 space-y-3">
            {categories.map((category, index) => (
              <div key={`weight-${index}`} className="grid gap-2 md:grid-cols-[2fr_1fr]">
                <p className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-700">
                  {category.name || `Category ${index + 1}`}
                </p>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={category.weight}
                  onChange={(event) =>
                    updateCategoryWeight(index, Number(event.target.value))
                  }
                  className={`rounded-lg border px-3 py-2 ${
                    validation.invalidCategoryWeightIndices.includes(index)
                      ? "border-rose-400 bg-rose-50/80"
                      : "border-zinc-300"
                  }`}
                />
                {validation.invalidCategoryWeightIndices.includes(index) && (
                  <p className="text-xs text-rose-700 md:col-span-2">
                    Enter a value between 0 and 1.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Add pro and con factor cards mapped to an alternative and category.
          </p>
          <div className="mt-4 space-y-4">
            {factors.map((factor, index) => (
              <div key={`factor-card-${index}`} className="rounded-lg border border-zinc-200 p-4">
                <input
                  value={factor.description}
                  onChange={(event) =>
                    updateFactor(index, { description: event.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  placeholder="Factor description"
                />
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <select
                    value={factor.alternativeName}
                    onChange={(event) =>
                      updateFactor(index, { alternativeName: event.target.value })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  >
                    {alternatives.map((alternative) => (
                      <option key={alternative} value={alternative}>
                        {alternative}
                      </option>
                    ))}
                  </select>
                  <select
                    value={factor.categoryName}
                    onChange={(event) =>
                      updateFactor(index, { categoryName: event.target.value })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  >
                    {categories.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={factor.direction}
                    onChange={(event) =>
                      updateFactor(index, {
                        direction: event.target.value as "pro" | "con",
                      })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  >
                    <option value="pro">Pro</option>
                    <option value="con">Con</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setFactors((current) => [
                ...current,
                {
                  description: "",
                  alternativeName: alternatives[0] ?? "",
                  categoryName: categories[0]?.name ?? "",
                  direction: "pro",
                  gravity: 3,
                  probability: 0.5,
                  probabilityLow: 0.35,
                  probabilityHigh: 0.65,
                  evidenceConfidence: "some",
                },
              ])
            }
            className="mt-4 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Add factor card
          </button>
        </section>
      )}

      {step === 5 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Rate factor gravity, likely probability, uncertainty range, and evidence confidence.
          </p>
          <div className="mt-4 space-y-4">
            {factors.map((factor, index) => {
              const likelyInvalid = validation.invalidFactorLikelyIndices.includes(index);
              const lowInvalid = validation.invalidFactorLowIndices.includes(index);
              const highInvalid = validation.invalidFactorHighIndices.includes(index);
              const rangeInvalid =
                validation.invalidFactorRangeOrderIndices.includes(index);
              const likelyOutsideRange =
                validation.factorLikelyOutsideRangeIndices.includes(index);
              const hasRowError =
                likelyInvalid || lowInvalid || highInvalid || rangeInvalid;

              return (
                <div
                  key={`factor-rate-${index}`}
                  className={`rounded-lg border p-4 ${
                    hasRowError ? "border-rose-300 bg-rose-50/40" : "border-zinc-200"
                  }`}
                >
                <p className="text-sm text-zinc-700">{factor.description || "Untitled factor"}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-5">
                  <select
                    value={factor.gravity}
                    onChange={(event) =>
                      updateFactor(index, {
                        gravity: Number(event.target.value) as 1 | 2 | 3 | 4 | 5,
                      })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  >
                    <option value={1}>1 - Nice to have</option>
                    <option value={2}>2 - Noticeable</option>
                    <option value={3}>3 - Important</option>
                    <option value={4}>4 - Life-shaping</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={factor.probability}
                    onChange={(event) =>
                      updateFactor(index, { probability: Number(event.target.value) })
                    }
                    className={`rounded-lg border px-3 py-2 ${
                      likelyInvalid ? "border-rose-400 bg-rose-50/80" : "border-zinc-300"
                    }`}
                  />
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={factor.probabilityLow ?? ""}
                    onChange={(event) =>
                      updateFactor(index, {
                        probabilityLow:
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                      })
                    }
                    className={`rounded-lg border px-3 py-2 ${
                      lowInvalid || rangeInvalid
                        ? "border-rose-400 bg-rose-50/80"
                        : "border-zinc-300"
                    }`}
                    placeholder="Low"
                  />
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={factor.probabilityHigh ?? ""}
                    onChange={(event) =>
                      updateFactor(index, {
                        probabilityHigh:
                          event.target.value === ""
                            ? undefined
                            : Number(event.target.value),
                      })
                    }
                    className={`rounded-lg border px-3 py-2 ${
                      highInvalid || rangeInvalid
                        ? "border-rose-400 bg-rose-50/80"
                        : "border-zinc-300"
                    }`}
                    placeholder="High"
                  />
                  <select
                    value={factor.evidenceConfidence}
                    onChange={(event) =>
                      updateFactor(index, {
                        evidenceConfidence: event.target
                          .value as EvidenceConfidence,
                      })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  >
                    <option value="strong">Strong evidence</option>
                    <option value="some">Some evidence</option>
                    <option value="intuition">Mostly intuition</option>
                  </select>
                </div>
                {(hasRowError || likelyOutsideRange) && (
                  <p className="mt-2 text-xs text-rose-700">
                    {hasRowError
                      ? "Fix highlighted probability fields."
                      : "Likely probability is outside your low/high range."}
                  </p>
                )}
              </div>
              );
            })}
          </div>
        </section>
      )}

      {step === 6 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-600">
            Add must-have, must-not, or dealbreaker rules and set risk profile.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-[2fr_1fr]">
            <label className="text-sm font-medium text-zinc-700">Risk preference</label>
            <select
              value={riskPreference}
              onChange={(event) =>
                setRiskPreference(event.target.value as RiskPreference)
              }
              className="rounded-lg border border-zinc-300 px-3 py-2"
            >
              <option value="comfortable">Comfortable with uncertainty</option>
              <option value="balanced">Balanced</option>
              <option value="cautious">Cautious</option>
            </select>
          </div>

          <div className="mt-4 space-y-4">
            {constraints.map((constraint, index) => (
              <div key={`constraint-${index}`} className="rounded-lg border border-zinc-200 p-4">
                <input
                  value={constraint.description}
                  onChange={(event) =>
                    updateConstraint(index, { description: event.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  placeholder="Constraint description"
                />
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <select
                    value={constraint.type}
                    onChange={(event) =>
                      updateConstraint(index, {
                        type: event.target.value as Constraint["type"],
                      })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  >
                    <option value="must_have">Must-Have</option>
                    <option value="must_not">Must-Not</option>
                    <option value="dealbreaker">Dealbreaker</option>
                  </select>
                  <select
                    value={constraint.appliesToAlternativeName}
                    onChange={(event) =>
                      updateConstraint(index, {
                        appliesToAlternativeName: event.target.value,
                      })
                    }
                    className="rounded-lg border border-zinc-300 px-3 py-2"
                  >
                    {alternatives.map((alternative) => (
                      <option key={alternative} value={alternative}>
                        {alternative}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={constraint.satisfied}
                      onChange={(event) =>
                        updateConstraint(index, { satisfied: event.target.checked })
                      }
                    />
                    Satisfied
                  </label>
                  {constraint.type === "must_not" ? (
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={constraint.violationProbability ?? 0}
                      onChange={(event) =>
                        updateConstraint(index, {
                          violationProbability: Number(event.target.value),
                        })
                      }
                      className="rounded-lg border border-zinc-300 px-3 py-2"
                    />
                  ) : (
                    <label className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={constraint.mitigated ?? false}
                        onChange={(event) =>
                          updateConstraint(index, { mitigated: event.target.checked })
                        }
                      />
                      Mitigated
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setConstraints((current) => [
                ...current,
                {
                  description: "",
                  type: "must_have",
                  appliesToAlternativeName: alternatives[0] ?? "",
                  satisfied: true,
                },
              ])
            }
            className="mt-4 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium"
          >
            Add constraint
          </button>
        </section>
      )}

      {step === 7 && (
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {!canAnalyze && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Add required inputs and resolve validation errors before running analysis.
            </p>
          )}

          {result.guardrailWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-amber-900">
              <p className="text-sm font-semibold uppercase tracking-wide">Guardrail Warning</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {result.guardrailWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <article className="grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Status</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {formatStatusLabel(result.status)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4" style={{ background: "linear-gradient(160deg, rgba(219,232,244,0.56) 0%, rgba(255,255,255,0.86) 100%)" }}>
              <p className="text-sm text-zinc-500">Adjusted Status</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {formatStatusLabel(policyRecommendation.status)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Recommended Option</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">
                {policyRecommendation.recommendedAlternativeId ?? "None"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Flip Conditions</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">
                {result.flipConditions.length}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm text-zinc-500">Robustness</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900">
                {simulationResult
                  ? `${(simulationResult.robustness * 100).toFixed(1)}%`
                  : "N/A"}
              </p>
            </div>
          </article>

          <article className="rounded-xl border border-zinc-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
              Confidence Policy Controls
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Tune thresholds to define when recommendations should be strict, cautious, or conservative.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-zinc-700">
                Recommended win threshold
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={recommendedWinThreshold}
                  onChange={(event) =>
                    setRecommendedWinThreshold(Number(event.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-zinc-700">
                Recommended robustness threshold
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={robustnessThreshold}
                  onChange={(event) =>
                    setRobustnessThreshold(Number(event.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-zinc-700">
                Too-close win threshold
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={tooCloseThreshold}
                  onChange={(event) => setTooCloseThreshold(Number(event.target.value))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
            </div>
            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              {policyRecommendation.reason}
            </p>
          </article>

          {simulationResult && (
            <article className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Uncertainty Simulation ({simulationResult.iterations.toLocaleString()} runs)
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-zinc-700">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500">
                      <th className="py-2 pr-4">Alternative</th>
                      <th className="py-2 pr-4">Gate</th>
                      <th className="py-2 pr-4">Mean</th>
                      <th className="py-2 pr-4">Std Dev</th>
                      <th className="py-2 pr-4">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.alternatives.map((alternative) => (
                      <tr
                        key={alternative.alternativeId}
                        className="border-b border-zinc-100"
                      >
                        <td className="py-2 pr-4">{alternative.alternativeName}</td>
                        <td className="py-2 pr-4">{alternative.gate}</td>
                        <td className="py-2 pr-4">
                          {alternative.meanScore === null
                            ? "N/A"
                            : alternative.meanScore.toFixed(2)}
                        </td>
                        <td className="py-2 pr-4">
                          {alternative.scoreStdDev === null
                            ? "N/A"
                            : alternative.scoreStdDev.toFixed(2)}
                        </td>
                        <td className="py-2 pr-4">
                          {(alternative.winProbability * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          )}

          <article className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Top Reasons
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {result.topReasons.length === 0 && <li>No top reasons yet.</li>}
                {result.topReasons.map((factor) => (
                  <li key={factor.id}>{factor.description}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Top Risks
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {result.topRisks.length === 0 && <li>No top risks yet.</li>}
                {result.topRisks.map((factor) => (
                  <li key={factor.id}>{factor.description}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Flip Conditions
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {result.flipConditions.length === 0 && (
                  <li>No material flip conditions detected yet.</li>
                )}
                {result.flipConditions.map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Next Best Data
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {result.nextBestData.length === 0 && (
                  <li>No high-priority data gaps detected.</li>
                )}
                {result.nextBestData.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          </article>
        </section>
      )}

      <section className="sticky bottom-4 z-10 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(current - 1, 0))}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
          disabled={step === 0}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() =>
            setStep((current) => Math.min(current + 1, STEP_TITLES.length - 1))
          }
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          disabled={step === STEP_TITLES.length - 1}
        >
          Next
        </button>
      </section>
    </main>
  );
}

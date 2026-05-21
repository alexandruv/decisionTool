import { formatStatusLabel } from "../scoring/engine";
import { type Decision, type DecisionResult } from "../types";

function findAlternativeName(decision: Decision, alternativeId?: string): string {
  if (!alternativeId) {
    return "None";
  }

  return (
    decision.alternatives.find((alternative) => alternative.id === alternativeId)
      ?.name ?? alternativeId
  );
}

function gateSummary(result: DecisionResult): string {
  const counts = result.scores.reduce<Record<string, number>>((acc, score) => {
    acc[score.gate] = (acc[score.gate] ?? 0) + 1;
    return acc;
  }, {});

  return ["PASS", "WARNING", "BLOCKED", "FAIL"]
    .filter((gate) => counts[gate])
    .map((gate) => `${gate}: ${counts[gate]}`)
    .join(", ");
}

export function buildDecisionMarkdown(
  decision: Decision,
  result: DecisionResult,
): string {
  const recommendedName = findAlternativeName(
    decision,
    result.recommendedAlternativeId,
  );

  const lines: string[] = [
    `# ${decision.title}`,
    "",
    `Saved at: ${new Date().toISOString()}`,
    "",
    "## Decision Context",
    decision.description,
    "",
    "## Recommendation",
    `- Status: ${formatStatusLabel(result.status)}`,
    `- Recommended option: ${recommendedName}`,
    `- Gate summary: ${gateSummary(result) || "No gate data"}`,
    "",
    "## Plain-Language Summary",
    `- What this means: ${
      result.status === "recommended"
        ? `You have a clear front-runner: ${recommendedName}.`
        : result.status === "leaning"
          ? `There is a front-runner (${recommendedName}), but confidence is moderate.`
          : result.status === "too_close"
            ? "The top options are too close to separate confidently."
            : result.status === "more_data_needed"
              ? "The result depends on high-impact factors with weak evidence."
              : "No option is currently safe to recommend under your constraints."
    }`,
    `- Main upside: ${result.topReasons[0]?.description ?? "No dominant upside identified yet."}`,
    `- Main risk: ${result.topRisks[0]?.description ?? "No dominant risk identified yet."}`,
    `- What could change the outcome: ${
      result.flipConditions[0] ??
      result.nextBestData[0] ??
      "No obvious swing trigger detected with current assumptions."
    }`,
    "",
    "## Alternatives",
    ...decision.alternatives.map((alternative) => `- ${alternative.name}`),
    "",
    "## Categories",
    ...decision.categories.map(
      (category) => `- ${category.name}: weight ${category.weight.toFixed(2)}`,
    ),
    "",
    "## Top Reasons",
    ...(result.topReasons.length > 0
      ? result.topReasons.map((factor) => `- ${factor.description}`)
      : ["- None"]),
    "",
    "## Top Risks",
    ...(result.topRisks.length > 0
      ? result.topRisks.map((factor) => `- ${factor.description}`)
      : ["- None"]),
    "",
    "## Decision Flip Conditions",
    ...(result.flipConditions.length > 0
      ? result.flipConditions.map((condition) => `- ${condition}`)
      : ["- No material flip conditions detected."]),
    "",
    "## Next Best Data to Collect",
    ...(result.nextBestData.length > 0
      ? result.nextBestData.map((item) => `- ${item}`)
      : ["- No priority data gaps identified."]),
    "",
    "## Guardrail Warnings",
    ...(result.guardrailWarnings.length > 0
      ? result.guardrailWarnings.map((warning) => `- ${warning}`)
      : ["- No high-stakes guardrails triggered."]),
    "",
    "## Alternative Scores",
    ...result.scores.map((score) => {
      const scoreText = score.score === null ? "N/A" : score.score.toFixed(2);
      return `- ${score.alternativeName}: gate=${score.gate}, score=${scoreText}`;
    }),
    "",
    "## Guardrail Note",
    "This model supports structured thinking and does not replace professional advice for medical, legal, tax, or investment decisions.",
  ];

  return lines.join("\n");
}

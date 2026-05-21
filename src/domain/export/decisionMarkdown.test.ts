import { describe, expect, it } from "vitest";

import { buildDecisionResult } from "../scoring/engine";
import { sampleDecision } from "../scoring/sampleDecision";

import { buildDecisionMarkdown } from "./decisionMarkdown";

describe("buildDecisionMarkdown", () => {
  it("includes core recommendation and explainability sections", () => {
    const result = buildDecisionResult(sampleDecision);
    const markdown = buildDecisionMarkdown(sampleDecision, result);

    expect(markdown).toContain("## Recommendation");
    expect(markdown).toContain("## Decision Flip Conditions");
    expect(markdown).toContain("## Next Best Data to Collect");
    expect(markdown).toContain("## Guardrail Note");
  });
});

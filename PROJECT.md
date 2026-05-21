# Gravity-Certainty Engine

A simple but smart decision-making app that helps people make better choices by separating **feelings**, **facts**, **probability**, **uncertainty**, and **non-negotiable constraints**.

The product should not promise that it can find the objectively perfect decision. A better promise is:

> Based on your values, the available evidence, and the current uncertainty, this is the best-supported decision.

The app is designed for decisions like:

- Should I sell my apartment or keep it?
- Should I rent or buy?
- Should I change jobs?
- Should I move cities?
- Should I invest in one path or another?
- Should I say yes to a risky but promising opportunity?

---

## 1. Core Product Idea

Classic pros-and-cons lists fail because they treat all listed items too equally. Even when users add 1-10 scores, the system can still produce bad conclusions because human scoring is unstable and raw arithmetic can hide catastrophic risks.

This app should help users turn a messy life decision into a transparent model:

```text
Decision = Alternatives + Values + Facts + Probabilities + Constraints + Uncertainty
```

The user experience should feel simple:

1. Describe the decision.
2. Add possible options.
3. Add pros and cons.
4. Mark how much each factor matters.
5. Mark how likely each factor is.
6. Identify any dealbreakers or must-haves.
7. Get a recommendation, confidence level, and explanation.

Under the hood, the app should use a more intelligent engine.

---

## 2. The Three Problems We Are Solving

### 2.1 Accumulation Bias

A naive pros-and-cons list can allow many small positives to outweigh one catastrophic negative.

Example:

```text
+ Nice color
+ Fits in garage
+ Good view
+ Nice balcony
+ Good kitchen handles
- Might make me financially unstable
```

A normal weighted list may still produce a misleading result if enough small pros are added.

The engine fixes this through:

- Non-linear gravity scores.
- Diminishing returns within categories.
- Dealbreaker and must-not rules.
- Grouping duplicate or overlapping reasons.

---

### 2.2 Scale Drift

A user may score something as `7/10` today and `4/10` tomorrow because their mood, fear, or excitement changed.

The engine fixes this through:

- Anchored language instead of raw numbers.
- Relative comparison instead of pure absolute scoring.
- Calibration questions.
- Optional re-checking after a cooling-off period.

Instead of asking:

```text
How important is this from 1 to 10?
```

The app asks:

```text
How serious is this?
1. Nice to have
2. Noticeable
3. Important
4. Life-shaping
5. Unacceptable / critical
```

Then it can ask:

```text
Earlier you marked “repaying my parents” as life-shaping. Is this new factor more important, less important, or similar?
```

---

### 2.3 Certainty Illusion

People often treat things that are certain and things that are merely possible as if they were the same.

Example:

```text
Certain: I have a buyer offering 1,400,000 zł.
Uncertain: My investment may return 8% per year.
Uncertain: Land near Warsaw may become more expensive.
```

The engine fixes this by separating:

- Gravity: how much it matters.
- Probability: how likely it is.
- Evidence confidence: how strong the evidence is.
- Uncertainty: how much the final decision could change if assumptions change.

---

## 3. The Engine: Gravity-Certainty-Constraint Model

The recommended model is the **Gravity-Certainty-Constraint Engine**, or **GCCE**.

It has four core ideas:

1. **Gravity**: how much a factor matters.
2. **Certainty**: how likely the factor is.
3. **Constraints**: whether a factor can veto an option.
4. **Robustness**: whether the recommendation survives uncertainty.

---

## 4. Key Terms

### Decision

The question the user is trying to answer.

Example:

```text
Should I sell my apartment in Kabaty or keep it?
```

### Alternative

A real option the user could choose.

Examples:

```text
- Sell now.
- Keep the apartment and live in it.
- Keep the apartment and rent it out.
- Wait 12 months and reassess.
- Sell now, rent temporarily, invest part of the money, buy land later.
```

### Criterion / Category

A high-level value area used to organize factors.

Examples:

```text
- Wealth
- Liquidity
- Family obligations
- Future home path
- Housing security
- Freedom / flexibility
- Stress
- Downside risk
```

### Factor

A specific pro or con attached to an alternative.

Example:

```text
Selling gives me immediate liquidity.
```

### Gravity

How much the factor matters emotionally, financially, practically, or strategically.

### Probability / Certainty

How likely the factor is to happen or be true.

### Evidence Confidence

How good the evidence is behind the probability estimate.

### Constraint

A non-negotiable rule, such as:

```text
I must be able to repay my parents.
I must not create a serious risk of insolvency.
I must keep at least X zł as an emergency buffer.
```

---

## 5. User-Facing Gravity Scale

The user should not see complicated math. They should choose from simple anchored labels.

| User Choice | Meaning | Engine Value |
|---|---|---:|
| 1 | Nice to have | 1 |
| 2 | Noticeable | 3 |
| 3 | Important | 8 |
| 4 | Life-shaping | 20 |
| 5 | Critical / catastrophic | 50 or veto |

This non-linear mapping is important.

A catastrophic con should not be only five times stronger than a tiny pro. It may need to be fifty times stronger, or it may need to block the option completely.

---

## 6. Probability / Certainty Scale

The user should also choose probability using natural language.

| User Choice | Probability |
|---|---:|
| Almost certain | 95% |
| Likely | 75% |
| Unsure | 50% |
| Unlikely | 25% |
| Rare | 5% |

The app may also allow advanced users to type a custom probability.

---

## 7. Evidence Confidence Scale

Evidence confidence is not the same as probability.

Example:

```text
“The apartment buyer will pay 1,400,000 zł.”
Probability: high.
Evidence confidence: depends on whether there is a signed agreement, deposit, financing, legal review, etc.
```

Suggested evidence levels:

| User Choice | Meaning |
|---|---|
| Strong evidence | Based on documents, data, expert input, or reliable sources |
| Some evidence | Based on partial research, experience, or reasonable estimates |
| Mostly intuition | Based mostly on feelings, guesses, or incomplete information |

Important: the app should not simply reduce the impact of low-confidence items. A low-confidence but high-gravity item should often trigger:

```text
More data needed.
```

---

## 8. Basic Factor Formula

Each factor receives a base impact score.

```text
Impact = Direction × CategoryWeight × GravityValue × Probability
```

Where:

```text
Direction = +1 for a pro
Direction = -1 for a con
```

So:

```text
I_j = S_j × W_category(j) × M(G_j) × P_j
```

Where:

- `I_j` = impact of factor `j`.
- `S_j` = sign, either `+1` or `-1`.
- `W_category(j)` = weight of the category.
- `M(G_j)` = mapped gravity value.
- `P_j` = probability.

Example:

```text
Factor: Selling gives me liquidity.
Direction: +1
Category: Flexibility
Category weight: 0.20
Gravity: 4 → engine value 20
Probability: 95% → 0.95

Impact = +1 × 0.20 × 20 × 0.95
Impact = +3.8
```

Another example:

```text
Factor: I may regret not owning my home.
Direction: -1
Category: Housing security
Category weight: 0.15
Gravity: 4 → engine value 20
Probability: 50% → 0.50

Impact = -1 × 0.15 × 20 × 0.50
Impact = -1.5
```

---

## 9. Category Weights

Some categories matter more than others.

For example, in a housing decision:

| Category | Example Weight |
|---|---:|
| Wealth | 0.25 |
| Liquidity | 0.15 |
| Family obligations | 0.15 |
| Future home path | 0.20 |
| Housing security | 0.15 |
| Stress | 0.10 |

Weights should sum to `1.0`.

The app should avoid asking users to assign abstract weights directly. Instead, it should use simple trade-off questions:

```text
Which matters more in this decision?
A. Maximizing long-term wealth
B. Having housing security
```

Or:

```text
Imagine both are currently bad.
Which improvement would matter more?
A. Going from low liquidity to high liquidity
B. Going from uncertain housing to stable housing
```

This is inspired by swing-weighting logic from multi-criteria decision analysis.

---

## 10. Diminishing Returns to Fix Accumulation Bias

Many small pros in the same category should not be allowed to overwhelm one major con.

Within each alternative and category, sort factors by absolute impact and apply a decay curve.

Suggested decay:

```text
1st factor: 100% weight
2nd factor: 60% weight
3rd factor: 35% weight
4th factor: 20% weight
5th factor and beyond: 10% weight
```

Formula:

```text
CategoryScore = I_1 + 0.6I_2 + 0.35I_3 + 0.2I_4 + 0.1I_5 + ...
```

For clarity, calculate positive and negative factors separately, then combine:

```text
CategoryScore = DecayedPros - DecayedCons
```

Example:

```text
Pros in “comfort”:
+ Nice color
+ Nice balcony
+ Nice handles
+ Good parking

Con in “financial risk”:
- Could create serious debt risk
```

The comfort pros are grouped and decay. The financial risk con stays powerful, especially if marked as high gravity or dealbreaker.

---

## 11. Dealbreakers, Must-Haves, and Must-Nots

The app should treat some factors as constraints, not as normal pros or cons.

### Must-Have

A condition that must be satisfied.

Example:

```text
I must be able to repay my parents.
```

### Must-Not

A condition that must not happen.

Example:

```text
I must not create a serious risk of financial instability.
```

### Dealbreaker

A factor that blocks an option unless it is mitigated, disproven, or explicitly accepted by the user.

Example:

```text
This option creates a realistic risk that I cannot afford housing later.
```

### Important Rule

A critical pro should not automatically cancel a dealbreaker con.

Instead:

```text
A dealbreaker can only be removed if:
1. The risk is shown to be much less likely.
2. The risk is mitigated.
3. The user explicitly downgrades it from dealbreaker to serious-but-acceptable.
4. Every other option fails an even more important must-have condition.
```

This prevents dangerous math.

---

## 12. Constraint Gate

Before scoring, each alternative should pass through a gate check.

Possible statuses:

```text
PASS        - no hard constraints violated
WARNING     - serious risk exists but may be acceptable or mitigatable
BLOCKED     - option cannot be recommended until mitigation is added
FAIL        - option violates a non-negotiable rule
```

If an option fails a hard constraint, it should not win simply because it has many attractive pros.

Pseudocode:

```pseudo
function gateCheck(option):
    for constraint in option.constraints:
        if constraint.type == "must_have" and not constraint.satisfied:
            return FAIL

        if constraint.type == "must_not" and constraint.violation_probability >= threshold:
            return FAIL

        if constraint.type == "dealbreaker" and not constraint.mitigated:
            return BLOCKED

    return PASS
```

---

## 13. Total Option Score

After applying category decay and constraints, calculate the score for each alternative.

```text
BaseScore(option) = Σ CategoryScore(option, category)
```

Then adjust for uncertainty:

```text
FinalScore(option) = MeanScore(option) - RiskPreference × UncertaintyPenalty(option)
```

Or:

```text
GCCE(a) = μ_a - λσ_a - ConstraintPenalty_a
```

Where:

- `μ_a` = average simulated score for option `a`.
- `σ_a` = uncertainty / volatility of the score.
- `λ` = user’s risk sensitivity.
- `ConstraintPenalty_a` = penalty or exclusion for violated constraints.

Risk preference can be simple:

| User Choice | Risk Value |
|---|---:|
| Comfortable with uncertainty | 0.0 |
| Balanced | 0.5 |
| Cautious | 1.0 |

---

## 14. Uncertainty Engine

The app should not pretend the answer is exact.

For each factor, store:

```text
Likely probability
Low estimate
High estimate
Evidence confidence
```

For MVP, this can be simple:

| Evidence Confidence | Suggested Uncertainty Range |
|---|---:|
| Strong evidence | ±10% |
| Some evidence | ±25% |
| Mostly intuition | ±45% |

Example:

```text
Probability: 75%
Evidence confidence: Some evidence
Range: 56% to 94%
```

The app can then run a simulation:

```pseudo
for simulation in 1..10000:
    for each option:
        sample each uncertain factor
        calculate score
    record winning option
```

Outputs:

```text
Mean score
Uncertainty range
Chance of being best
Robustness
```

---

## 15. Recommendation Rules

The app should not always force a yes/no answer.

Recommended output types:

### Recommended

One option clearly wins, passes constraints, and remains best under uncertainty.

Suggested rule:

```text
Top option leads by at least 5 points
AND chance of being best is at least 70%
AND robustness is at least 80%
AND no hard constraints are violated
```

### Leaning Toward

One option appears better, but uncertainty or margin is not strong enough for a firm recommendation.

### Too Close

The options are genuinely similar.

The app should say:

```text
This is mostly a values decision, not a data decision.
```

### More Data Needed

A high-gravity, low-confidence factor controls the outcome.

The app should say:

```text
You are not ready to decide yet. The decision depends mostly on X.
```

### Not Recommended

The option fails a must-have, must-not, or dealbreaker rule.

---

## 16. What Would Change the Answer?

This should be a core feature.

The app should show decision-flip conditions, such as:

```text
Selling is recommended unless you value housing security above 38% of the whole decision.
```

```text
Keeping the apartment becomes better if expected investment returns fall below 4.2%.
```

```text
Selling becomes risky if land prices near Warsaw rise more than 18% before you buy.
```

```text
The result depends heavily on rental yield. Estimate realistic rent, vacancy, maintenance, and tax before deciding.
```

This makes the app transparent and trustworthy.

---

## 17. Next Best Data to Collect

The app should not only answer:

```text
What should I choose?
```

It should also answer:

```text
What should I learn next?
```

A useful heuristic:

```text
DataPriority = GravityValue × UncertaintyWidth × OutcomeSensitivity
```

Where:

- `GravityValue` = how important the factor is.
- `UncertaintyWidth` = how uncertain the estimate is.
- `OutcomeSensitivity` = how much the final recommendation changes when this factor changes.

The app should surface the top 1-3 missing pieces of information.

Example:

```text
The decision depends mostly on:
1. Expected net return from investing the 500,000 zł.
2. Realistic land prices around Warsaw.
3. Emotional importance of owning versus renting.
```

---

## 18. Suggested User Flow

### Step 1: Describe the Decision

```text
I am deciding whether to sell my apartment in Kabaty for 1,400,000 zł.
```

### Step 2: Define Alternatives

The app suggests options:

```text
1. Sell now.
2. Keep the apartment.
3. Keep and rent it out.
4. Wait 12 months.
5. Sell, rent temporarily, invest part, buy land later.
```

The user can edit these.

### Step 3: Define Categories

The app suggests categories:

```text
Wealth
Liquidity
Family obligations
Future home path
Housing security
Flexibility
Stress
Downside risk
```

### Step 4: Calibrate Category Weights

Use simple trade-off questions instead of raw weights.

Example:

```text
Which improvement matters more?
A. More liquidity
B. More housing security
```

### Step 5: Add Pros and Cons as Factor Cards

Example:

```text
Pro: Selling gives me cash to invest.
Con: Selling means I may need to rent.
Pro: Selling lets me repay my parents.
Con: I may struggle to buy back into the market later.
```

### Step 6: Rate Each Factor

For each factor, ask:

```text
How serious is this?
How likely is it?
How good is your evidence?
Is this a dealbreaker or must-have?
```

### Step 7: Run Engine

The app calculates:

```text
Base score
Constraint status
Uncertainty range
Chance of being best
Decision-flip points
Next best data to collect
```

### Step 8: Final Output

Example:

```text
Recommendation: Leaning toward selling now.
Confidence: Medium-high.
Main reasons: liquidity, ability to repay parents, future land optionality.
Main risks: housing security, investment uncertainty, future land/property prices.
Decision would flip if: owning a home is weighted above 35% of the decision, or if expected investment return falls below X.
Next data to collect: realistic rent, tax/transaction costs, land prices, investment return assumptions.
```

---

## 19. Example: Apartment Decision

### Known Context

The user:

- Lives in Warsaw, Poland.
- Owns a 63 m² apartment in Kabaty.
- Has an offer to sell it for 1,400,000 zł.
- Is considering selling it.
- Would invest 500,000 zł.
- Would allocate 500,000 zł toward buying land around Warsaw.
- Wants to repay debt to parents.
- Is unsure whether owning a home is better than renting while investing capital elsewhere.

### Possible Alternatives

```text
A1: Sell apartment now.
A2: Keep apartment and live in it.
A3: Keep apartment and rent it out.
A4: Wait 12 months and reassess.
A5: Sell now, rent temporarily, invest part of the money, reserve capital for land, repay parents.
```

### Likely Criteria

| Category | Why It Matters |
|---|---|
| Wealth | Net worth, returns, property appreciation |
| Liquidity | Cash available after selling |
| Family obligations | Ability to repay parents |
| Future home path | Ability to buy land and build later |
| Housing security | Emotional and practical stability from owning |
| Flexibility | Ability to move, invest, or change plans |
| Stress | Complexity, uncertainty, decision pressure |
| Downside risk | Bad investment outcomes, property market re-entry risk |

### Potential Must-Haves

```text
- Must repay parents, either immediately or on a clear timeline.
- Must keep a safe cash buffer.
- Must not create serious financial instability.
- Must preserve a realistic path to stable housing.
```

### Important Unknowns

```text
- Realistic tax and transaction costs of selling.
- Net rental yield if the apartment is kept and rented out.
- Realistic investment returns after taxes and risk.
- Land prices around Warsaw.
- Construction cost inflation.
- Emotional cost of not owning a home.
- How much flexibility matters compared with housing security.
```

The app should probably not immediately say “sell” or “keep” unless those unknowns are modeled. Instead, it should identify which missing facts most affect the decision.

---

## 20. MVP Scope

### MVP Should Include

```text
- Create a decision.
- Add alternatives.
- Add pros and cons as factor cards.
- Assign gravity using simple labels.
- Assign probability using simple labels.
- Assign evidence confidence.
- Mark must-haves, must-nots, and dealbreakers.
- Group factors by category.
- Apply non-linear gravity mapping.
- Apply diminishing returns within categories.
- Show recommendation type.
- Show top reasons for and against.
- Show decision-flip conditions.
- Show next best data to collect.
- Export decision as Markdown or PDF.
```

### MVP Should Not Try to Do Everything

Avoid building too much initially.

Do not start with:

```text
- Full financial planning automation.
- Legal/tax advice.
- Real estate market prediction.
- Investment advice automation.
- Complex collaborative enterprise workflows.
```

The first version should prove that the decision model feels useful and trustworthy.

---

## 21. Suggested Data Model

### Decision

```ts
type Decision = {
  id: string;
  title: string;
  description: string;
  alternatives: Alternative[];
  categories: Category[];
  factors: Factor[];
  constraints: Constraint[];
  riskPreference: "comfortable" | "balanced" | "cautious";
  createdAt: string;
  updatedAt: string;
};
```

### Alternative

```ts
type Alternative = {
  id: string;
  name: string;
  description?: string;
};
```

### Category

```ts
type Category = {
  id: string;
  name: string;
  weight: number; // normalized 0..1
};
```

### Factor

```ts
type Factor = {
  id: string;
  alternativeId: string;
  categoryId: string;
  description: string;
  direction: "pro" | "con";
  gravity: 1 | 2 | 3 | 4 | 5;
  probability: number; // 0..1
  evidenceConfidence: "strong" | "some" | "intuition";
  constraintType?: "none" | "must_have" | "must_not" | "dealbreaker";
  mitigated?: boolean;
};
```

### Constraint

```ts
type Constraint = {
  id: string;
  description: string;
  type: "must_have" | "must_not" | "dealbreaker";
  appliesToAlternativeIds: string[];
  satisfied: boolean;
  violationProbability?: number;
  mitigated?: boolean;
};
```

### Result

```ts
type DecisionResult = {
  recommendedAlternativeId?: string;
  status: "recommended" | "leaning" | "too_close" | "more_data_needed" | "not_recommended";
  scores: AlternativeScore[];
  topReasons: Factor[];
  topRisks: Factor[];
  flipConditions: string[];
  nextBestData: string[];
};
```

---

## 22. Core Pseudocode

```pseudo
gravityMap = {
  1: 1,
  2: 3,
  3: 8,
  4: 20,
  5: 50
}

decay = [1.0, 0.6, 0.35, 0.2, 0.1]

function factorImpact(factor, categoryWeight):
    sign = factor.direction == "pro" ? 1 : -1
    gravityValue = gravityMap[factor.gravity]
    return sign * categoryWeight * gravityValue * factor.probability

function decayedSum(impacts):
    sorted = sortByAbsoluteValueDescending(impacts)
    total = 0

    for index, impact in sorted:
        multiplier = index < length(decay) ? decay[index] : 0.1
        total += impact * multiplier

    return total

function categoryScore(option, category, factors):
    categoryFactors = factors where:
        factor.alternativeId == option.id
        and factor.categoryId == category.id

    positiveImpacts = []
    negativeImpacts = []

    for factor in categoryFactors:
        impact = factorImpact(factor, category.weight)

        if impact >= 0:
            positiveImpacts.append(impact)
        else:
            negativeImpacts.append(abs(impact))

    pros = decayedSum(positiveImpacts)
    cons = decayedSum(negativeImpacts)

    return pros - cons

function gateCheck(option, constraints):
    for constraint in constraints applying to option:
        if constraint.type == "must_have" and constraint.satisfied == false:
            return "FAIL"

        if constraint.type == "must_not" and constraint.violationProbability >= 0.25:
            return "FAIL"

        if constraint.type == "dealbreaker" and constraint.mitigated == false:
            return "BLOCKED"

    return "PASS"

function baseOptionScore(option, categories, factors, constraints):
    gate = gateCheck(option, constraints)

    if gate == "FAIL":
        return { score: -Infinity, gate }

    if gate == "BLOCKED":
        return { score: null, gate }

    total = 0

    for category in categories:
        total += categoryScore(option, category, factors)

    return { score: total, gate }

function recommend(decision):
    scores = []

    for option in decision.alternatives:
        scores.append(baseOptionScore(option, decision.categories, decision.factors, decision.constraints))

    ranked = sortByScoreDescending(scores)
    top = ranked[0]
    second = ranked[1]

    if top.gate != "PASS":
        return "not_recommended"

    if top.score - second.score < 5:
        return "too_close"

    // In production, also check simulation win probability and robustness.
    return "recommended"
```

---

## 23. Explanation Layer

The output should be explainable in human language.

Instead of saying:

```text
Score: 71.82
```

Say:

```text
Selling currently looks stronger because it scores highly on liquidity, family obligation, and future home optionality.
However, the result is sensitive to two uncertain assumptions: expected investment return and future land prices.
```

The app should show:

```text
Top reasons supporting the recommendation
Top risks against the recommendation
Which factors were dealbreakers or constraints
What would change the recommendation
Which data to collect next
```

---

## 24. Product Differentiation

This should not be marketed as another pros-and-cons list.

Better positioning:

```text
A decision engine that separates feelings, facts, uncertainty, and non-negotiables.
```

Or:

```text
A simple app for making hard decisions with transparent reasoning.
```

Or:

```text
Know what to choose, why, and what could change your mind.
```

The key differentiators:

- Not just pros and cons.
- Uses probability.
- Uses non-linear gravity.
- Prevents accumulation bias.
- Supports dealbreakers and must-haves.
- Shows uncertainty and confidence.
- Explains what would change the answer.
- Suggests what data to collect next.

---

## 25. Guardrails

The app should be clear that it is a decision-support tool, not a replacement for professional advice.

Especially for:

```text
- Medical decisions
- Legal decisions
- Tax decisions
- Investment decisions
- Major real estate transactions
```

For high-stakes domains, the app should say:

```text
This model can help structure your thinking, but you should verify the facts and consult a qualified professional before acting.
```

The app should also avoid false certainty. It should be comfortable saying:

```text
The answer is too close.
```

or:

```text
More data is needed.
```

or:

```text
This is a values decision, not a data decision.
```

---

## 26. Development Roadmap

### Phase 1: Prototype

```text
- Manual decision creation
- Alternatives
- Factor cards
- Gravity and probability scoring
- Basic scoring engine
- Dealbreaker support
- Simple recommendation screen
```

### Phase 2: Smart Structuring

```text
- AI-assisted extraction of alternatives, pros, cons, and categories
- Duplicate detection
- Category grouping
- Better calibration questions
- Natural-language explanations
```

### Phase 3: Uncertainty and Sensitivity

```text
- Probability ranges
- Evidence confidence
- Simple simulations
- Win probability
- Decision-flip conditions
- More data needed detection
```

### Phase 4: Decision Memory

```text
- Save decisions
- Revisit decisions after time passes
- Mood/stability check
- Compare how scores changed over time
- Learn personal category preferences
```

### Phase 5: Advanced Integrations

```text
- Real estate data
- Financial calculators
- Tax/transaction cost estimators
- Collaborative decisions
- Export to PDF/Markdown
```

---

## 27. References and Inspiration

Useful background concepts:

- Multi-Criteria Decision Analysis / MCDA
- Weighted decision matrices
- Swing weighting
- Sensitivity analysis
- Value of Information
- Expected utility
- Risk-adjusted decision-making
- Constraint-based decision rules

Suggested reading:

- UK Government Analysis Function: Introductory guide to MCDA  
  https://analysisfunction.civilservice.gov.uk/policy-store/an-introductory-guide-to-mcda/

- GOV.UK Green Book Supplementary Guidance: Multi-criteria decision analysis  
  https://www.gov.uk/government/publications/green-book-supplementary-guidance-multi-criteria-decision-analysis/use-of-multi-criteria-decision-analysis-in-options-appraisal-of-economic-cases

- ASQ: Decision Matrix  
  https://asq.org/quality-resources/decision-matrix

- 1000minds: What is MCDA / MCDM?  
  https://www.1000minds.com/decision-making/what-is-mcdm-mcda

- Value of Information overview  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC7612603/

---

## 28. Final Product Principle

The app should not tell users what to do with fake certainty.

It should help them see:

```text
1. What they value.
2. What they know.
3. What they are assuming.
4. What could go wrong.
5. What would change the decision.
6. What the best-supported choice is right now.
```

The strongest version of this product is not a calculator.

It is a structured thinking partner for hard decisions.

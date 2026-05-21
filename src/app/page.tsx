import {
  buildDecisionResult,
  formatStatusLabel,
} from "@/domain/scoring/engine";
import { sampleDecision } from "@/domain/scoring/sampleDecision";

export default function Home() {
  const result = buildDecisionResult(sampleDecision);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Gravity-Certainty Engine
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Decision Tool Implementation Started
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-600">
          Phase 1 foundation is now active: typed domain model, deterministic
          scoring, constraint gates, explainability fields, and test coverage.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Current Result</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatStatusLabel(result.status)}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Recommended Option</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {result.recommendedAlternativeId ?? "None"}
          </p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Flip Conditions</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {result.flipConditions.length}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Next Work Items</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-zinc-700">
          <li>Build the 8-step decision input flow UI.</li>
          <li>Add local persistence for saving and revisiting decisions.</li>
          <li>Implement uncertainty simulation and robustness metrics.</li>
        </ul>
      </section>
    </main>
  );
}

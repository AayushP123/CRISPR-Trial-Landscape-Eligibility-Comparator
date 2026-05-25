"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { mockTrials, Trial } from "@/data/mockTrials";

type CompareField = {
  label: string;
  getValue: (trial: Trial) => string;
};

const summaryFields: CompareField[] = [
  { label: "Phase", getValue: (trial) => trial.phase },
  { label: "Status", getValue: (trial) => trial.status },
  { label: "Sponsor", getValue: (trial) => trial.sponsor },
  { label: "Condition", getValue: (trial) => trial.condition },
  { label: "Editing method", getValue: (trial) => trial.editingMethod },
  { label: "Delivery method", getValue: (trial) => trial.deliveryMethod },
  { label: "Target gene", getValue: (trial) => trial.targetGene },
  { label: "Location", getValue: (trial) => trial.location },
  { label: "Age range", getValue: (trial) => `${trial.minimumAge} - ${trial.maximumAge}` },
  { label: "Primary endpoint", getValue: (trial) => trial.endpoint },
];

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareFallback />}>
      <CompareContent />
    </Suspense>
  );
}

function CompareFallback() {
  return (
    <main className="min-h-screen bg-[#f8f8f4] px-6 py-6 text-zinc-950 sm:px-8 lg:px-10">
      <section className="mx-auto max-w-7xl py-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
          Eligibility Comparator
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Loading comparison</h1>
      </section>
    </main>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const selectedIds = useMemo(() => {
    const rawTrials = searchParams.get("trials");

    if (!rawTrials) {
      return mockTrials.slice(0, 3).map((trial) => trial.nctId);
    }

    return rawTrials
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const selectedTrials = useMemo(() => {
    const trials = selectedIds
      .map((id) => mockTrials.find((trial) => trial.nctId === id))
      .filter((trial): trial is Trial => Boolean(trial));

    return trials.length > 0 ? trials : mockTrials.slice(0, 3);
  }, [selectedIds]);

  const searchHref = `/search`;

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-6 py-6 text-zinc-950 sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-zinc-200/80 pb-5">
        <Link href="/" className="text-sm font-semibold">
          CRISPR Landscape
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-950"
          >
            Search
          </Link>
          <Link
            href="/compare"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 shadow-sm"
          >
            Compare
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-950"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl py-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Eligibility Comparator
            </p>
            <h1 className="mt-4 text-4xl font-semibold">
              Compare selected trials
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-600">
              Review trial design, gene-editing method, age range, endpoints,
              and eligibility criteria side by side.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={searchHref}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
            >
              Change selection
            </Link>
            <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">
              Export CSV
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {selectedTrials.map((trial) => (
            <article
              key={trial.nctId}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-xs font-semibold text-teal-700">
                  {trial.nctId}
                </p>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  {trial.status}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold leading-6">
                {trial.title}
              </h2>
              <p className="mt-3 text-sm text-zinc-600">{trial.sponsor}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-[#fbfbf8] px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Target
                  </p>
                  <p className="mt-1 font-semibold">{trial.targetGene}</p>
                </div>
                <div className="rounded-md bg-[#fbfbf8] px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Method
                  </p>
                  <p className="mt-1 font-semibold">{trial.editingMethod}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <p className="text-sm font-semibold">Trial design comparison</p>
            <p className="mt-1 text-sm text-zinc-500">
              Structured fields normalized from each selected trial record.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="w-56 px-5 py-3 font-semibold">Field</th>
                  {selectedTrials.map((trial) => (
                    <th key={trial.nctId} className="px-5 py-3 font-semibold">
                      {trial.nctId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryFields.map((field) => {
                  const values = selectedTrials.map((trial) =>
                    field.getValue(trial)
                  );
                  const allSame = new Set(values).size === 1;

                  return (
                    <tr key={field.label} className="border-t border-zinc-200">
                      <th className="bg-zinc-50/60 px-5 py-4 text-left font-semibold text-zinc-700">
                        {field.label}
                      </th>
                      {selectedTrials.map((trial) => (
                        <td
                          key={`${trial.nctId}-${field.label}`}
                          className={`px-5 py-4 text-zinc-700 ${
                            allSame ? "" : "bg-teal-50/40"
                          }`}
                        >
                          {field.getValue(trial)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <p className="text-sm font-semibold">Inclusion criteria</p>
            </div>
            <div className="divide-y divide-zinc-200">
              {selectedTrials.map((trial) => (
                <div key={`${trial.nctId}-inclusion`} className="p-5">
                  <p className="font-mono text-xs font-semibold text-teal-700">
                    {trial.nctId}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                    {trial.inclusion.map((criterion) => (
                      <li key={criterion} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <p className="text-sm font-semibold">Exclusion criteria</p>
            </div>
            <div className="divide-y divide-zinc-200">
              {selectedTrials.map((trial) => (
                <div key={`${trial.nctId}-exclusion`} className="p-5">
                  <p className="font-mono text-xs font-semibold text-teal-700">
                    {trial.nctId}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                    {trial.exclusion.map((criterion) => (
                      <li key={criterion} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { mockTrials, type Trial } from "@/data/mockTrials";
import { DEFAULT_GENE_EDITING_QUERY } from "@/lib/geneEditingPresets";

type CountRow = {
  label: string;
  count: number;
};

type TrialsApiResponse = {
  trials: Trial[];
  totalCount: number;
  source: string;
};

function countBy(
  trials: Trial[],
  getValue: (trial: Trial) => string
): CountRow[] {
  const counts = new Map<string, number>();

  trials.forEach((trial) => {
    const value = getValue(trial);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function BarList({ rows }: { rows: CountRow[] }) {
  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-zinc-800">{row.label}</span>
            <span className="font-mono text-xs text-zinc-500">{row.count}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100">
            <div
              className="h-2 rounded-full bg-teal-700"
              style={{ width: `${(row.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: CountRow[];
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <BarList rows={rows} />
    </section>
  );
}

export default function DashboardPage() {
  const [trials, setTrials] = useState<Trial[]>(mockTrials);
  const [totalCount, setTotalCount] = useState(mockTrials.length);
  const [source, setSource] = useState("Local fallback data");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardTrials() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          query: DEFAULT_GENE_EDITING_QUERY,
          pageSize: "50",
        });
        const response = await fetch(`/api/trials?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = (await response.json()) as TrialsApiResponse;
        setTrials(data.trials);
        setTotalCount(data.totalCount);
        setSource(data.source);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setTrials(mockTrials);
        setTotalCount(mockTrials.length);
        setSource("Local fallback data");
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load dashboard trials"
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardTrials();

    return () => controller.abort();
  }, []);

  const phaseRows = useMemo(() => countBy(trials, (trial) => trial.phase), [trials]);
  const statusRows = useMemo(
    () => countBy(trials, (trial) => trial.status),
    [trials]
  );
  const methodRows = useMemo(
    () => countBy(trials, (trial) => trial.editingMethod),
    [trials]
  );
  const deliveryRows = useMemo(
    () => countBy(trials, (trial) => trial.deliveryMethod),
    [trials]
  );
  const conditionRows = useMemo(
    () => countBy(trials, (trial) => trial.condition),
    [trials]
  );
  const locationRows = useMemo(
    () => countBy(trials, (trial) => trial.location),
    [trials]
  );

  const recruitingCount = trials.filter(
    (trial) => trial.status === "Recruiting"
  ).length;
  const inVivoCount = trials.filter(
    (trial) => trial.deliveryMethod === "In vivo"
  ).length;
  const exVivoCount = trials.filter(
    (trial) => trial.deliveryMethod === "Ex vivo"
  ).length;
  const latestTrials = [...trials]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-6 py-6 text-zinc-950 sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-zinc-200/80 pb-5">
        <Link href="/" className="text-sm font-semibold">
          Gene Editing Trials
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
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-950"
          >
            Compare
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 shadow-sm"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl py-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Landscape Dashboard
            </p>
            <h1 className="mt-4 text-4xl font-semibold">
              Analyze the gene-editing trial field
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-600">
              Scan live gene-editing trial records by phase, status, disease,
              editing method, delivery method, geography, and recent updates.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {isLoading
                ? "Loading live landscape data..."
                : error
                  ? `Source: ${source}. Fallback reason: ${error}`
                  : `Source: ${source}`}
            </p>
          </div>

          <Link
            href="/search"
            className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Search trials
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Matched trials", totalCount, "API results available"],
            ["Loaded sample", trials.length, "Records analyzed below"],
            ["Recruiting", recruitingCount, "Open or actively enrolling"],
            ["In vivo", inVivoCount, "Delivered directly in body"],
          ].map(([label, value, caption]) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-zinc-500">{label}</p>
              <p className="mt-3 text-4xl font-semibold text-zinc-950">
                {value}
              </p>
              <p className="mt-2 text-sm text-zinc-500">{caption}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Trials by phase"
            description="Where studies sit in the clinical pipeline."
            rows={phaseRows}
          />
          <ChartCard
            title="Trials by status"
            description="Recruiting and active trial availability."
            rows={statusRows}
          />
          <ChartCard
            title="Editing methods"
            description="Modality breakdown across selected records."
            rows={methodRows}
          />
          <ChartCard
            title="Delivery methods"
            description="How edited therapies are delivered."
            rows={deliveryRows}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-zinc-950">
                Disease areas
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Conditions represented in the current trial set.
              </p>
            </div>
            <BarList rows={conditionRows} />
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-zinc-950">
                Geographic footprint
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                High-level location grouping for trial records.
              </p>
            </div>
            <BarList rows={locationRows} />
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-lg border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
            <p className="text-sm font-semibold text-teal-200">
              Landscape readout
            </p>
            <h2 className="mt-4 text-2xl font-semibold">
              Delivery patterns are split across modalities.
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              The loaded sample separates cell-based ex vivo programs from direct
              in vivo approaches such as AAV and lipid nanoparticle delivery.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">{exVivoCount}</p>
                <p className="mt-1 text-sm text-zinc-300">ex vivo records</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-semibold">
                  {deliveryRows.length}
                </p>
                <p className="mt-1 text-sm text-zinc-300">delivery categories</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-zinc-950">
                Recently updated trials
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Most recent records in the current API result set.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">NCT ID</th>
                    <th className="px-5 py-3 font-semibold">Trial</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {latestTrials.map((trial) => (
                    <tr key={trial.nctId} className="border-t border-zinc-200">
                      <td className="px-5 py-4 font-mono text-xs text-teal-700">
                        {trial.nctId}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-zinc-950">
                          {trial.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {trial.condition} - {trial.targetGene}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {trial.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        {trial.lastUpdated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { mockTrials, Trial } from "@/data/mockTrials";

type CountRow = {
  label: string;
  count: number;
};

function countBy(getValue: (trial: Trial) => string): CountRow[] {
  const counts = new Map<string, number>();

  mockTrials.forEach((trial) => {
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
  const phaseRows = countBy((trial) => trial.phase);
  const statusRows = countBy((trial) => trial.status);
  const methodRows = countBy((trial) => trial.editingMethod);
  const deliveryRows = countBy((trial) => trial.deliveryMethod);
  const conditionRows = countBy((trial) => trial.condition);
  const locationRows = countBy((trial) => trial.location);

  const recruitingCount = mockTrials.filter(
    (trial) => trial.status === "Recruiting"
  ).length;
  const inVivoCount = mockTrials.filter(
    (trial) => trial.deliveryMethod === "In vivo"
  ).length;
  const exVivoCount = mockTrials.filter(
    (trial) => trial.deliveryMethod === "Ex vivo"
  ).length;
  const latestTrials = [...mockTrials]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 5);

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
              Analyze the CRISPR trial field
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-600">
              Scan the current mock trial set by phase, status, disease,
              delivery method, geography, and recent updates.
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
            ["Total trials", mockTrials.length, "Mock records available"],
            ["Recruiting", recruitingCount, "Open or actively enrolling"],
            ["Ex vivo", exVivoCount, "Edited outside the body"],
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
              Ex vivo studies dominate this snapshot.
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Most current mock records involve edited cells returned to the
              patient, while lipid nanoparticle and in vivo approaches appear in
              smaller but strategically important groups.
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
                Most recent records in the current dataset.
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
                          {trial.condition} · {trial.targetGene}
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

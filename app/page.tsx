import Link from "next/link";

export default function Home() {
  const navItems = [
    { href: "/search", label: "Search" },
    { href: "/compare", label: "Compare" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const trialRows = [
    {
      id: "NCT03745287",
      disease: "Sickle Cell",
      phase: "Phase 1/2",
      status: "Recruiting",
      target: "BCL11A",
      method: "CRISPR-Cas9",
    },
    {
      id: "NCT05329649",
      disease: "Beta Thalassemia",
      phase: "Phase 3",
      status: "Active",
      target: "HBG1/2",
      method: "Base Editing",
    },
    {
      id: "NCT03872479",
      disease: "Retinal Disease",
      phase: "Phase 2",
      status: "Completed",
      target: "CEP290",
      method: "In vivo",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8f8f4] text-zinc-950">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between border-b border-zinc-200/80 pb-5">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Gene Editing Trials
          </Link>

          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-white hover:text-zinc-950"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
              Gene Editing Intelligence Platform
            </p>

            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.04] text-zinc-950 sm:text-6xl">
              Find and compare gene-editing trials faster.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
              Explore API-backed trial records across CRISPR, base editing,
              prime editing, RNA editing, TALEN, ZFN, and in vivo delivery
              programs.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
              href="/search"
                className="rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Search Live Trials
              </Link>
              <Link
                href="/compare"
                className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400"
              >
                Compare Eligibility
              </Link>
            </div>

            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-zinc-200 pt-6">
              <div>
                <dt className="text-2xl font-semibold text-zinc-950">Live</dt>
                <dd className="mt-1 text-sm text-zinc-600">registry data</dd>
              </div>
              <div>
                <dt className="text-2xl font-semibold text-zinc-950">7</dt>
                <dd className="mt-1 text-sm text-zinc-600">modality presets</dd>
              </div>
              <div>
                <dt className="text-2xl font-semibold text-zinc-950">API</dt>
                <dd className="mt-1 text-sm text-zinc-600">Next.js backend</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Gene-editing search preview
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Choose a modality, filter API results, then compare.
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  ClinicalTrials.gov
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-md border border-zinc-200 bg-[#fbfbf8] px-4 py-3 text-sm text-zinc-500">
                CRISPR OR base editing OR prime editing OR TALEN
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "CRISPR",
                  "Base editing",
                  "Prime editing",
                  "RNA editing",
                  "TALEN / ZFN",
                ].map((filter) => (
                    <span
                      key={filter}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600"
                    >
                      {filter}
                    </span>
                  ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-md border border-zinc-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">NCT ID</th>
                      <th className="px-4 py-3 font-semibold">Disease</th>
                      <th className="px-4 py-3 font-semibold">Phase</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialRows.map((trial) => (
                      <tr key={trial.id} className="border-t border-zinc-200">
                        <td className="px-4 py-4 font-mono text-xs text-teal-700">
                          {trial.id}
                        </td>
                        <td className="px-4 py-4 font-medium text-zinc-900">
                          {trial.disease}
                        </td>
                        <td className="px-4 py-4 text-zinc-600">
                          {trial.phase}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                            {trial.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-zinc-600">
                          {trial.target}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Scope", "Gene editing"],
                  ["Delivery", "Ex vivo / in vivo"],
                  ["Comparator", "Eligibility"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-zinc-200 bg-[#fbfbf8] px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-950">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

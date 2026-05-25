"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mockTrials } from "@/data/mockTrials";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(mockTrials.map((trial) => trial.status)))],
    []
  );
  const phases = useMemo(
    () => ["All", ...Array.from(new Set(mockTrials.map((trial) => trial.phase)))],
    []
  );
  const methods = useMemo(
    () => [
      "All",
      ...Array.from(new Set(mockTrials.map((trial) => trial.editingMethod))),
    ],
    []
  );

  const filteredTrials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return mockTrials.filter((trial) => {
      const searchableText = [
        trial.nctId,
        trial.title,
        trial.condition,
        trial.phase,
        trial.status,
        trial.sponsor,
        trial.editingMethod,
        trial.deliveryMethod,
        trial.targetGene,
        trial.location,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "All" || trial.status === statusFilter;
      const matchesPhase = phaseFilter === "All" || trial.phase === phaseFilter;
      const matchesMethod =
        methodFilter === "All" || trial.editingMethod === methodFilter;

      return matchesQuery && matchesStatus && matchesPhase && matchesMethod;
    });
  }, [methodFilter, phaseFilter, query, statusFilter]);

  const selectedTrials = mockTrials.filter((trial) =>
    selectedIds.includes(trial.nctId)
  );
  const selectedHref =
    selectedIds.length > 0 ? `/compare?trials=${selectedIds.join(",")}` : "/compare";

  function toggleTrial(nctId: string) {
    setSelectedIds((current) =>
      current.includes(nctId)
        ? current.filter((selectedId) => selectedId !== nctId)
        : [...current, nctId]
    );
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("All");
    setPhaseFilter("All");
    setMethodFilter("All");
  }

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-6 py-6 text-zinc-950 sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-zinc-200/80 pb-5">
        <Link href="/" className="text-sm font-semibold">
          CRISPR Landscape
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 shadow-sm"
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
              Trial Search
            </p>
            <h1 className="mt-4 text-4xl font-semibold">
              Search gene-editing trials
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-600">
              Filter mock CRISPR trial records by disease, target, phase, status,
              sponsor, editing method, delivery method, or location.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold">{filteredTrials.length}</p>
              <p className="mt-1 text-zinc-500">visible trials</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold">
                {
                  filteredTrials.filter((trial) => trial.status === "Recruiting")
                    .length
                }
              </p>
              <p className="mt-1 text-zinc-500">recruiting</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold">{selectedIds.length}</p>
              <p className="mt-1 text-zinc-500">selected</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto_auto]">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="sickle cell, BCL11A, base editing..."
                  className="h-11 w-full rounded-md border border-zinc-300 bg-[#fbfbf8] px-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-teal-600"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-11 min-w-40 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Phase
                </span>
                <select
                  value={phaseFilter}
                  onChange={(event) => setPhaseFilter(event.target.value)}
                  className="h-11 min-w-36 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                >
                  {phases.map((phase) => (
                    <option key={phase}>{phase}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Method
                </span>
                <select
                  value={methodFilter}
                  onChange={(event) => setMethodFilter(event.target.value)}
                  className="h-11 min-w-40 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                >
                  {methods.map((method) => (
                    <option key={method}>{method}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 h-11 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 lg:mt-6"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="w-12 px-5 py-3 font-semibold">Pick</th>
                  <th className="px-4 py-3 font-semibold">NCT ID</th>
                  <th className="px-4 py-3 font-semibold">Trial</th>
                  <th className="px-4 py-3 font-semibold">Condition</th>
                  <th className="px-4 py-3 font-semibold">Phase</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Sponsor</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Target</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrials.map((trial) => {
                  const isSelected = selectedIds.includes(trial.nctId);

                  return (
                    <tr
                      key={trial.nctId}
                      className={`border-t border-zinc-200 transition ${
                        isSelected ? "bg-teal-50/50" : "hover:bg-zinc-50"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTrial(trial.nctId)}
                          aria-label={`Select ${trial.nctId}`}
                          className="h-4 w-4 accent-teal-700"
                        />
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-teal-700">
                        {trial.nctId}
                      </td>
                      <td className="max-w-72 px-4 py-4">
                        <p className="font-medium text-zinc-950">{trial.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Updated {trial.lastUpdated}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-zinc-700">
                        {trial.condition}
                      </td>
                      <td className="px-4 py-4 text-zinc-700">{trial.phase}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {trial.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-zinc-700">{trial.sponsor}</td>
                      <td className="px-4 py-4 text-zinc-700">
                        {trial.editingMethod}
                      </td>
                      <td className="px-4 py-4 font-medium text-zinc-950">
                        {trial.targetGene}
                      </td>
                      <td className="px-4 py-4 text-zinc-700">
                        {trial.location}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTrials.length === 0 && (
            <div className="border-t border-zinc-200 px-5 py-12 text-center">
              <p className="font-semibold text-zinc-950">No trials found</p>
              <p className="mt-2 text-sm text-zinc-500">
                Try removing filters or searching a broader disease, target, or
                editing method.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-5 mt-6 rounded-lg border border-zinc-200 bg-zinc-950 px-5 py-4 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {selectedIds.length} trial{selectedIds.length === 1 ? "" : "s"}{" "}
                selected
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {selectedTrials.length > 0
                  ? selectedTrials.map((trial) => trial.nctId).join(", ")
                  : "Select two or more rows to compare eligibility criteria."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Clear
              </button>
              <Link
                href={selectedHref}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  selectedIds.length >= 2
                    ? "bg-white text-zinc-950 hover:bg-zinc-100"
                    : "pointer-events-none bg-white/20 text-zinc-400"
                }`}
              >
                Compare selected
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

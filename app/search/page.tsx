"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type Trial } from "@/data/mockTrials";
import { geneEditingCategories } from "@/lib/geneEditingPresets";

type FilterFacets = {
  statuses: string[];
  phases: string[];
  methods: string[];
};

type TrialFilters = {
  search: string;
  status: string;
  phase: string;
  method: string;
  category: string;
  pageToken?: string;
};

type TrialsApiResponse = {
  trials: Trial[];
  allCount: number;
  totalCount: number;
  returnedCount: number;
  nextPageToken: string | null;
  source: string;
  facets: FilterFacets;
  warning?: string;
};

const PAGE_SIZE = 50;

const defaultFilters: TrialFilters = {
  search: "",
  status: "All",
  phase: "All",
  method: "All",
  category: "All gene editing",
};

const emptyFacets: FilterFacets = {
  statuses: [],
  phases: [],
  methods: [],
};

function buildTrialsUrl(filters: TrialFilters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.status !== "All") {
    params.set("status", filters.status);
  }

  if (filters.phase !== "All") {
    params.set("phase", filters.phase);
  }

  if (filters.method !== "All") {
    params.set("method", filters.method);
  }

  if (
    filters.category !== "All gene editing" &&
    filters.category !== "Custom search"
  ) {
    params.set("category", filters.category);
  }

  params.set("pageSize", String(PAGE_SIZE));

  if (filters.pageToken) {
    params.set("pageToken", filters.pageToken);
  }

  const queryString = params.toString();
  return queryString ? `/api/trials?${queryString}` : "/api/trials";
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All gene editing");
  const [statusFilter, setStatusFilter] = useState("All");
  const [phaseFilter, setPhaseFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [allCount, setAllCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [source, setSource] = useState("Local Next.js API");
  const [facets, setFacets] = useState<FilterFacets>(emptyFacets);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function loadTrials(filters: TrialFilters, append = false) {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await fetch(buildTrialsUrl(filters));

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = (await response.json()) as TrialsApiResponse;

      setTrials((currentTrials) => {
        if (!append) {
          return data.trials;
        }

        const seenIds = new Set(currentTrials.map((trial) => trial.nctId));
        const newTrials = data.trials.filter((trial) => !seenIds.has(trial.nctId));

        return [...currentTrials, ...newTrials];
      });
      setAllCount(data.allCount);
      setTotalCount(data.totalCount);
      setSource(data.source);
      setFacets(data.facets);
      setNextPageToken(data.nextPageToken);
      setWarning(data.warning ?? "");
    } catch (caughtError) {
      if (!append) {
        setTrials([]);
        setNextPageToken(null);
      }
      setTotalCount(0);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load trials"
      );
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadTrials(defaultFilters);
  }, []);

  const statuses = useMemo(
    () => ["All", ...facets.statuses],
    [facets.statuses]
  );
  const phases = useMemo(() => ["All", ...facets.phases], [facets.phases]);
  const methods = useMemo(() => ["All", ...facets.methods], [facets.methods]);

  const selectedTrials = trials.filter((trial) =>
    selectedIds.includes(trial.nctId)
  );
  const selectedHref =
    selectedIds.length > 0 ? `/compare?trials=${selectedIds.join(",")}` : "/compare";
  const recruitingCount = trials.filter(
    (trial) => trial.status === "Recruiting"
  ).length;

  function toggleTrial(nctId: string) {
    setSelectedIds((current) =>
      current.includes(nctId)
        ? current.filter((selectedId) => selectedId !== nctId)
        : [...current, nctId]
    );
  }

  function resetFilters() {
    setQuery("");
    setActiveSearch("");
    setActiveCategory("All gene editing");
    setStatusFilter("All");
    setPhaseFilter("All");
    setMethodFilter("All");
    setSelectedIds([]);
    void loadTrials(defaultFilters);
  }

  function searchTrials() {
    const currentSearch = query.trim();
    const nextCategory = currentSearch ? "Custom search" : activeCategory;

    setActiveSearch(currentSearch);
    setActiveCategory(nextCategory);
    setSelectedIds([]);
    void loadTrials({
      search: currentSearch,
      status: statusFilter,
      phase: phaseFilter,
      method: methodFilter,
      category: nextCategory,
    });
  }

  function loadMoreTrials() {
    if (!nextPageToken || isLoadingMore) {
      return;
    }

    void loadTrials(
      {
        search: activeSearch,
        status: statusFilter,
        phase: phaseFilter,
        method: methodFilter,
        category: activeCategory,
        pageToken: nextPageToken,
      },
      true
    );
  }

  function applyCategory(category: (typeof geneEditingCategories)[number]) {
    setQuery("");
    setActiveSearch("");
    setActiveCategory(category.label);
    setStatusFilter("All");
    setPhaseFilter("All");
    setMethodFilter("All");
    setSelectedIds([]);
    void loadTrials({
      ...defaultFilters,
      category: category.label,
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f8f4] px-6 py-6 text-zinc-950 sm:px-8 lg:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-zinc-200/80 pb-5">
        <Link href="/" className="text-sm font-semibold">
          Gene Editing Trials
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
              Search the gene-editing trial landscape
            </h1>
            <p className="mt-4 max-w-2xl text-zinc-600">
              Search, filter, and compare live gene-editing trial records from
              ClinicalTrials.gov through a Next.js API route.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Source: {source} - Scope: {activeCategory}
              {activeSearch ? ` - Search: ${activeSearch}` : ""}
              {warning ? ` - Fallback: ${warning}` : ""}
              {error ? ` - ${error}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold">{allCount}</p>
              <p className="mt-1 text-zinc-500">registry matches</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold">{trials.length}</p>
              <p className="mt-1 text-zinc-500">loaded</p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-semibold">{recruitingCount}</p>
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
            <div className="mb-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Category presets
              </p>
              <div className="flex flex-wrap gap-2">
                {geneEditingCategories.map((category) => (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => applyCategory(category)}
                    title={category.description}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      activeCategory === category.label
                        ? "border-teal-700 bg-teal-50 text-teal-800"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      searchTrials();
                    }
                  }}
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
              <button
                type="button"
                onClick={searchTrials}
                disabled={isLoading}
                className="mt-6 h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 lg:mt-6"
              >
                {isLoading ? "Loading" : "Search"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="w-16 px-5 py-3 font-semibold">Pick</th>
                  <th className="w-32 px-4 py-3 font-semibold">NCT ID</th>
                  <th className="w-[420px] px-4 py-3 font-semibold">Trial</th>
                  <th className="w-56 px-4 py-3 font-semibold">Condition</th>
                  <th className="w-32 px-4 py-3 font-semibold">Phase</th>
                  <th className="w-44 px-4 py-3 font-semibold">Status</th>
                  <th className="w-64 px-4 py-3 font-semibold">Sponsor</th>
                  <th className="w-36 px-4 py-3 font-semibold">Method</th>
                  <th className="w-36 px-4 py-3 font-semibold">Target</th>
                  <th className="w-44 px-4 py-3 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {!isLoading &&
                  trials.map((trial) => {
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
                          <a
                            href={`https://clinicaltrials.gov/study/${trial.nctId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {trial.nctId}
                          </a>
                        </td>
                        <td className="w-[420px] px-4 py-4">
                          <p className="font-medium text-zinc-950">
                            {trial.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Updated {trial.lastUpdated}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-zinc-700">
                          {trial.condition}
                        </td>
                        <td className="px-4 py-4 text-zinc-700">
                          {trial.phase}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                            {trial.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-zinc-700">
                          {trial.sponsor}
                        </td>
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

          {isLoading && (
            <div className="border-t border-zinc-200 px-5 py-12 text-center">
              <p className="font-semibold text-zinc-950">Loading trials</p>
              <p className="mt-2 text-sm text-zinc-500">
                Calling the Next.js API route and normalizing registry records.
              </p>
            </div>
          )}

          {!isLoading && trials.length === 0 && (
            <div className="border-t border-zinc-200 px-5 py-12 text-center">
              <p className="font-semibold text-zinc-950">No trials found</p>
              <p className="mt-2 text-sm text-zinc-500">
                Try removing filters or searching a broader disease, target, or
                editing method.
              </p>
            </div>
          )}
        </div>

        {!isLoading && nextPageToken && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={loadMoreTrials}
              disabled={isLoadingMore}
              className="rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-400"
            >
              {isLoadingMore ? "Loading more..." : `Load ${PAGE_SIZE} more`}
            </button>
          </div>
        )}

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

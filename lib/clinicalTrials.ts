import { mockTrials, type Trial } from "@/data/mockTrials";
import {
  DEFAULT_GENE_EDITING_QUERY,
  geneEditingCategories,
} from "@/lib/geneEditingPresets";

const CLINICAL_TRIALS_API_BASE = "https://clinicaltrials.gov/api/v2";

export type TrialFilters = {
  search?: string;
  status?: string;
  phase?: string;
  method?: string;
  category?: string;
  ids?: string[];
  pageSize?: number;
  pageToken?: string;
  limit?: number;
};

export type TrialsResult = {
  trials: Trial[];
  allCount: number;
  totalCount: number;
  returnedCount: number;
  nextPageToken: string | null;
  source: string;
  query: {
    search: string | null;
    status: string | null;
    phase: string | null;
    method: string | null;
    category: string | null;
    ids: string[];
  };
  facets: {
    statuses: string[];
    phases: string[];
    methods: string[];
  };
  warning?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = "Not listed") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringArray(value: unknown) {
  return asArray(value)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function formatEnum(value: unknown, fallback = "Not listed") {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value
    .replaceAll("_", " ")
    .replace(/PHASE(\d)/gi, "PHASE $1")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPhase(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Not listed";
  }

  const phaseMap: Record<string, string> = {
    EARLY_PHASE1: "Early Phase 1",
    PHASE1: "Phase 1",
    PHASE1_PHASE2: "Phase 1/2",
    PHASE2: "Phase 2",
    PHASE2_PHASE3: "Phase 2/3",
    PHASE3: "Phase 3",
    PHASE4: "Phase 4",
    NA: "Not Applicable",
    NOT_APPLICABLE: "Not Applicable",
  };

  return phaseMap[value] ?? formatEnum(value);
}

function collectText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join(" ");
  }

  if (value !== null && typeof value === "object") {
    return Object.values(value).map(collectText).join(" ");
  }

  return "";
}

function compactLines(text: string) {
  return text
    .replace(/<[^>]*>/g, " ")
    .split(/\n|•|- /)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 8);
}

function splitCriteria(criteriaText: string, kind: "inclusion" | "exclusion") {
  const cleanedText = criteriaText.replace(/\r/g, "\n");
  const inclusionIndex = cleanedText.search(/inclusion criteria/i);
  const exclusionIndex = cleanedText.search(/exclusion criteria/i);

  let section = cleanedText;

  if (kind === "inclusion" && inclusionIndex >= 0) {
    section =
      exclusionIndex > inclusionIndex
        ? cleanedText.slice(inclusionIndex, exclusionIndex)
        : cleanedText.slice(inclusionIndex);
  }

  if (kind === "exclusion" && exclusionIndex >= 0) {
    section = cleanedText.slice(exclusionIndex);
  }

  const fallback =
    kind === "inclusion"
      ? "Inclusion criteria not clearly separated in registry record"
      : "Exclusion criteria not clearly separated in registry record";

  return compactLines(section)
    .filter((line) => !/^(inclusion|exclusion) criteria:?$/i.test(line))
    .slice(0, 6)
    .concat([])
    .slice(0, 6)
    .length > 0
    ? compactLines(section)
        .filter((line) => !/^(inclusion|exclusion) criteria:?$/i.test(line))
        .slice(0, 6)
    : [fallback];
}

function inferEditingMethod(searchText: string) {
  const text = searchText.toLowerCase();

  if (text.includes("prime editing") || text.includes("prime editor")) {
    return "Prime Editing";
  }

  if (text.includes("base editing") || text.includes("base editor")) {
    return "Base Editing";
  }

  if (text.includes("rna editing") || text.includes("cas13")) {
    return "RNA Editing";
  }

  if (text.includes("crispr") || text.includes("cas9") || text.includes("cas12")) {
    return "CRISPR-Cas";
  }

  if (text.includes("talen")) {
    return "TALEN";
  }

  if (text.includes("zfn") || text.includes("zinc finger nuclease")) {
    return "ZFN";
  }

  return "Not listed";
}

function inferDeliveryMethod(searchText: string) {
  const text = searchText.toLowerCase();

  if (text.includes("lipid nanoparticle") || text.includes("lnp")) {
    return "Lipid nanoparticle";
  }

  if (text.includes("adeno-associated") || /\baav\b/.test(text)) {
    return "AAV";
  }

  if (text.includes("ex vivo") || text.includes("autologous")) {
    return "Ex vivo";
  }

  if (text.includes("in vivo")) {
    return "In vivo";
  }

  return "Not listed";
}

function inferTargetGene(searchText: string) {
  const knownTargets = [
    "BCL11A",
    "HBB",
    "HBG1",
    "HBG2",
    "CEP290",
    "TTR",
    "SERPINA1",
    "PDCD1",
    "TRAC",
    "PCSK9",
    "ANGPTL3",
    "CCR5",
    "DMD",
    "CFTR",
    "VEGFA",
  ];

  return knownTargets.find((target) =>
    new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      searchText
    )
  ) ?? "Not listed";
}

function getLastUpdated(statusModule: Record<string, unknown>) {
  const postDate = asRecord(statusModule.lastUpdatePostDateStruct).date;
  const submitDate = asRecord(statusModule.lastUpdateSubmitDateStruct).date;

  return asString(postDate, asString(submitDate, asString(statusModule.lastUpdateSubmitDate)));
}

function getLocation(contactsLocationsModule: Record<string, unknown>) {
  const countries = unique(
    asArray(contactsLocationsModule.locations)
      .map((location) => asString(asRecord(location).country, ""))
      .filter(Boolean)
  );

  if (countries.length === 0) {
    return "Not listed";
  }

  if (countries.length > 2) {
    return "International";
  }

  return countries.join(", ");
}

function getPrimaryEndpoint(outcomesModule: Record<string, unknown>) {
  const primaryOutcome = asRecord(asArray(outcomesModule.primaryOutcomes)[0]);
  return asString(primaryOutcome.measure);
}

export function normalizeClinicalTrialStudy(rawStudy: unknown): Trial {
  const study = asRecord(rawStudy);
  const protocolSection = asRecord(study.protocolSection);
  const identificationModule = asRecord(protocolSection.identificationModule);
  const statusModule = asRecord(protocolSection.statusModule);
  const sponsorModule = asRecord(protocolSection.sponsorCollaboratorsModule);
  const conditionsModule = asRecord(protocolSection.conditionsModule);
  const designModule = asRecord(protocolSection.designModule);
  const eligibilityModule = asRecord(protocolSection.eligibilityModule);
  const contactsLocationsModule = asRecord(protocolSection.contactsLocationsModule);
  const outcomesModule = asRecord(protocolSection.outcomesModule);
  const leadSponsor = asRecord(sponsorModule.leadSponsor);
  const searchText = collectText(protocolSection);
  const phases = stringArray(designModule.phases).map(formatPhase);
  const criteriaText = asString(eligibilityModule.eligibilityCriteria, "");

  return {
    nctId: asString(identificationModule.nctId),
    title: asString(identificationModule.briefTitle),
    condition: stringArray(conditionsModule.conditions).join(", ") || "Not listed",
    phase: phases.join(", ") || "Not listed",
    status: formatEnum(statusModule.overallStatus),
    sponsor: asString(leadSponsor.name),
    editingMethod: inferEditingMethod(searchText),
    deliveryMethod: inferDeliveryMethod(searchText),
    targetGene: inferTargetGene(searchText),
    location: getLocation(contactsLocationsModule),
    minimumAge: asString(eligibilityModule.minimumAge),
    maximumAge: asString(eligibilityModule.maximumAge),
    lastUpdated: getLastUpdated(statusModule),
    inclusion: splitCriteria(criteriaText, "inclusion"),
    exclusion: splitCriteria(criteriaText, "exclusion"),
    endpoint: getPrimaryEndpoint(outcomesModule),
    studyType: formatEnum(designModule.studyType),
  };
}

function trialContainsSearch(trial: Trial, search: string) {
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
    trial.endpoint,
    trial.studyType,
    trial.inclusion.join(" "),
    trial.exclusion.join(" "),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(search.toLowerCase());
}

function getCategoryQuery(category?: string) {
  return (
    geneEditingCategories.find((currentCategory) => currentCategory.label === category)
      ?.query ?? DEFAULT_GENE_EDITING_QUERY
  );
}

function buildClinicalTrialsQuery(filters: TrialFilters) {
  const categoryQuery = getCategoryQuery(filters.category);
  const search = filters.search?.trim();

  if (search) {
    return `(${categoryQuery}) AND (${search})`;
  }

  return categoryQuery;
}

function clampPageSize(pageSize?: number) {
  if (!Number.isFinite(pageSize)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(pageSize ?? 50), 1), 100);
}

function applyLocalFilters(trials: Trial[], filters: TrialFilters) {
  let filteredTrials = trials;

  if (filters.status && filters.status !== "All") {
    filteredTrials = filteredTrials.filter((trial) => trial.status === filters.status);
  }

  if (filters.phase && filters.phase !== "All") {
    filteredTrials = filteredTrials.filter((trial) => trial.phase === filters.phase);
  }

  if (filters.method && filters.method !== "All") {
    filteredTrials = filteredTrials.filter(
      (trial) => trial.editingMethod === filters.method
    );
  }

  return filteredTrials;
}

function getFacets(trials: Trial[]) {
  return {
    statuses: unique(trials.map((trial) => trial.status)),
    phases: unique(trials.map((trial) => trial.phase)),
    methods: unique(trials.map((trial) => trial.editingMethod)),
  };
}

function fallbackSearch(filters: TrialFilters, warning: string): TrialsResult {
  let filteredTrials = mockTrials;

  if (filters.ids && filters.ids.length > 0) {
    const selectedIds = new Set(filters.ids);
    filteredTrials = filteredTrials.filter((trial) => selectedIds.has(trial.nctId));
  } else {
    if (filters.search) {
      filteredTrials = filteredTrials.filter((trial) =>
        trialContainsSearch(trial, filters.search ?? "")
      );
    }

    filteredTrials = applyLocalFilters(filteredTrials, filters);
  }

  if (filters.limit && filters.limit > 0) {
    filteredTrials = filteredTrials.slice(0, Math.trunc(filters.limit));
  }

    return {
      trials: filteredTrials,
      allCount: mockTrials.length,
      totalCount: filteredTrials.length,
    returnedCount: filteredTrials.length,
    nextPageToken: null,
    source: "Local fallback data",
    warning,
    query: {
      search: filters.search || null,
      status: filters.status || null,
      phase: filters.phase || null,
      method: filters.method || null,
      category: filters.category || null,
      ids: filters.ids ?? [],
    },
    facets: getFacets(mockTrials),
  };
}

export async function searchClinicalTrials(filters: TrialFilters): Promise<TrialsResult> {
  try {
    if (filters.ids && filters.ids.length > 0) {
      const trials = await Promise.all(
        filters.ids.map(async (nctId) => getClinicalTrialByNctId(nctId))
      );
      const presentTrials = trials.filter((trial): trial is Trial => Boolean(trial));

      return {
        trials: presentTrials,
        allCount: presentTrials.length,
        totalCount: presentTrials.length,
        returnedCount: presentTrials.length,
        nextPageToken: null,
        source: "ClinicalTrials.gov API v2",
        query: {
          search: filters.search || null,
          status: filters.status || null,
          phase: filters.phase || null,
          method: filters.method || null,
          category: filters.category || null,
          ids: filters.ids,
        },
        facets: getFacets(presentTrials),
      };
    }

    const pageSize = clampPageSize(filters.pageSize);
    const searchUrl = new URL(`${CLINICAL_TRIALS_API_BASE}/studies`);

    searchUrl.searchParams.set("query.term", buildClinicalTrialsQuery(filters));
    searchUrl.searchParams.set("pageSize", String(pageSize));
    searchUrl.searchParams.set("countTotal", "true");
    searchUrl.searchParams.set("format", "json");

    if (filters.pageToken) {
      searchUrl.searchParams.set("pageToken", filters.pageToken);
    }

    const response = await fetch(searchUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov returned ${response.status}`);
    }

    const data = asRecord(await response.json());
    const studies = asArray(data.studies);
    const normalizedTrials = studies.map(normalizeClinicalTrialStudy);
    let filteredTrials = applyLocalFilters(normalizedTrials, filters);

    if (filters.limit && filters.limit > 0) {
      filteredTrials = filteredTrials.slice(0, Math.trunc(filters.limit));
    }

    return {
      trials: filteredTrials,
      allCount:
        typeof data.totalCount === "number" ? data.totalCount : normalizedTrials.length,
      totalCount: filteredTrials.length,
      returnedCount: filteredTrials.length,
      nextPageToken:
        typeof data.nextPageToken === "string" ? data.nextPageToken : null,
      source: "ClinicalTrials.gov API v2",
      query: {
        search: filters.search || null,
        status: filters.status || null,
        phase: filters.phase || null,
        method: filters.method || null,
        category: filters.category || null,
        ids: filters.ids ?? [],
      },
      facets: getFacets(normalizedTrials),
    };
  } catch (caughtError) {
    return fallbackSearch(
      filters,
      caughtError instanceof Error
        ? caughtError.message
        : "Unable to reach ClinicalTrials.gov"
    );
  }
}

export async function getClinicalTrialByNctId(nctId: string) {
  const studyUrl = new URL(`${CLINICAL_TRIALS_API_BASE}/studies/${nctId}`);
  studyUrl.searchParams.set("format", "json");

  const response = await fetch(studyUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov returned ${response.status}`);
  }

  return normalizeClinicalTrialStudy(await response.json());
}

import type { Trial } from "@/data/mockTrials";

const CLINICAL_TRIALS_API_BASE = "https://clinicaltrials.gov/api/v2";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = "Not listed") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function stringArray(value: unknown): string[] {
  return asArray(value)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function splitCriteria(criteriaText: string, kind: "inclusion" | "exclusion") {
  if (!criteriaText) {
    return ["Eligibility criteria not listed in source record"];
  }

  const lowerText = criteriaText.toLowerCase();
  const inclusionIndex = lowerText.indexOf("inclusion criteria");
  const exclusionIndex = lowerText.indexOf("exclusion criteria");

  let section = criteriaText;

  if (kind === "inclusion" && inclusionIndex >= 0 && exclusionIndex > inclusionIndex) {
    section = criteriaText.slice(inclusionIndex, exclusionIndex);
  }

  if (kind === "exclusion" && exclusionIndex >= 0) {
    section = criteriaText.slice(exclusionIndex);
  }

  const lines = section
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^(inclusion|exclusion) criteria:?/i, "")
        .replace(/^[-*•\d.)\s]+/, "")
        .trim()
    )
    .filter((line) => line.length > 8)
    .filter((line) => !/^criteria:?$/i.test(line));

  return lines.slice(0, 6).length > 0
    ? lines.slice(0, 6)
    : ["Eligibility criteria not listed in structured form"];
}

function inferEditingMethod(searchText: string) {
  const text = searchText.toLowerCase();

  if (text.includes("rna editing") || text.includes("cas13")) {
    return "RNA Editing";
  }

  if (text.includes("prime editing") || text.includes("prime editor")) {
    return "Prime Editing";
  }

  if (text.includes("base editing") || text.includes("base editor")) {
    return "Base Editing";
  }

  if (text.includes("crispr")) {
    return "CRISPR";
  }

  if (text.includes("talen")) {
    return "TALEN";
  }

  if (text.includes("zinc finger nuclease") || /\bzfn\b/.test(text)) {
    return "ZFN";
  }

  return "Not listed";
}

function inferDeliveryMethod(searchText: string) {
  const text = searchText.toLowerCase();

  if (text.includes("lipid nanoparticle") || text.includes(" lnp")) {
    return "Lipid nanoparticle";
  }

  if (text.includes("aav") || text.includes("adeno-associated")) {
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
  ];

  const upperText = searchText.toUpperCase();
  const matches = knownTargets.filter((gene) =>
    new RegExp(`\\b${escapeRegExp(gene)}\\b`).test(upperText)
  );

  return matches.length > 0 ? unique(matches).join(", ") : "Not listed";
}

function getLastUpdated(statusModule: JsonRecord) {
  const lastUpdatePostDateStruct = asRecord(
    statusModule.lastUpdatePostDateStruct
  );
  const lastUpdateSubmitDateStruct = asRecord(
    statusModule.lastUpdateSubmitDateStruct
  );

  return asString(
    lastUpdatePostDateStruct.date ??
      lastUpdateSubmitDateStruct.date ??
      statusModule.lastUpdateSubmitDate,
    "Not listed"
  );
}

function getLocation(contactsLocationsModule: JsonRecord) {
  const locations = asArray(contactsLocationsModule.locations).map(asRecord);
  const countries = unique(
    locations.map((location) => asString(location.country, "")).filter(Boolean)
  );

  if (countries.length === 0) {
    return "Not listed";
  }

  if (countries.length > 2) {
    return "International";
  }

  return countries.join(", ");
}

function getPrimaryEndpoint(outcomesModule: JsonRecord) {
  const primaryOutcomes = asArray(outcomesModule.primaryOutcomes).map(asRecord);
  const firstOutcome = primaryOutcomes[0];

  return asString(firstOutcome?.measure, "Not listed");
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
  const locationsModule = asRecord(protocolSection.contactsLocationsModule);
  const outcomesModule = asRecord(protocolSection.outcomesModule);
  const descriptionModule = asRecord(protocolSection.descriptionModule);

  const leadSponsor = asRecord(sponsorModule.leadSponsor);
  const conditions = stringArray(conditionsModule.conditions);
  const phases = stringArray(designModule.phases);
  const eligibilityText = asString(eligibilityModule.eligibilityCriteria, "");
  const searchableText = collectText(protocolSection);

  return {
    nctId: asString(identificationModule.nctId),
    title: asString(
      identificationModule.briefTitle ?? identificationModule.officialTitle
    ),
    condition: conditions[0] ?? "Not listed",
    phase: phases.length > 0 ? phases.join("/") : "Not applicable",
    status: titleCase(asString(statusModule.overallStatus)),
    sponsor: asString(leadSponsor.name),
    editingMethod: inferEditingMethod(searchableText),
    deliveryMethod: inferDeliveryMethod(searchableText),
    targetGene: inferTargetGene(searchableText),
    location: getLocation(locationsModule),
    minimumAge: asString(eligibilityModule.minimumAge),
    maximumAge: asString(eligibilityModule.maximumAge),
    lastUpdated: getLastUpdated(statusModule),
    inclusion: splitCriteria(eligibilityText, "inclusion"),
    exclusion: splitCriteria(eligibilityText, "exclusion"),
    endpoint:
      getPrimaryEndpoint(outcomesModule) !== "Not listed"
        ? getPrimaryEndpoint(outcomesModule)
        : asString(descriptionModule.briefSummary, "Not listed"),
    studyType: titleCase(asString(designModule.studyType)),
  };
}

export async function searchClinicalTrials(
  query: string,
  pageSize: number,
  pageToken?: string
) {
  const searchUrl = new URL(`${CLINICAL_TRIALS_API_BASE}/studies`);
  searchUrl.searchParams.set("query.term", query);
  searchUrl.searchParams.set("pageSize", String(pageSize));
  searchUrl.searchParams.set("countTotal", "true");
  searchUrl.searchParams.set("format", "json");

  if (pageToken) {
    searchUrl.searchParams.set("pageToken", pageToken);
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

  return {
    trials: studies.map(normalizeClinicalTrialStudy),
    totalCount:
      typeof data.totalCount === "number" ? data.totalCount : studies.length,
    nextPageToken: typeof data.nextPageToken === "string" ? data.nextPageToken : null,
  };
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

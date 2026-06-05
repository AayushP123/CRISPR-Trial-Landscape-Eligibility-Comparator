import { NextResponse } from "next/server";
import { searchClinicalTrials } from "@/lib/clinicalTrials";
import { DEFAULT_GENE_EDITING_QUERY } from "@/lib/geneEditingPresets";

export const dynamic = "force-dynamic";

function normalize(value: string | null) {
  return value?.trim() ?? "";
}

function clampPageSize(value: string | null) {
  const parsed = Number(value ?? 50);

  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function parseIds(value: string | null) {
  return normalize(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = normalize(url.searchParams.get("search"));
  const status = normalize(url.searchParams.get("status"));
  const phase = normalize(url.searchParams.get("phase"));
  const method = normalize(url.searchParams.get("method"));
  const category = normalize(url.searchParams.get("category"));
  const ids = parseIds(url.searchParams.get("ids"));
  const limit = Number(url.searchParams.get("limit"));
  const pageSize = clampPageSize(url.searchParams.get("pageSize"));
  const pageToken = normalize(url.searchParams.get("pageToken")) || undefined;

  const result = await searchClinicalTrials({
    search,
    status,
    phase,
    method,
    category: category || "All gene editing",
    ids,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    pageSize,
    pageToken,
  });

  return NextResponse.json({
    ...result,
    registryQuery: search || DEFAULT_GENE_EDITING_QUERY,
  });
}

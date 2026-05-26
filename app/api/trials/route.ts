import { NextResponse } from "next/server";
import { searchClinicalTrials } from "@/lib/clinicalTrials";
import { DEFAULT_GENE_EDITING_QUERY } from "@/lib/geneEditingPresets";

export const dynamic = "force-dynamic";

function clampPageSize(value: string | null) {
  const parsed = Number(value ?? 10);

  if (!Number.isFinite(parsed)) {
    return 10;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || DEFAULT_GENE_EDITING_QUERY;
  const pageSize = clampPageSize(searchParams.get("pageSize"));
  const pageToken = searchParams.get("pageToken")?.trim() || undefined;

  try {
    const results = await searchClinicalTrials(query, pageSize, pageToken);

    return NextResponse.json({
      query,
      pageSize,
      pageToken: pageToken ?? null,
      source: "ClinicalTrials.gov API v2",
      ...results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to fetch clinical trials",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}

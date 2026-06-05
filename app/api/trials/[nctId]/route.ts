import { NextResponse } from "next/server";
import { getClinicalTrialByNctId } from "@/lib/clinicalTrials";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ nctId: string }> }
) {
  const { nctId } = await context.params;
  const trial = await getClinicalTrialByNctId(nctId);

  if (!trial) {
    return NextResponse.json(
      { error: `Trial ${nctId} was not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    trial,
    source: "ClinicalTrials.gov API v2",
  });
}

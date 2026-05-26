import { NextResponse } from "next/server";
import { getClinicalTrialByNctId } from "@/lib/clinicalTrials";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nctId: string }> }
) {
  const { nctId } = await params;

  try {
    const trial = await getClinicalTrialByNctId(nctId);

    if (!trial) {
      return NextResponse.json(
        { error: `Trial ${nctId} was not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      source: "ClinicalTrials.gov API v2",
      trial,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to fetch clinical trial",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}

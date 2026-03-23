import { NextResponse } from "next/server";
import { listDatasets } from "@/lib/bigquery";
import { isDemoMode, DEMO_DATASETS } from "@/lib/demo-data";

export async function GET() {
  try {
    if (isDemoMode()) return NextResponse.json({ datasets: DEMO_DATASETS });
    const datasets = await listDatasets();
    return NextResponse.json({ datasets });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[BigQuery] datasets error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

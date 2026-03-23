import { NextResponse } from "next/server";
import { listDatasets } from "@/lib/bigquery";

export async function GET() {
  try {
    const datasets = await listDatasets();
    return NextResponse.json({ datasets });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[BigQuery] datasets error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

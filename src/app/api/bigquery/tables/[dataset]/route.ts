import { NextRequest, NextResponse } from "next/server";
import { listTables } from "@/lib/bigquery";
import { isDemoMode, DEMO_TABLES } from "@/lib/demo-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: { dataset: string } }
) {
  try {
    if (isDemoMode()) return NextResponse.json({ tables: DEMO_TABLES });
    const tables = await listTables(params.dataset);
    return NextResponse.json({ tables });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[BigQuery] tables error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

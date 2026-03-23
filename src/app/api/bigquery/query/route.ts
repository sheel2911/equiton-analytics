import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import { isDemoMode, DEMO_RESULT } from "@/lib/demo-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sql, maxResults } = body as { sql: string; maxResults?: number };

    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "sql is required" }, { status: 400 });
    }

    if (isDemoMode()) {
      // Simulate a short delay like a real query
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json({ ...DEMO_RESULT, jobId: `demo-${Date.now()}` });
    }

    const result = await runQuery(sql.trim(), maxResults ?? 1000);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[BigQuery] query error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

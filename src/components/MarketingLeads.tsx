"use client";

import { useState } from "react";
import { BarChart2, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { MARKETING_QUERIES, QUERY_CATEGORIES, type PrebuiltQuery } from "@/lib/marketing-queries";
import ChartRenderer from "./ChartRenderer";
import type { QueryResult } from "@/lib/bigquery";
import type { ChartSettings } from "./ChartConfig";
import ChartConfig from "./ChartConfig";

interface QueryCardProps {
  query: PrebuiltQuery;
}

function QueryCard({ query }: QueryCardProps) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [settings, setSettings] = useState<ChartSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function run() {
    if (result) { setOpen((o) => !o); return; }
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await fetch("/api/bigquery/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: query.sql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      const qr = data as QueryResult;
      setResult(qr);
      setSettings({
        type: query.defaultChart,
        xKey: query.xKey ?? qr.schema[0]?.name ?? "",
        yKeys: query.yKeys ?? qr.schema.slice(1).map((s) => s.name),
        nameKey: query.nameKey ?? qr.schema[0]?.name ?? "",
        valueKey: query.valueKey ?? qr.schema[1]?.name ?? qr.schema[0]?.name ?? "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header row */}
      <button
        onClick={run}
        className="w-full flex items-start justify-between gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-800 text-sm">{query.title}</span>
          <span className="text-xs text-gray-400">{query.description}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {loading && <Loader2 size={14} className="animate-spin text-blue-500" />}
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
            {query.defaultChart}
          </span>
          <ChevronRight
            size={14}
            className={clsx("text-gray-400 transition-transform", open && "rotate-90")}
          />
        </div>
      </button>

      {/* Expanded result */}
      {open && (
        <div className="border-t border-gray-100 p-4 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          {result && settings && (
            <>
              <ChartConfig result={result} settings={settings} onChange={setSettings} />
              <ChartRenderer result={result} settings={settings} />
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600">View SQL</summary>
                <pre className="mt-2 bg-gray-950 text-green-400 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                  {query.sql}
                </pre>
              </details>
            </>
          )}
          {loading && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <Loader2 size={16} className="animate-spin" /> Running query…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MarketingLeads() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categories = ["All", ...QUERY_CATEGORIES];

  const visible =
    activeCategory === "All"
      ? MARKETING_QUERIES
      : MARKETING_QUERIES.filter((q) => q.category === activeCategory);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-600" />
            ET_Leads_Detail.et_leads_details_latest
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {MARKETING_QUERIES.length} pre-built client acquisition queries — click any card to run
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
              activeCategory === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
            )}
          >
            {cat}
            {cat === "All" ? (
              <span className="ml-1 opacity-60">({MARKETING_QUERIES.length})</span>
            ) : (
              <span className="ml-1 opacity-60">
                ({MARKETING_QUERIES.filter((q) => q.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Query cards */}
      <div className="flex flex-col gap-3">
        {visible.map((q) => (
          <QueryCard key={q.id} query={q} />
        ))}
      </div>
    </div>
  );
}

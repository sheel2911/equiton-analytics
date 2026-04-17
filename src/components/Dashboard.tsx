"use client";

import { useState } from "react";
import { Database, BarChart2, Radio, FlaskConical, Users } from "lucide-react";
import QueryPanel from "./QueryPanel";
import ChartConfig from "./ChartConfig";
import ChartRenderer from "./ChartRenderer";
import LiveFeedPanel from "./LiveFeedPanel";
import SavedQueries from "./SavedQueries";
import MarketingLeads from "./MarketingLeads";
import type { QueryResult } from "@/lib/bigquery";
import type { ChartSettings } from "./ChartConfig";
import clsx from "clsx";

type Tab = "leads" | "query" | "live";

function defaultSettings(result: QueryResult): ChartSettings {
  const cols = result.schema.map((s) => s.name);
  return {
    type: "line",
    xKey: cols[0] ?? "",
    yKeys: cols.slice(1),
    nameKey: cols[0] ?? "",
    valueKey: cols[1] ?? cols[0] ?? "",
  };
}

const isDemo = !process.env.NEXT_PUBLIC_BQ_PROJECT_ID;

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("leads");
  const [sql, setSql] = useState(
    "SELECT * FROM `exalted-justice-470220-u6.ET_Leads_Detail.et_leads_details_latest` ORDER BY LeadCreatedDate DESC LIMIT 100"
  );
  const [result, setResult] = useState<QueryResult | null>(null);
  const [settings, setSettings] = useState<ChartSettings | null>(null);

  function handleResult(r: QueryResult) {
    setResult(r);
    setSettings(defaultSettings(r));
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "leads", label: "Marketing Leads", icon: <Users size={14} /> },
    { id: "query", label: "Query & Explore", icon: <Database size={14} /> },
    { id: "live", label: "Live Feed", icon: <Radio size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 className="text-blue-600" size={22} />
          <h1 className="text-lg font-semibold text-gray-900">Equiton Analytics</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">BigQuery</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Demo mode banner */}
        {isDemo && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <FlaskConical size={15} className="shrink-0" />
            <span>
              <strong>Demo mode</strong> — no BigQuery credentials configured. All queries use sample data for{" "}
              <code className="bg-amber-100 px-1 rounded text-xs">ET_Leads_Detail.et_leads_details_latest</code>.
              Set <code className="bg-amber-100 px-1 rounded text-xs">BQ_PROJECT_ID=exalted-justice-470220-u6</code> in{" "}
              <code className="bg-amber-100 px-1 rounded text-xs">.env.local</code> to connect to real BigQuery.
            </span>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Marketing Leads tab */}
        {tab === "leads" && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <MarketingLeads />
          </section>
        )}

        {/* Query & Explore tab */}
        {tab === "query" && (
          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">SQL Query</h2>
                <SavedQueries currentSql={sql} onLoad={setSql} />
              </div>
              <QueryPanel onResult={handleResult} defaultSql={sql} />
            </section>

            {result && settings && (
              <section className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-semibold text-gray-800">
                    Results
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {result.totalRows} rows · job {result.jobId.slice(0, 12)}…
                    </span>
                  </h2>
                  <ChartConfig result={result} settings={settings} onChange={setSettings} />
                </div>
                <ChartRenderer result={result} settings={settings} />
              </section>
            )}
          </div>
        )}

        {/* Live Feed tab */}
        {tab === "live" && (
          <div className="flex flex-col gap-6">
            <section className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Live Query</h2>
                <SavedQueries currentSql={sql} onLoad={setSql} />
              </div>
              <textarea
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                rows={5}
                placeholder="SELECT * FROM `exalted-justice-470220-u6.ET_Leads_Detail.et_leads_details_latest` LIMIT 500"
                className="w-full font-mono text-sm bg-gray-950 text-green-400 rounded-lg p-4 border border-gray-700 focus:outline-none focus:border-blue-500 resize-y placeholder:text-gray-600"
              />
            </section>

            {sql.trim() && (
              <section className="bg-white rounded-xl border border-gray-200 p-5">
                <LiveFeedPanel key={sql} sql={sql} />
              </section>
            )}

            {!sql.trim() && (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
                Enter a SQL query above to start the live feed
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

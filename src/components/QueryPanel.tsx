"use client";

import { useState } from "react";
import { Play, Loader2, AlertCircle } from "lucide-react";
import type { QueryResult } from "@/lib/bigquery";

interface Props {
  onResult: (result: QueryResult) => void;
  defaultSql?: string;
}

export default function QueryPanel({ onResult, defaultSql = "" }: Props) {
  const [sql, setSql] = useState(defaultSql);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runQuery() {
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bigquery/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      onResult(data as QueryResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={6}
          placeholder="SELECT * FROM `project.dataset.table` LIMIT 100"
          className="w-full font-mono text-sm bg-gray-950 text-green-400 rounded-lg p-4 border border-gray-700 focus:outline-none focus:border-blue-500 resize-y placeholder:text-gray-600"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runQuery();
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={runQuery}
          disabled={loading || !sql.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {loading ? "Running…" : "Run Query"}
        </button>
        <span className="text-xs text-gray-400">Ctrl+Enter to run</span>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
        </div>
      )}
    </div>
  );
}

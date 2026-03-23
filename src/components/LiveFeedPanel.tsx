"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Radio, RefreshCw, Pause, Play } from "lucide-react";
import type { QueryResult } from "@/lib/bigquery";
import type { ChartSettings } from "./ChartConfig";
import ChartConfig from "./ChartConfig";
import ChartRenderer from "./ChartRenderer";

const DEFAULT_INTERVALS = [
  { label: "10 s", value: 10_000 },
  { label: "30 s", value: 30_000 },
  { label: "1 min", value: 60_000 },
  { label: "5 min", value: 300_000 },
];

interface Props {
  sql: string;
}

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

export default function LiveFeedPanel({ sql }: Props) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [settings, setSettings] = useState<ChartSettings | null>(null);
  const [interval, setInterval_] = useState(30_000);
  const [running, setRunning] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/bigquery/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Query failed");
      const qr = data as QueryResult;
      setResult(qr);
      setSettings((prev) => prev ?? defaultSettings(qr));
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [sql]);

  // Schedule next fetch
  useEffect(() => {
    if (!running) return;
    fetchData();
    timerRef.current = setInterval(fetchData, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, interval, fetchData]);

  // Countdown ticker
  useEffect(() => {
    if (!running) { setCountdown(0); return; }
    setCountdown(Math.floor(interval / 1000));
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? Math.floor(interval / 1000) : c - 1));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [running, interval, lastRefresh]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
          <Radio size={14} className={running ? "animate-pulse" : ""} />
          {running ? "Live" : "Paused"}
        </div>

        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          {running ? <Pause size={13} /> : <Play size={13} />}
          {running ? "Pause" : "Resume"}
        </button>

        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={13} />
          Refresh now
        </button>

        <select
          value={interval}
          onChange={(e) => setInterval_(Number(e.target.value))}
          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 focus:outline-none focus:border-blue-500"
        >
          {DEFAULT_INTERVALS.map((o) => (
            <option key={o.value} value={o.value}>
              Every {o.label}
            </option>
          ))}
        </select>

        {running && countdown > 0 && (
          <span className="text-xs text-gray-400">
            Next refresh in {countdown}s
          </span>
        )}

        {lastRefresh && (
          <span className="text-xs text-gray-400 ml-auto">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {result && settings && (
        <>
          <ChartConfig result={result} settings={settings} onChange={setSettings} />
          <ChartRenderer result={result} settings={settings} />
          <p className="text-xs text-gray-400">{result.totalRows} rows returned</p>
        </>
      )}

      {!result && !error && (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Loading…
        </div>
      )}
    </div>
  );
}

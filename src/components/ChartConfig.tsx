"use client";

import type { QueryResult } from "@/lib/bigquery";

export type ChartType = "line" | "bar" | "pie" | "table";

export interface ChartSettings {
  type: ChartType;
  xKey: string;
  yKeys: string[];
  nameKey: string;
  valueKey: string;
}

interface Props {
  result: QueryResult;
  settings: ChartSettings;
  onChange: (s: ChartSettings) => void;
}

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "bar", label: "Bar" },
  { value: "pie", label: "Pie / Donut" },
  { value: "table", label: "Table" },
];

export default function ChartConfig({ result, settings, onChange }: Props) {
  const cols = result.schema.map((s) => s.name);

  function set<K extends keyof ChartSettings>(key: K, val: ChartSettings[K]) {
    onChange({ ...settings, [key]: val });
  }

  return (
    <div className="flex flex-wrap gap-4 items-end text-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Chart type
        </label>
        <select
          value={settings.type}
          onChange={(e) => set("type", e.target.value as ChartType)}
          className="border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-blue-500"
        >
          {CHART_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {settings.type !== "table" && settings.type !== "pie" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              X axis
            </label>
            <select
              value={settings.xKey}
              onChange={(e) => set("xKey", e.target.value)}
              className="border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-blue-500"
            >
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Y axis (multi-select)
            </label>
            <select
              multiple
              value={settings.yKeys}
              onChange={(e) =>
                set(
                  "yKeys",
                  Array.from(e.target.selectedOptions).map((o) => o.value)
                )
              }
              className="border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-blue-500 h-20"
            >
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {settings.type === "pie" && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Name column
            </label>
            <select
              value={settings.nameKey}
              onChange={(e) => set("nameKey", e.target.value)}
              className="border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-blue-500"
            >
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Value column
            </label>
            <select
              value={settings.valueKey}
              onChange={(e) => set("valueKey", e.target.value)}
              className="border border-gray-200 rounded-md px-2.5 py-1.5 text-gray-700 focus:outline-none focus:border-blue-500"
            >
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}

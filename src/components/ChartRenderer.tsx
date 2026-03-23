"use client";

import type { QueryResult } from "@/lib/bigquery";
import type { ChartSettings } from "./ChartConfig";
import LineChart from "./charts/LineChart";
import BarChart from "./charts/BarChart";
import PieChart from "./charts/PieChart";
import DataTable from "./charts/DataTable";

interface Props {
  result: QueryResult;
  settings: ChartSettings;
}

export default function ChartRenderer({ result, settings }: Props) {
  const { rows, schema } = result;

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No rows returned
      </div>
    );
  }

  if (settings.type === "table") {
    return <DataTable rows={rows} schema={schema} />;
  }

  if (settings.type === "line") {
    return (
      <LineChart
        data={rows}
        xKey={settings.xKey}
        yKeys={settings.yKeys.length > 0 ? settings.yKeys : [settings.valueKey]}
      />
    );
  }

  if (settings.type === "bar") {
    return (
      <BarChart
        data={rows}
        xKey={settings.xKey}
        yKeys={settings.yKeys.length > 0 ? settings.yKeys : [settings.valueKey]}
      />
    );
  }

  if (settings.type === "pie") {
    return (
      <PieChart
        data={rows}
        nameKey={settings.nameKey}
        valueKey={settings.valueKey}
      />
    );
  }

  return null;
}

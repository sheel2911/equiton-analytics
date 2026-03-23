"use client";

import { useState } from "react";
import clsx from "clsx";

interface Props {
  rows: Record<string, unknown>[];
  schema: { name: string; type: string }[];
}

const PAGE_SIZE = 25;

export default function DataTable({ rows, schema }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns = schema.length > 0 ? schema : Object.keys(rows[0] ?? {}).map((k) => ({ name: k, type: "STRING" }));

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    {col.name}
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {col.type}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visible.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50 transition-colors">
                {columns.map((col) => {
                  const val = row[col.name];
                  const display =
                    val === null || val === undefined
                      ? ""
                      : typeof val === "object"
                      ? JSON.stringify(val)
                      : String(val);
                  return (
                    <td
                      key={col.name}
                      className="px-4 py-2 text-gray-700 max-w-xs truncate"
                      title={display}
                    >
                      {display === "" ? (
                        <span className="text-gray-300 italic">null</span>
                      ) : (
                        display
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>
            Rows {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className={clsx(
                "px-3 py-1 rounded border text-xs",
                page === 0
                  ? "text-gray-300 border-gray-200 cursor-not-allowed"
                  : "text-gray-600 border-gray-300 hover:bg-gray-100"
              )}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={clsx(
                "px-3 py-1 rounded border text-xs",
                page >= totalPages - 1
                  ? "text-gray-300 border-gray-200 cursor-not-allowed"
                  : "text-gray-600 border-gray-300 hover:bg-gray-100"
              )}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

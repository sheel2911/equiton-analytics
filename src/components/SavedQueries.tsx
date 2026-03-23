"use client";

import { useState, useEffect } from "react";
import { BookMarked, Trash2, Plus } from "lucide-react";

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  createdAt: string;
}

const STORAGE_KEY = "bq_saved_queries";

function load(): SavedQuery[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(queries: SavedQuery[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
}

interface Props {
  currentSql: string;
  onLoad: (sql: string) => void;
}

export default function SavedQueries({ currentSql, onLoad }: Props) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => setQueries(load()), []);

  function saveQuery() {
    if (!name.trim() || !currentSql.trim()) return;
    const updated = [
      ...queries,
      {
        id: Date.now().toString(),
        name: name.trim(),
        sql: currentSql,
        createdAt: new Date().toISOString(),
      },
    ];
    setQueries(updated);
    save(updated);
    setName("");
  }

  function deleteQuery(id: string) {
    const updated = queries.filter((q) => q.id !== id);
    setQueries(updated);
    save(updated);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        <BookMarked size={13} />
        Saved queries {queries.length > 0 && `(${queries.length})`}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-10 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-3 flex flex-col gap-3">
          {/* Save current */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Query name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && saveQuery()}
            />
            <button
              onClick={saveQuery}
              disabled={!name.trim() || !currentSql.trim()}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              <Plus size={12} />
              Save
            </button>
          </div>

          {queries.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No saved queries yet</p>
          )}

          <ul className="flex flex-col gap-1 max-h-56 overflow-y-auto">
            {queries.map((q) => (
              <li
                key={q.id}
                className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 group"
              >
                <button
                  onClick={() => { onLoad(q.sql); setOpen(false); }}
                  className="text-left flex-1"
                >
                  <div className="text-xs font-medium text-gray-700">{q.name}</div>
                  <div className="text-xs text-gray-400 truncate font-mono">{q.sql.slice(0, 60)}…</div>
                </button>
                <button
                  onClick={() => deleteQuery(q.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

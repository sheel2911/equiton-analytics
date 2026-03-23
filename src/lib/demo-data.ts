import type { QueryResult } from "./bigquery";

// Sample data returned when BQ_PROJECT_ID is not configured
export const DEMO_RESULT: QueryResult = {
  jobId: "demo-job-001",
  totalRows: 12,
  schema: [
    { name: "month", type: "STRING" },
    { name: "revenue", type: "FLOAT" },
    { name: "expenses", type: "FLOAT" },
    { name: "profit", type: "FLOAT" },
  ],
  rows: [
    { month: "Jan 2024", revenue: 142000, expenses: 98000, profit: 44000 },
    { month: "Feb 2024", revenue: 158000, expenses: 102000, profit: 56000 },
    { month: "Mar 2024", revenue: 175000, expenses: 110000, profit: 65000 },
    { month: "Apr 2024", revenue: 163000, expenses: 105000, profit: 58000 },
    { month: "May 2024", revenue: 189000, expenses: 118000, profit: 71000 },
    { month: "Jun 2024", revenue: 212000, expenses: 130000, profit: 82000 },
    { month: "Jul 2024", revenue: 198000, expenses: 125000, profit: 73000 },
    { month: "Aug 2024", revenue: 225000, expenses: 140000, profit: 85000 },
    { month: "Sep 2024", revenue: 241000, expenses: 148000, profit: 93000 },
    { month: "Oct 2024", revenue: 260000, expenses: 155000, profit: 105000 },
    { month: "Nov 2024", revenue: 278000, expenses: 162000, profit: 116000 },
    { month: "Dec 2024", revenue: 310000, expenses: 178000, profit: 132000 },
  ],
};

export const DEMO_DATASETS = ["demo_dataset", "analytics", "sales"];
export const DEMO_TABLES = ["monthly_revenue", "user_events", "transactions"];

export function isDemoMode() {
  return !process.env.BQ_PROJECT_ID && !process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

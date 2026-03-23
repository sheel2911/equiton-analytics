import { BigQuery, BigQueryOptions } from "@google-cloud/bigquery";

let client: BigQuery | null = null;

function getBigQueryClient(): BigQuery {
  if (client) return client;

  const options: BigQueryOptions = {
    projectId: process.env.BQ_PROJECT_ID,
  };

  // Support JSON key string (e.g. for deployment env vars)
  if (process.env.BQ_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.BQ_SERVICE_ACCOUNT_KEY);
      options.credentials = credentials;
    } catch {
      throw new Error("BQ_SERVICE_ACCOUNT_KEY is not valid JSON");
    }
  }
  // Otherwise fall back to GOOGLE_APPLICATION_CREDENTIALS file path

  client = new BigQuery(options);
  return client;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  schema: { name: string; type: string }[];
  totalRows: number;
  jobId: string;
}

export async function runQuery(
  sql: string,
  maxResults = 1000
): Promise<QueryResult> {
  const bq = getBigQueryClient();

  const [job] = await bq.createQueryJob({
    query: sql,
    maximumBytesBilled: "1073741824", // 1 GB safety cap
  });

  const [rows, , response] = await job.getQueryResults({ maxResults });

  const schema =
    response?.schema?.fields?.map((f: { name?: string; type?: string }) => ({
      name: f.name ?? "",
      type: f.type ?? "STRING",
    })) ?? [];

  return {
    rows: rows as Record<string, unknown>[],
    schema,
    totalRows: rows.length,
    jobId: job.id ?? "",
  };
}

export async function listDatasets(): Promise<string[]> {
  const bq = getBigQueryClient();
  const [datasets] = await bq.getDatasets();
  return datasets.map((d) => d.id ?? "").filter(Boolean);
}

export async function listTables(datasetId: string): Promise<string[]> {
  const bq = getBigQueryClient();
  const dataset = bq.dataset(datasetId);
  const [tables] = await dataset.getTables();
  return tables.map((t) => t.id ?? "").filter(Boolean);
}

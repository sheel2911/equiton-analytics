import { NextRequest, NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import {
  isDemoMode,
  DEMO_RESULT,
  MARKETING_LEADS_ROWS,
  MARKETING_LEADS_SCHEMA,
} from "@/lib/demo-data";
import { MARKETING_QUERIES } from "@/lib/marketing-queries";

function runDemoQuery(sql: string) {
  const lower = sql.toLowerCase();

  // Route to marketing leads demo data
  if (lower.includes("et_leads_detail") || lower.includes("et_leads_details_latest") || lower.includes("marketing_leads")) {
    const matched = MARKETING_QUERIES.find((q) => q.sql.replace(/\s+/g, " ").trim() === sql.replace(/\s+/g, " ").trim());

    // For pre-built queries we apply simple in-memory aggregation
    if (matched) {
      return applyPrebuiltQuery(matched.id);
    }

    // Raw fallback: return all rows with full schema
    return {
      rows: MARKETING_LEADS_ROWS,
      schema: MARKETING_LEADS_SCHEMA,
      totalRows: MARKETING_LEADS_ROWS.length,
      jobId: `demo-ml-${Date.now()}`,
    };
  }

  return { ...DEMO_RESULT, jobId: `demo-${Date.now()}` };
}

// Simple in-memory aggregation for each pre-built query
function applyPrebuiltQuery(id: string) {
  const rows = MARKETING_LEADS_ROWS;

  const agg = (data: Record<string, unknown>[], schema: { name: string; type: string }[]) => ({
    rows: data,
    schema,
    totalRows: data.length,
    jobId: `demo-${id}-${Date.now()}`,
  });

  switch (id) {
    case "funnel_overview":
      return agg([
        { stage: "Lead Created",      count: rows.length },
        { stage: "Meeting Booked",    count: rows.filter((r) => r.MeetingBookedDate).length },
        { stage: "Meeting Completed", count: rows.filter((r) => r.MeetingCompletedDate).length },
        { stage: "No Show",           count: rows.filter((r) => r.MeetingNoShowDate).length },
        { stage: "Converted",         count: rows.filter((r) => r.CustomerCreatedDate).length },
      ], [{ name: "stage", type: "STRING" }, { name: "count", type: "INT64" }]);

    case "monthly_lead_volume": {
      const byMonth: Record<string, { new_leads: number; converted: number }> = {};
      rows.forEach((r) => {
        const m = String(r.LeadCreatedDate).slice(0, 7);
        if (!byMonth[m]) byMonth[m] = { new_leads: 0, converted: 0 };
        byMonth[m].new_leads++;
        if (r.CustomerCreatedDate) byMonth[m].converted++;
      });
      return agg(
        Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
        [{ name: "month", type: "STRING" }, { name: "new_leads", type: "INT64" }, { name: "converted", type: "INT64" }]
      );
    }

    case "leads_by_source": {
      const g = groupCount(rows, "MarketingSource");
      return agg(g.map(([k, v]) => ({ MarketingSource: k, leads: v })),
        [{ name: "MarketingSource", type: "STRING" }, { name: "leads", type: "INT64" }]);
    }

    case "leads_by_medium": {
      const g = groupCount(rows, "Medium");
      return agg(g.map(([k, v]) => ({ Medium: k, leads: v })),
        [{ name: "Medium", type: "STRING" }, { name: "leads", type: "INT64" }]);
    }

    case "revenue_pipeline": {
      const g = groupBy(rows, "Tier");
      return agg(
        Object.entries(g).map(([Tier, rs]) => ({
          Tier,
          total_revenue: sum(rs, "Revenue"),
          revenue_submitted: sum(rs, "RevenueSubmitted"),
          revenue_closed: sum(rs, "RevenueClosed"),
        })).sort((a, b) => (b.total_revenue as number) - (a.total_revenue as number)),
        [
          { name: "Tier", type: "STRING" },
          { name: "total_revenue", type: "FLOAT64" },
          { name: "revenue_submitted", type: "FLOAT64" },
          { name: "revenue_closed", type: "FLOAT64" },
        ]
      );
    }

    case "revenue_by_campaign": {
      const g = groupBy(rows, "Campaign");
      return agg(
        Object.entries(g).map(([Campaign, rs]) => ({
          Campaign,
          revenue_submitted: sum(rs, "RevenueSubmitted"),
          revenue_closed: sum(rs, "RevenueClosed"),
        })).sort((a, b) => (b.revenue_submitted as number) - (a.revenue_submitted as number)),
        [
          { name: "Campaign", type: "STRING" },
          { name: "revenue_submitted", type: "FLOAT64" },
          { name: "revenue_closed", type: "FLOAT64" },
        ]
      );
    }

    case "conversion_rate_by_source": {
      const g = groupBy(rows, "MarketingSource");
      return agg(
        Object.entries(g).map(([MarketingSource, rs]) => ({
          MarketingSource,
          total_leads: rs.length,
          converted: rs.filter((r) => r.CustomerCreatedDate).length,
          conversion_rate_pct: Math.round((1000 * rs.filter((r) => r.CustomerCreatedDate).length) / rs.length) / 10,
        })).sort((a, b) => (b.conversion_rate_pct as number) - (a.conversion_rate_pct as number)),
        [
          { name: "MarketingSource", type: "STRING" },
          { name: "total_leads", type: "INT64" },
          { name: "converted", type: "INT64" },
          { name: "conversion_rate_pct", type: "FLOAT64" },
        ]
      );
    }

    case "meeting_outcomes":
      return agg([
        { outcome: "Booked",    count: rows.filter((r) => r.MeetingBookedDate).length },
        { outcome: "Completed", count: rows.filter((r) => r.MeetingCompletedDate).length },
        { outcome: "No Show",   count: rows.filter((r) => r.MeetingNoShowDate).length },
      ], [{ name: "outcome", type: "STRING" }, { name: "count", type: "INT64" }]);

    case "no_show_rate_by_source": {
      const booked = rows.filter((r) => r.MeetingBookedDate);
      const g = groupBy(booked, "MarketingSource");
      return agg(
        Object.entries(g).map(([MarketingSource, rs]) => ({
          MarketingSource,
          meetings_booked: rs.length,
          no_shows: rs.filter((r) => r.MeetingNoShowDate).length,
          no_show_rate_pct: Math.round((1000 * rs.filter((r) => r.MeetingNoShowDate).length) / rs.length) / 10,
        })).sort((a, b) => (b.no_show_rate_pct as number) - (a.no_show_rate_pct as number)),
        [
          { name: "MarketingSource", type: "STRING" },
          { name: "meetings_booked", type: "INT64" },
          { name: "no_shows", type: "INT64" },
          { name: "no_show_rate_pct", type: "FLOAT64" },
        ]
      );
    }

    case "leads_by_province": {
      const g = groupBy(rows, "ProvinceCode");
      return agg(
        Object.entries(g).map(([ProvinceCode, rs]) => ({
          ProvinceCode,
          leads: rs.length,
          converted: rs.filter((r) => r.CustomerCreatedDate).length,
          revenue_closed: sum(rs, "RevenueClosed"),
        })).sort((a, b) => (b.leads as number) - (a.leads as number)),
        [
          { name: "ProvinceCode", type: "STRING" },
          { name: "leads", type: "INT64" },
          { name: "converted", type: "INT64" },
          { name: "revenue_closed", type: "FLOAT64" },
        ]
      );
    }

    case "leads_by_city": {
      const g = groupBy(rows, "City");
      return agg(
        Object.entries(g).map(([City, rs]) => ({
          City,
          leads: rs.length,
          total_revenue: sum(rs, "Revenue"),
        })).sort((a, b) => (b.leads as number) - (a.leads as number)).slice(0, 15),
        [
          { name: "City", type: "STRING" },
          { name: "leads", type: "INT64" },
          { name: "total_revenue", type: "FLOAT64" },
        ]
      );
    }

    case "investment_objectives": {
      const g = groupCount(rows, "InvestmentObjective");
      return agg(g.map(([k, v]) => ({ InvestmentObjective: k, count: v })),
        [{ name: "InvestmentObjective", type: "STRING" }, { name: "count", type: "INT64" }]);
    }

    case "investment_horizons": {
      const g = groupCount(rows, "InvestmentYearHorizon");
      return agg(g.map(([k, v]) => ({ InvestmentYearHorizon: k, count: v })),
        [{ name: "InvestmentYearHorizon", type: "STRING" }, { name: "count", type: "INT64" }]);
    }

    case "employment_type": {
      const g = groupBy(rows, "EmploymentType");
      return agg(
        Object.entries(g).map(([EmploymentType, rs]) => ({
          EmploymentType,
          count: rs.length,
          avg_net_worth: Math.round(rs.reduce((s, r) => s + (Number(r.NetWorth) || 0), 0) / rs.length),
        })).sort((a, b) => (b.count as number) - (a.count as number)),
        [
          { name: "EmploymentType", type: "STRING" },
          { name: "count", type: "INT64" },
          { name: "avg_net_worth", type: "FLOAT64" },
        ]
      );
    }

    case "client_type": {
      const g = groupCount(rows, "ClientType");
      return agg(g.map(([k, v]) => ({ ClientType: k, count: v })),
        [{ name: "ClientType", type: "STRING" }, { name: "count", type: "INT64" }]);
    }

    case "lead_quality_by_source": {
      const g = groupBy(rows, "MarketingSource");
      return agg(
        Object.entries(g).map(([MarketingSource, rs]) => ({
          MarketingSource,
          total: rs.length,
          bad_email_pct: Math.round((1000 * rs.filter((r) => r.IsBadEmail).length) / rs.length) / 10,
          bad_number_pct: Math.round((1000 * rs.filter((r) => r.IsBadNumber).length) / rs.length) / 10,
          bad_info_pct: Math.round((1000 * rs.filter((r) => r.IsBadInformation).length) / rs.length) / 10,
        })).sort((a, b) => (b.bad_email_pct as number) - (a.bad_email_pct as number)),
        [
          { name: "MarketingSource", type: "STRING" },
          { name: "total", type: "INT64" },
          { name: "bad_email_pct", type: "FLOAT64" },
          { name: "bad_number_pct", type: "FLOAT64" },
          { name: "bad_info_pct", type: "FLOAT64" },
        ]
      );
    }

    case "device_breakdown": {
      const g = groupBy(rows, "DeviceType");
      return agg(
        Object.entries(g).map(([DeviceType, rs]) => ({ DeviceType, leads: rs.length }))
          .sort((a, b) => (b.leads as number) - (a.leads as number)),
        [{ name: "DeviceType", type: "STRING" }, { name: "leads", type: "INT64" }]
      );
    }

    case "advisor_performance": {
      const g = groupBy(rows.filter((r) => r.Advisor), "Advisor");
      return agg(
        Object.entries(g).map(([Advisor, rs]) => ({
          Advisor,
          clients: rs.length,
          revenue_submitted: sum(rs, "RevenueSubmitted"),
          revenue_closed: sum(rs, "RevenueClosed"),
        })).sort((a, b) => (b.revenue_closed as number) - (a.revenue_closed as number)),
        [
          { name: "Advisor", type: "STRING" },
          { name: "clients", type: "INT64" },
          { name: "revenue_submitted", type: "FLOAT64" },
          { name: "revenue_closed", type: "FLOAT64" },
        ]
      );
    }

    case "bda_lead_volume": {
      const g = groupBy(rows, "Bda");
      return agg(
        Object.entries(g).map(([Bda, rs]) => ({
          Bda,
          total_leads: rs.length,
          converted: rs.filter((r) => r.CustomerCreatedDate).length,
          conversion_rate_pct: Math.round((1000 * rs.filter((r) => r.CustomerCreatedDate).length) / rs.length) / 10,
        })).sort((a, b) => (b.total_leads as number) - (a.total_leads as number)),
        [
          { name: "Bda", type: "STRING" },
          { name: "total_leads", type: "INT64" },
          { name: "converted", type: "INT64" },
          { name: "conversion_rate_pct", type: "FLOAT64" },
        ]
      );
    }

    case "monthly_revenue_closed": {
      const byMonth: Record<string, number> = {};
      rows.filter((r) => r.CustomerCreatedDate).forEach((r) => {
        const m = String(r.CustomerCreatedDate).slice(0, 7);
        byMonth[m] = (byMonth[m] ?? 0) + (Number(r.RevenueClosed) || 0);
      });
      return agg(
        Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, revenue_closed]) => ({ month, revenue_closed: Math.round(revenue_closed) })),
        [{ name: "month", type: "STRING" }, { name: "revenue_closed", type: "FLOAT64" }]
      );
    }

    default:
      // Fallback: return all rows
      return {
        rows: MARKETING_LEADS_ROWS.slice(0, 100),
        schema: MARKETING_LEADS_SCHEMA,
        totalRows: MARKETING_LEADS_ROWS.length,
        jobId: `demo-fallback-${Date.now()}`,
      };
  }
}

function groupBy(rows: Record<string, unknown>[], key: string): Record<string, Record<string, unknown>[]> {
  const out: Record<string, Record<string, unknown>[]> = {};
  rows.forEach((r) => {
    const k = String(r[key] ?? "Unknown");
    (out[k] ??= []).push(r);
  });
  return out;
}

function groupCount(rows: Record<string, unknown>[], key: string): [string, number][] {
  const g = groupBy(rows, key);
  return Object.entries(g).map(([k, v]) => [k, v.length] as [string, number]).sort((a, b) => b[1] - a[1]);
}

function sum(rows: Record<string, unknown>[], key: string): number {
  return Math.round(rows.reduce((s, r) => s + (Number(r[key]) || 0), 0));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sql, maxResults } = body as { sql: string; maxResults?: number };

    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "sql is required" }, { status: 400 });
    }

    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 400));
      const result = runDemoQuery(sql);
      return NextResponse.json(result);
    }

    const result = await runQuery(sql.trim(), maxResults ?? 1000);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[BigQuery] query error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

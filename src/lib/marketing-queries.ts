export type ChartType = "line" | "bar" | "pie" | "table";

export interface PrebuiltQuery {
  id: string;
  category: string;
  title: string;
  description: string;
  sql: string;
  defaultChart: ChartType;
  xKey?: string;
  yKeys?: string[];
  nameKey?: string;
  valueKey?: string;
}

const T = "equiton.marketing_leads";

export const MARKETING_QUERIES: PrebuiltQuery[] = [
  // ── Funnel ────────────────────────────────────────────────────────────────
  {
    id: "funnel_overview",
    category: "Funnel",
    title: "Lead Funnel Overview",
    description: "Count of leads at each stage: created → meeting booked → completed → converted to customer.",
    defaultChart: "bar",
    xKey: "stage",
    yKeys: ["count"],
    sql: `SELECT stage, count FROM (
  SELECT 'Lead Created'       AS stage, 1  AS sort_order, COUNT(*) AS count FROM ${T}
  UNION ALL
  SELECT 'Meeting Booked'     AS stage, 2, COUNT(*) FROM ${T} WHERE MeetingBookedDate IS NOT NULL
  UNION ALL
  SELECT 'Meeting Completed'  AS stage, 3, COUNT(*) FROM ${T} WHERE MeetingCompletedDate IS NOT NULL
  UNION ALL
  SELECT 'No Show'            AS stage, 4, COUNT(*) FROM ${T} WHERE MeetingNoShowDate IS NOT NULL
  UNION ALL
  SELECT 'Converted'          AS stage, 5, COUNT(*) FROM ${T} WHERE CustomerCreatedDate IS NOT NULL
)
ORDER BY sort_order`,
  },
  {
    id: "monthly_lead_volume",
    category: "Funnel",
    title: "Monthly Lead Volume",
    description: "New leads and conversions per month — trend over time.",
    defaultChart: "line",
    xKey: "month",
    yKeys: ["new_leads", "converted"],
    sql: `SELECT
  FORMAT_DATE('%Y-%m', LeadCreatedDate) AS month,
  COUNT(*) AS new_leads,
  COUNTIF(CustomerCreatedDate IS NOT NULL) AS converted
FROM ${T}
GROUP BY month
ORDER BY month`,
  },
  {
    id: "conversion_rate_by_source",
    category: "Funnel",
    title: "Conversion Rate by Source",
    description: "Lead-to-customer conversion rate per marketing source.",
    defaultChart: "bar",
    xKey: "MarketingSource",
    yKeys: ["conversion_rate_pct"],
    sql: `SELECT
  MarketingSource,
  COUNT(*) AS total_leads,
  COUNTIF(CustomerCreatedDate IS NOT NULL) AS converted,
  ROUND(100 * COUNTIF(CustomerCreatedDate IS NOT NULL) / COUNT(*), 1) AS conversion_rate_pct
FROM ${T}
WHERE MarketingSource IS NOT NULL
GROUP BY MarketingSource
ORDER BY conversion_rate_pct DESC`,
  },

  // ── Source & Campaign ─────────────────────────────────────────────────────
  {
    id: "leads_by_source",
    category: "Source & Campaign",
    title: "Leads by Marketing Source",
    description: "Distribution of leads across all acquisition channels.",
    defaultChart: "pie",
    nameKey: "MarketingSource",
    valueKey: "leads",
    sql: `SELECT
  MarketingSource,
  COUNT(*) AS leads
FROM ${T}
WHERE MarketingSource IS NOT NULL
GROUP BY MarketingSource
ORDER BY leads DESC`,
  },
  {
    id: "revenue_by_campaign",
    category: "Source & Campaign",
    title: "Revenue by Campaign",
    description: "Total revenue submitted and closed per campaign.",
    defaultChart: "bar",
    xKey: "Campaign",
    yKeys: ["revenue_submitted", "revenue_closed"],
    sql: `SELECT
  Campaign,
  ROUND(SUM(RevenueSubmitted), 0) AS revenue_submitted,
  ROUND(SUM(RevenueClosed), 0) AS revenue_closed
FROM ${T}
WHERE Campaign IS NOT NULL
GROUP BY Campaign
ORDER BY revenue_submitted DESC`,
  },
  {
    id: "leads_by_medium",
    category: "Source & Campaign",
    title: "Leads by Medium",
    description: "Breakdown of leads by marketing medium (cpc, social, email, etc.).",
    defaultChart: "pie",
    nameKey: "Medium",
    valueKey: "leads",
    sql: `SELECT
  Medium,
  COUNT(*) AS leads
FROM ${T}
WHERE Medium IS NOT NULL
GROUP BY Medium
ORDER BY leads DESC`,
  },
  {
    id: "keyword_performance",
    category: "Source & Campaign",
    title: "Top Paid Search Keywords",
    description: "Leads and revenue from Google Ads keywords.",
    defaultChart: "bar",
    xKey: "Keyword",
    yKeys: ["leads", "revenue_submitted"],
    sql: `SELECT
  Keyword,
  COUNT(*) AS leads,
  ROUND(SUM(RevenueSubmitted), 0) AS revenue_submitted
FROM ${T}
WHERE Keyword IS NOT NULL
GROUP BY Keyword
ORDER BY leads DESC
LIMIT 20`,
  },

  // ── Revenue ───────────────────────────────────────────────────────────────
  {
    id: "revenue_pipeline",
    category: "Revenue",
    title: "Revenue Pipeline by Tier",
    description: "Total revenue, submitted, and closed segmented by client tier.",
    defaultChart: "bar",
    xKey: "Tier",
    yKeys: ["total_revenue", "revenue_submitted", "revenue_closed"],
    sql: `SELECT
  Tier,
  ROUND(SUM(Revenue), 0) AS total_revenue,
  ROUND(SUM(RevenueSubmitted), 0) AS revenue_submitted,
  ROUND(SUM(RevenueClosed), 0) AS revenue_closed
FROM ${T}
WHERE Tier IS NOT NULL
GROUP BY Tier
ORDER BY total_revenue DESC`,
  },
  {
    id: "monthly_revenue_closed",
    category: "Revenue",
    title: "Monthly Closed Revenue",
    description: "Revenue closed per month — track sales velocity over time.",
    defaultChart: "line",
    xKey: "month",
    yKeys: ["revenue_closed"],
    sql: `SELECT
  FORMAT_DATE('%Y-%m', CustomerCreatedDate) AS month,
  ROUND(SUM(RevenueClosed), 0) AS revenue_closed
FROM ${T}
WHERE CustomerCreatedDate IS NOT NULL
GROUP BY month
ORDER BY month`,
  },
  {
    id: "avg_deal_size_by_source",
    category: "Revenue",
    title: "Avg Deal Size by Source",
    description: "Average closed deal size per acquisition source.",
    defaultChart: "bar",
    xKey: "MarketingSource",
    yKeys: ["avg_closed"],
    sql: `SELECT
  MarketingSource,
  ROUND(AVG(RevenueClosed), 0) AS avg_closed,
  COUNT(*) AS deals
FROM ${T}
WHERE RevenueClosed > 0 AND MarketingSource IS NOT NULL
GROUP BY MarketingSource
ORDER BY avg_closed DESC`,
  },

  // ── Meetings ──────────────────────────────────────────────────────────────
  {
    id: "meeting_outcomes",
    category: "Meetings",
    title: "Meeting Outcomes",
    description: "Booked, completed, and no-show meeting counts.",
    defaultChart: "bar",
    xKey: "outcome",
    yKeys: ["count"],
    sql: `SELECT outcome, count FROM (
  SELECT 'Booked'    AS outcome, 1 AS s, COUNT(*) AS count FROM ${T} WHERE MeetingBookedDate IS NOT NULL
  UNION ALL
  SELECT 'Completed' AS outcome, 2, COUNT(*) FROM ${T} WHERE MeetingCompletedDate IS NOT NULL
  UNION ALL
  SELECT 'No Show'   AS outcome, 3, COUNT(*) FROM ${T} WHERE MeetingNoShowDate IS NOT NULL
)
ORDER BY s`,
  },
  {
    id: "no_show_rate_by_source",
    category: "Meetings",
    title: "No-Show Rate by Source",
    description: "Meeting no-show rate per acquisition channel.",
    defaultChart: "bar",
    xKey: "MarketingSource",
    yKeys: ["no_show_rate_pct"],
    sql: `SELECT
  MarketingSource,
  COUNT(*) AS meetings_booked,
  COUNTIF(MeetingNoShowDate IS NOT NULL) AS no_shows,
  ROUND(100 * COUNTIF(MeetingNoShowDate IS NOT NULL) / COUNT(*), 1) AS no_show_rate_pct
FROM ${T}
WHERE MeetingBookedDate IS NOT NULL AND MarketingSource IS NOT NULL
GROUP BY MarketingSource
ORDER BY no_show_rate_pct DESC`,
  },

  // ── Geography ─────────────────────────────────────────────────────────────
  {
    id: "leads_by_province",
    category: "Geography",
    title: "Leads by Province",
    description: "Lead volume broken down by Canadian province.",
    defaultChart: "bar",
    xKey: "ProvinceCode",
    yKeys: ["leads"],
    sql: `SELECT
  ProvinceCode,
  COUNT(*) AS leads,
  COUNTIF(CustomerCreatedDate IS NOT NULL) AS converted,
  ROUND(SUM(RevenueClosed), 0) AS revenue_closed
FROM ${T}
WHERE ProvinceCode IS NOT NULL
GROUP BY ProvinceCode
ORDER BY leads DESC`,
  },
  {
    id: "leads_by_city",
    category: "Geography",
    title: "Top Cities by Lead Volume",
    description: "Top 15 cities generating the most leads.",
    defaultChart: "bar",
    xKey: "City",
    yKeys: ["leads"],
    sql: `SELECT
  City,
  COUNT(*) AS leads,
  ROUND(SUM(Revenue), 0) AS total_revenue
FROM ${T}
WHERE City IS NOT NULL
GROUP BY City
ORDER BY leads DESC
LIMIT 15`,
  },

  // ── Client Profile ────────────────────────────────────────────────────────
  {
    id: "investment_objectives",
    category: "Client Profile",
    title: "Investment Objectives",
    description: "What clients say they want to achieve.",
    defaultChart: "pie",
    nameKey: "InvestmentObjective",
    valueKey: "count",
    sql: `SELECT
  InvestmentObjective,
  COUNT(*) AS count
FROM ${T}
WHERE InvestmentObjective IS NOT NULL
GROUP BY InvestmentObjective
ORDER BY count DESC`,
  },
  {
    id: "investment_horizons",
    category: "Client Profile",
    title: "Investment Time Horizons",
    description: "Preferred investment duration across all leads.",
    defaultChart: "bar",
    xKey: "InvestmentYearHorizon",
    yKeys: ["count"],
    sql: `SELECT
  InvestmentYearHorizon,
  COUNT(*) AS count
FROM ${T}
WHERE InvestmentYearHorizon IS NOT NULL
GROUP BY InvestmentYearHorizon
ORDER BY count DESC`,
  },
  {
    id: "employment_type",
    category: "Client Profile",
    title: "Employment Type Breakdown",
    description: "Mix of employed, self-employed, retired, and business owners.",
    defaultChart: "pie",
    nameKey: "EmploymentType",
    valueKey: "count",
    sql: `SELECT
  EmploymentType,
  COUNT(*) AS count,
  ROUND(AVG(NetWorth), 0) AS avg_net_worth
FROM ${T}
WHERE EmploymentType IS NOT NULL
GROUP BY EmploymentType
ORDER BY count DESC`,
  },
  {
    id: "client_type",
    category: "Client Profile",
    title: "Client Type Distribution",
    description: "Individual vs Corporate vs Joint vs Trust accounts.",
    defaultChart: "pie",
    nameKey: "ClientType",
    valueKey: "count",
    sql: `SELECT
  ClientType,
  COUNT(*) AS count
FROM ${T}
WHERE ClientType IS NOT NULL
GROUP BY ClientType
ORDER BY count DESC`,
  },

  // ── Lead Quality ──────────────────────────────────────────────────────────
  {
    id: "lead_quality_by_source",
    category: "Lead Quality",
    title: "Lead Quality by Source",
    description: "Bad email, bad phone, and bad information rates per channel.",
    defaultChart: "bar",
    xKey: "MarketingSource",
    yKeys: ["bad_email_pct", "bad_number_pct", "bad_info_pct"],
    sql: `SELECT
  MarketingSource,
  COUNT(*) AS total,
  ROUND(100 * COUNTIF(IsBadEmail) / COUNT(*), 1) AS bad_email_pct,
  ROUND(100 * COUNTIF(IsBadNumber) / COUNT(*), 1) AS bad_number_pct,
  ROUND(100 * COUNTIF(IsBadInformation) / COUNT(*), 1) AS bad_info_pct
FROM ${T}
WHERE MarketingSource IS NOT NULL
GROUP BY MarketingSource
ORDER BY bad_email_pct DESC`,
  },
  {
    id: "device_breakdown",
    category: "Lead Quality",
    title: "Device & Browser Breakdown",
    description: "Which devices and browsers leads use to submit forms.",
    defaultChart: "bar",
    xKey: "DeviceType",
    yKeys: ["leads"],
    sql: `SELECT
  DeviceType,
  Browser,
  COUNT(*) AS leads
FROM ${T}
WHERE DeviceType IS NOT NULL
GROUP BY DeviceType, Browser
ORDER BY leads DESC`,
  },

  // ── Advisor / BDA ─────────────────────────────────────────────────────────
  {
    id: "advisor_performance",
    category: "Advisor",
    title: "Advisor Revenue Performance",
    description: "Revenue submitted and closed per advisor.",
    defaultChart: "bar",
    xKey: "Advisor",
    yKeys: ["revenue_submitted", "revenue_closed"],
    sql: `SELECT
  Advisor,
  COUNT(*) AS clients,
  ROUND(SUM(RevenueSubmitted), 0) AS revenue_submitted,
  ROUND(SUM(RevenueClosed), 0) AS revenue_closed
FROM ${T}
WHERE Advisor IS NOT NULL
GROUP BY Advisor
ORDER BY revenue_closed DESC`,
  },
  {
    id: "bda_lead_volume",
    category: "Advisor",
    title: "BDA Lead Volume",
    description: "Number of leads and conversions per Business Development Associate.",
    defaultChart: "bar",
    xKey: "Bda",
    yKeys: ["total_leads", "converted"],
    sql: `SELECT
  Bda,
  COUNT(*) AS total_leads,
  COUNTIF(CustomerCreatedDate IS NOT NULL) AS converted,
  ROUND(100 * COUNTIF(CustomerCreatedDate IS NOT NULL) / COUNT(*), 1) AS conversion_rate_pct
FROM ${T}
WHERE Bda IS NOT NULL
GROUP BY Bda
ORDER BY total_leads DESC`,
  },

  // ── Raw Data ──────────────────────────────────────────────────────────────
  {
    id: "all_leads",
    category: "Raw Data",
    title: "All Marketing Leads",
    description: "Full table — all columns, all rows.",
    defaultChart: "table",
    sql: `SELECT * FROM ${T} ORDER BY LeadCreatedDate DESC LIMIT 500`,
  },
  {
    id: "recent_conversions",
    category: "Raw Data",
    title: "Recent Conversions",
    description: "Leads that converted to customers in the last 90 days.",
    defaultChart: "table",
    sql: `SELECT
  LeadCreatedDate, CustomerCreatedDate, FirstName, LastName,
  MarketingSource, Campaign, Tier, RevenueClosed, Advisor, City, ProvinceCode
FROM ${T}
WHERE CustomerCreatedDate >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
ORDER BY CustomerCreatedDate DESC`,
  },
];

export const QUERY_CATEGORIES = [...new Set(MARKETING_QUERIES.map((q) => q.category))];

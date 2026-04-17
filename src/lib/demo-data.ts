import type { QueryResult } from "./bigquery";

// ─── Revenue demo (existing) ──────────────────────────────────────────────────

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

export const DEMO_DATASETS = ["equiton", "analytics", "sales"];
export const DEMO_TABLES = ["marketing_leads", "monthly_revenue", "transactions"];

export function isDemoMode() {
  return !process.env.BQ_PROJECT_ID && !process.env.GOOGLE_APPLICATION_CREDENTIALS;
}

// ─── marketing_leads demo data ────────────────────────────────────────────────

type LeadRow = Record<string, unknown>;

const SOURCES = ["Google Ads", "LinkedIn", "Facebook", "Referral", "Organic", "Email Campaign", "Webinar", "Direct"];
const MEDIUMS = ["cpc", "social", "email", "organic", "referral", "paid_social"];
const CAMPAIGNS = ["Spring_RRSP_2024", "Q3_Awareness", "LinkedIn_HNW", "Fall_Webinar", "Retargeting_2024", "Brand_Search"];
const CITIES = ["Toronto", "Vancouver", "Calgary", "Ottawa", "Montreal", "Edmonton", "Mississauga", "Hamilton"];
const PROVINCES = ["ON", "BC", "AB", "QC", "MB", "NS"];
const TIERS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"];
const CLIENT_TYPES = ["Individual", "Corporate", "Joint", "Trust"];
const INVESTMENT_OBJECTIVES = ["Growth", "Income", "Balanced", "Capital Preservation", "Retirement"];
const HORIZONS = ["1-3 years", "3-5 years", "5-10 years", "10+ years"];
const DEVICES = ["Desktop", "Mobile", "Tablet"];
const BROWSERS = ["Chrome", "Safari", "Edge", "Firefox"];
const EMPLOYMENT_TYPES = ["Employed", "Self-Employed", "Retired", "Business Owner"];
const ADVISORS = ["Sarah Mitchell", "James Chen", "Priya Sharma", "Robert Osei", "Laura Tran"];
const BDAS = ["Alex Kowalski", "Maria Santos", "David Kim", "Nadia Petrov"];
const FORMS = ["Contact Form", "Webinar Registration", "RRSP Guide Download", "Investment Calculator", "Book a Meeting"];
const PAGES = ["/invest", "/rrsp", "/contact", "/about", "/webinar"];
const SOCIAL_PLATFORMS = ["Facebook", "LinkedIn", "Instagram", "YouTube", ""];

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rndBool(prob = 0.5): boolean { return Math.random() < prob; }
function rndFloat(min: number, max: number, dp = 0): number {
  const v = Math.random() * (max - min) + min;
  return Math.round(v * 10 ** dp) / 10 ** dp;
}
function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeLeadRow(i: number): LeadRow {
  const seed = i + 1;
  const leadDate = new Date(2024, Math.floor(i / 5), (i % 28) + 1);
  const hasCustomer = rndBool(0.55);
  const hasMeeting = rndBool(0.6);
  const meetingBooked = hasMeeting ? addDays(leadDate, Math.floor(Math.random() * 14) + 1) : null;
  const isNoShow = hasMeeting && rndBool(0.18);
  const meetingCompleted = hasMeeting && !isNoShow ? addDays(leadDate, Math.floor(Math.random() * 20) + 5) : null;
  const source = rnd(SOURCES);
  const medium = rnd(MEDIUMS);
  const campaign = rnd(CAMPAIGNS);
  const revenue = rndFloat(25000, 500000, 0);
  const revenueSubmitted = hasCustomer ? rndFloat(revenue * 0.5, revenue, 0) : 0;
  const revenueClosed = hasCustomer && rndBool(0.5) ? rndFloat(revenueSubmitted * 0.6, revenueSubmitted, 0) : 0;

  return {
    ingested_at: `${leadDate.toISOString().slice(0, 10)}T08:00:00Z`,
    LeadCreatedDate: leadDate.toISOString().slice(0, 10),
    CustomerCreatedDate: hasCustomer ? addDays(leadDate, Math.floor(Math.random() * 30) + 7) : null,
    CustomerLastUpdateDate: hasCustomer ? addDays(leadDate, Math.floor(Math.random() * 60) + 30) : null,
    CustomerActiveDate: hasCustomer && rndBool(0.7) ? addDays(leadDate, Math.floor(Math.random() * 90) + 30) : null,
    MeetingBookedDate: meetingBooked,
    MeetingNoShowDate: isNoShow ? meetingBooked : null,
    MeetingCompletedDate: meetingCompleted,
    DOB: `${1950 + (seed * 7) % 40}-${String((seed * 3) % 12 + 1).padStart(2, "0")}-15`,
    CustomerNo: hasCustomer ? `EQ${String(10000 + seed).padStart(6, "0")}` : null,
    WebPIN: `WP${String(90000 + seed * 13)}`,
    ClientType: rnd(CLIENT_TYPES),
    FirstName: ["James", "Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Lisa", "William", "Jessica"][seed % 10],
    LastName: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Moore"][seed % 10],
    Email: `lead${seed}@example.com`,
    OriginalEmail: `lead${seed}_orig@example.com`,
    Phone: `416-${String(500 + seed).slice(0, 3)}-${String(1000 + seed * 7).slice(0, 4)}`,
    HHID: `HH${String(20000 + seed)}`,
    Address1: `${100 + seed} Main St`,
    Address2: null,
    Suite: null,
    City: rnd(CITIES),
    ProvinceCode: rnd(PROVINCES),
    CountryCode: "CA",
    PostalCode: `M${seed % 9 + 1}A 1A1`,
    EquitonSourceDetails: `${source} - ${campaign}`,
    MarketingSource: source,
    Medium: medium,
    Campaign: campaign,
    AdGroup: `AG_${campaign}_0${seed % 5 + 1}`,
    Keyword: source === "Google Ads" ? ["real estate investment", "RRSP investing", "private equity canada", "equiton review"][seed % 4] : null,
    FormName: rnd(FORMS),
    LeadPage: rnd(PAGES),
    LandingPage: rnd(PAGES),
    LeadContent: null,
    LeadTypeWebForm: rnd(FORMS),
    SocialPlatform: rnd(SOCIAL_PLATFORMS) || null,
    DeviceType: rnd(DEVICES),
    DeviceMake: "Unknown",
    Browser: rnd(BROWSERS),
    IpAddress: `192.168.${seed % 255}.${(seed * 7) % 255}`,
    Gclid: source === "Google Ads" ? `Cj0KCQjw${seed}EALqBhD` : null,
    FacebookBrowserId: source === "Facebook" ? `fb.1.${Date.now() - seed * 1000}` : null,
    FacebookClickId: source === "Facebook" ? `CjwKC${seed}` : null,
    GoogleAnalyticsClientId: `GA1.2.${seed * 123456}.${Date.now()}`,
    FbLeadId: source === "Facebook" ? `${1000000 + seed}` : null,
    IsBadNumber: rndBool(0.05),
    IsBadInformation: rndBool(0.04),
    IsBadEmail: rndBool(0.03),
    CalendlyStartTime: meetingBooked ? `${meetingBooked}T14:00:00` : null,
    CalendlyEndTime: meetingBooked ? `${meetingBooked}T14:30:00` : null,
    InvestmentObjective: rnd(INVESTMENT_OBJECTIVES),
    InvestmentYearHorizon: rnd(HORIZONS),
    TYQ1: rnd(["Yes", "No", null]),
    TYQ2: rnd(["Yes", "No", null]),
    TYQ3: rnd(["Yes", "No", null]),
    TYQ4: rnd(["Yes", "No", null]),
    Revenue: revenue,
    RevenueSubmitted: revenueSubmitted,
    RevenueClosed: revenueClosed,
    Bda: rnd(BDAS),
    Advisor: hasCustomer ? rnd(ADVISORS) : null,
    EmployerTitle: ["Engineer", "Director", "Manager", "Owner", "Consultant", "Retired"][seed % 6],
    EmploymentType: rnd(EMPLOYMENT_TYPES),
    NetWorth: rndFloat(100000, 5000000, 0),
    Tier: rnd(TIERS),
  };
}

// Seeded so demo data is stable on reload
function seededRows(count: number): LeadRow[] {
  return Array.from({ length: count }, (_, i) => makeLeadRow(i));
}

export const MARKETING_LEADS_ROWS = seededRows(60);

export const MARKETING_LEADS_SCHEMA: { name: string; type: string }[] = [
  { name: "ingested_at", type: "TIMESTAMP" },
  { name: "LeadCreatedDate", type: "DATE" },
  { name: "CustomerCreatedDate", type: "DATE" },
  { name: "CustomerLastUpdateDate", type: "DATE" },
  { name: "CustomerActiveDate", type: "DATE" },
  { name: "MeetingBookedDate", type: "DATE" },
  { name: "MeetingNoShowDate", type: "DATE" },
  { name: "MeetingCompletedDate", type: "DATE" },
  { name: "DOB", type: "DATE" },
  { name: "CustomerNo", type: "STRING" },
  { name: "WebPIN", type: "STRING" },
  { name: "ClientType", type: "STRING" },
  { name: "FirstName", type: "STRING" },
  { name: "LastName", type: "STRING" },
  { name: "Email", type: "STRING" },
  { name: "OriginalEmail", type: "STRING" },
  { name: "Phone", type: "STRING" },
  { name: "HHID", type: "STRING" },
  { name: "Address1", type: "STRING" },
  { name: "Address2", type: "STRING" },
  { name: "Suite", type: "STRING" },
  { name: "City", type: "STRING" },
  { name: "ProvinceCode", type: "STRING" },
  { name: "CountryCode", type: "STRING" },
  { name: "PostalCode", type: "STRING" },
  { name: "EquitonSourceDetails", type: "STRING" },
  { name: "MarketingSource", type: "STRING" },
  { name: "Medium", type: "STRING" },
  { name: "Campaign", type: "STRING" },
  { name: "AdGroup", type: "STRING" },
  { name: "Keyword", type: "STRING" },
  { name: "FormName", type: "STRING" },
  { name: "LeadPage", type: "STRING" },
  { name: "LandingPage", type: "STRING" },
  { name: "LeadContent", type: "STRING" },
  { name: "LeadTypeWebForm", type: "STRING" },
  { name: "SocialPlatform", type: "STRING" },
  { name: "DeviceType", type: "STRING" },
  { name: "DeviceMake", type: "STRING" },
  { name: "Browser", type: "STRING" },
  { name: "IpAddress", type: "STRING" },
  { name: "Gclid", type: "STRING" },
  { name: "FacebookBrowserId", type: "STRING" },
  { name: "FacebookClickId", type: "STRING" },
  { name: "GoogleAnalyticsClientId", type: "STRING" },
  { name: "FbLeadId", type: "STRING" },
  { name: "IsBadNumber", type: "BOOL" },
  { name: "IsBadInformation", type: "BOOL" },
  { name: "IsBadEmail", type: "BOOL" },
  { name: "CalendlyStartTime", type: "STRING" },
  { name: "CalendlyEndTime", type: "STRING" },
  { name: "InvestmentObjective", type: "STRING" },
  { name: "InvestmentYearHorizon", type: "STRING" },
  { name: "TYQ1", type: "STRING" },
  { name: "TYQ2", type: "STRING" },
  { name: "TYQ3", type: "STRING" },
  { name: "TYQ4", type: "STRING" },
  { name: "Revenue", type: "FLOAT64" },
  { name: "RevenueSubmitted", type: "FLOAT64" },
  { name: "RevenueClosed", type: "FLOAT64" },
  { name: "Bda", type: "STRING" },
  { name: "Advisor", type: "STRING" },
  { name: "EmployerTitle", type: "STRING" },
  { name: "EmploymentType", type: "STRING" },
  { name: "NetWorth", type: "FLOAT64" },
  { name: "Tier", type: "STRING" },
];

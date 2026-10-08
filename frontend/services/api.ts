import {
  DashboardMetrics,
  ClaimsTrendItem,
  SignalDistributionItem,
  ExposureByCategoryItem,
  InvestigationCase,
  CaseEvidence,
  InvestigationNote,
  TimelineEvent,
  GraphNode,
  GraphEdge,
  RiskForecast,
  InvestigationBrief,
  EnrichedClaim,
  ProviderProfile,
} from "../types";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }
  return res.json();
}

export async function getDashboardSummary(): Promise<{
  environment_badge: string;
  metrics: DashboardMetrics;
  claims_trend: ClaimsTrendItem[];
  signal_distribution: SignalDistributionItem[];
  exposure_by_category: ExposureByCategoryItem[];
  priority_queue: InvestigationCase[];
}> {
  return fetchJson("/api/dashboard/summary");
}

export async function getRiskDistribution(): Promise<{
  provider_distribution: { level: string; range: string; count: number }[];
  case_distribution: { level: string; range: string; count: number }[];
}> {
  return fetchJson("/api/risk-distribution");
}

export async function getTopProviders(limit = 15): Promise<{ providers: ProviderProfile[] }> {
  return fetchJson(`/api/top-providers?limit=${limit}`);
}

export async function getCases(params?: {
  status?: string;
  risk_level?: string;
  signal?: string;
  search?: string;
}): Promise<{ total: number; cases: InvestigationCase[] }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.risk_level) sp.set("risk_level", params.risk_level);
  if (params?.signal) sp.set("signal", params.signal);
  if (params?.search) sp.set("search", params.search);
  const qs = sp.toString();
  return fetchJson(`/api/cases${qs ? `?${qs}` : ""}`);
}

export async function getCaseDetail(caseId: string): Promise<{
  case: InvestigationCase;
  evidence: CaseEvidence[];
  notes: InvestigationNote[];
  forecast: RiskForecast;
}> {
  return fetchJson(`/api/cases/${encodeURIComponent(caseId)}`);
}

export async function getCaseTimeline(caseId: string): Promise<{
  case_id: string;
  timeline: TimelineEvent[];
}> {
  return fetchJson(`/api/cases/${encodeURIComponent(caseId)}/timeline`);
}

export async function getCaseGraph(caseId: string): Promise<{
  case_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}> {
  return fetchJson(`/api/cases/${encodeURIComponent(caseId)}/graph`);
}

export async function updateCaseStatus(
  caseId: string,
  status: string,
  investigator = "SIU Lead Investigator"
): Promise<{
  case_id: string;
  status: string;
  case: InvestigationCase;
  notes: InvestigationNote[];
}> {
  return fetchJson(`/api/cases/${encodeURIComponent(caseId)}/status`, {
    method: "POST",
    body: JSON.stringify({ status, investigator }),
  });
}

export async function addCaseNote(
  caseId: string,
  note: string,
  investigator = "SIU Lead Investigator"
): Promise<{
  case_id: string;
  note: InvestigationNote;
  notes: InvestigationNote[];
}> {
  return fetchJson(`/api/cases/${encodeURIComponent(caseId)}/notes`, {
    method: "POST",
    body: JSON.stringify({ note, investigator }),
  });
}

export async function generateInvestigationBrief(caseId: string): Promise<InvestigationBrief> {
  return fetchJson("/api/generate-investigation-brief", {
    method: "POST",
    body: JSON.stringify({ case_id: caseId }),
  });
}

export async function getClaims(params?: {
  risk?: string;
  date?: string;
  provider?: string;
  facility?: string;
  signal?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; limit: number; offset: number; claims: EnrichedClaim[] }> {
  const sp = new URLSearchParams();
  if (params?.risk) sp.set("risk", params.risk);
  if (params?.date) sp.set("date", params.date);
  if (params?.provider) sp.set("provider", params.provider);
  if (params?.facility) sp.set("facility", params.facility);
  if (params?.signal) sp.set("signal", params.signal);
  if (params?.status) sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const qs = sp.toString();
  return fetchJson(`/api/claims${qs ? `?${qs}` : ""}`);
}

export async function getProviders(params?: {
  risk?: string;
  specialty?: string;
  region?: string;
  search?: string;
}): Promise<{ total: number; providers: ProviderProfile[] }> {
  const sp = new URLSearchParams();
  if (params?.risk) sp.set("risk", params.risk);
  if (params?.specialty) sp.set("specialty", params.specialty);
  if (params?.region) sp.set("region", params.region);
  if (params?.search) sp.set("search", params.search);
  const qs = sp.toString();
  return fetchJson(`/api/providers${qs ? `?${qs}` : ""}`);
}

export async function getProviderDetail(providerId: string): Promise<{
  provider: ProviderProfile;
  referrals: {
    referral_id: string;
    from_provider: string;
    to_provider: string;
    member_id: string;
    date: string;
  }[];
  cases: InvestigationCase[];
  recent_claims: EnrichedClaim[];
}> {
  return fetchJson(`/api/providers/${encodeURIComponent(providerId)}`);
}

export async function getNetworkIntelligence(params?: {
  provider?: string;
  facility?: string;
  risk?: string;
  case_id?: string;
  referral_only?: boolean;
}): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: {
    case_id: string;
    provider_id: string;
    provider_name: string;
    facility_id: string;
    risk_score: number;
    signals: string[];
    potential_exposure: number;
  }[];
}> {
  const sp = new URLSearchParams();
  if (params?.provider) sp.set("provider", params.provider);
  if (params?.facility) sp.set("facility", params.facility);
  if (params?.risk) sp.set("risk", params.risk);
  if (params?.case_id) sp.set("case_id", params.case_id);
  if (params?.referral_only) sp.set("referral_only", "true");
  const qs = sp.toString();
  return fetchJson(`/api/network${qs ? `?${qs}` : ""}`);
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface DashboardMetrics {
  claims_analyzed: number;
  suspicious_alerts: number;
  high_risk_cases: number;
  critical_cases: number;
  potential_exposure: number;
  total_cases: number;
}

export interface ClaimsTrendItem {
  month: string;
  claims: number;
  alerts: number;
  amount: number;
  avg_risk: number;
}

export interface SignalDistributionItem {
  signal: string;
  signal_key: string;
  count: number;
}

export interface ExposureByCategoryItem {
  category: RiskLevel;
  exposure: number;
}

export interface InvestigationCase {
  case_id: string;
  primary_claim_id: string;
  provider_id: string;
  provider_name: string;
  specialty: string;
  member_id: string;
  facility_id: string;
  facility_name: string;
  location: string;
  risk_score: number;
  risk_level: RiskLevel;
  rule_score: number;
  ml_score: number;
  graph_score: number;
  temporal_score: number;
  potential_exposure: number;
  total_claimed_amount: number;
  suspicious_claim_count: number;
  evidence_strength: string;
  primary_signals: string[];
  status: string;
  created_at: string;
  ml_top_features: string[];
  claim_ids: string[];
}

export interface CaseEvidence {
  case_id: string;
  signal_type: string;
  severity: "low" | "medium" | "high" | "critical";
  score_contribution: number;
  confidence: number;
  explanation: string;
  supporting_claims: string[];
}

export interface InvestigationNote {
  note_id: string;
  case_id: string;
  investigator: string;
  note: string;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  date: string;
  event_type: string;
  entity_id: string;
  provider_id: string;
  member_id: string;
  facility_id: string;
  location: string;
  amount: number;
  signals: string[];
  highlight: boolean;
  description: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "Provider" | "ReferralProvider" | "Member" | "Facility" | "Claim";
  risk: string;
  risk_score?: number;
  details: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  suspicious: boolean;
}

export interface RiskForecast {
  current_risk_score: number;
  forecast_30_day: number;
  forecast_60_day: number;
  forecast_90_day: number;
  trajectory: string;
  key_drivers: string[];
  label: string;
  disclaimer: string;
}

export interface InvestigationBrief {
  case_id: string;
  provider_id: string;
  risk_score: number;
  risk_level: string;
  why_flagged: string;
  supporting_evidence: string[];
  suspicious_relationships: string;
  financial_impact: string;
  limitations: string;
  recommended_actions: string[];
  formatted_brief: string;
  generated_at: string;
}

export interface EnrichedClaim {
  claim_id: string;
  member_id: string;
  provider_id: string;
  provider_name: string;
  facility_id: string;
  facility_name: string;
  procedure_code: string;
  procedure_name: string;
  expected_cost: number;
  claim_date: string;
  claim_timestamp: string;
  claim_amount: number;
  location: string;
  status: string;
  risk_score: number;
  risk_level: RiskLevel;
  signals: string[];
}

export interface ProviderProfile {
  provider_id: string;
  provider_name: string;
  specialty: string;
  location: string;
  facility_id: string;
  facility_name: string;
  claim_volume: number;
  total_claimed_amount: number;
  average_claim_amount: number;
  utilization_per_day: number;
  risk_score: number;
  risk_level: RiskLevel;
  rule_score: number;
  ml_score: number;
  graph_score: number;
  temporal_score: number;
  ml_top_features: string[];
  fwa_signals: string[];
  connected_facilities: string[];
  referral_volume: number;
  historical_trend: { month: string; claims: number; amount: number }[];
}

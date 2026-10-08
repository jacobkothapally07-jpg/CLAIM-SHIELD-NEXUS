from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Procedure(BaseModel):
    procedure_code: str
    procedure_name: str
    expected_cost: float
    category: str
    bundle_group: Optional[str] = None


class Facility(BaseModel):
    facility_id: str
    facility_name: str
    location: str
    lat: float
    lng: float


class Provider(BaseModel):
    provider_id: str
    provider_name: str
    specialty: str
    location: str
    facility_id: str


class Member(BaseModel):
    member_id: str
    age: int
    synthetic_region: str


class Referral(BaseModel):
    referral_id: str
    from_provider: str
    to_provider: str
    member_id: str
    date: str


class Claim(BaseModel):
    claim_id: str
    member_id: str
    provider_id: str
    facility_id: str
    procedure_code: str
    claim_date: str
    claim_timestamp: str
    claim_amount: float
    location: str
    status: str = "Submitted"
    supporting_activity_count: int = 1
    scenario_id: Optional[str] = None


class PlantedScenario(BaseModel):
    scenario_id: str
    scenario_type: str
    ground_truth: bool = True
    provider_id: str
    claim_ids: List[str]
    description: str


class CaseEvidence(BaseModel):
    case_id: str
    signal_type: str
    severity: str  # low, medium, high, critical
    score_contribution: float
    confidence: float
    explanation: str
    supporting_claims: List[str] = Field(default_factory=list)


class InvestigationNote(BaseModel):
    note_id: str
    case_id: str
    investigator: str
    note: str
    timestamp: str


class InvestigationCase(BaseModel):
    case_id: str
    primary_claim_id: str
    provider_id: str
    provider_name: str
    specialty: str
    member_id: str
    facility_id: str
    facility_name: str
    location: str
    risk_score: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    rule_score: float
    ml_score: float
    graph_score: float
    temporal_score: float
    potential_exposure: float
    total_claimed_amount: float
    suspicious_claim_count: int
    evidence_strength: str  # Moderate, Strong, Very Strong
    primary_signals: List[str]
    status: str  # New, Under Review, Escalated, Dismissed, Resolved
    created_at: str
    ml_top_features: List[str] = Field(default_factory=list)
    claim_ids: List[str] = Field(default_factory=list)

"""
Deterministic Synthetic Data Generator for ClaimShield Nexus.
CRITICAL: ALL DATA GENERATED HERE IS 100% SYNTHETIC.
Uses RANDOM_SEED = 42 for strict reproducibility.
"""

import json
import os
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple

RANDOM_SEED = 42

REGIONS = ["Region-A", "Region-B", "Region-C", "Region-D"]
REGION_COORDS = {
    "Region-A": (10.0, 10.0),
    "Region-B": (10.5, 85.0),
    "Region-C": (75.0, 12.0),
    "Region-D": (88.0, 92.0),
}

SPECIALTIES = [
    "General Practice",
    "Orthopedics",
    "Cardiology",
    "Diagnostic Imaging",
    "Physical Therapy",
    "Pain Management",
    "Neurology",
    "Dermatology",
]

GREEK_NAMES = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
    "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho",
    "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"
]

PROCEDURES_SPEC = [
    ("PROC-001", "Standard Outpatient Consultation", 1200.0, "Consultation", "BUNDLE-CONSULT"),
    ("PROC-002", "Extended Comprehensive Consultation", 4800.0, "Consultation", "BUNDLE-CONSULT"),
    ("PROC-003", "Complex Specialist Evaluation", 9500.0, "Consultation", "BUNDLE-CONSULT"),
    ("PROC-004", "Basic Diagnostic Panel", 1800.0, "Diagnostics", "BUNDLE-DIAG-A"),
    ("PROC-005", "Component Sub-Assay Alpha", 1400.0, "Diagnostics", "BUNDLE-DIAG-A"),
    ("PROC-006", "Component Sub-Assay Beta", 1500.0, "Diagnostics", "BUNDLE-DIAG-A"),
    ("PROC-007", "Advanced Imaging Scan", 12500.0, "Imaging", "BUNDLE-IMG"),
    ("PROC-008", "Contrast Reconstruction Add-on", 6200.0, "Imaging", "BUNDLE-IMG"),
    ("PROC-009", "Physical Therapy Session", 2200.0, "Therapy", "BUNDLE-THER"),
    ("PROC-010", "Neuromuscular Re-education", 3100.0, "Therapy", "BUNDLE-THER"),
    ("PROC-011", "Minor Orthopedic Intervention", 18000.0, "Procedure", "BUNDLE-ORTHO"),
    ("PROC-012", "Major Arthroscopic Procedure", 64000.0, "Procedure", "BUNDLE-ORTHO"),
    ("PROC-013", "Targeted Pain Block", 14500.0, "Pain Management", "BUNDLE-PAIN"),
    ("PROC-014", "Multi-level Spinal Injection", 42000.0, "Pain Management", "BUNDLE-PAIN"),
    ("PROC-015", "Cardiac Stress Evaluation", 8500.0, "Cardiology", "BUNDLE-CARD"),
    ("PROC-016", "High-Complexity Telemetry Monitoring", 36000.0, "Cardiology", "BUNDLE-CARD"),
]


class SyntheticDataGenerator:
    def __init__(self, seed: int = RANDOM_SEED):
        self.seed = seed
        self.rng = random.Random(seed)
        self.base_date = datetime(2026, 1, 1)

        self.procedures: List[Dict[str, Any]] = []
        self.facilities: List[Dict[str, Any]] = []
        self.providers: List[Dict[str, Any]] = []
        self.members: List[Dict[str, Any]] = []
        self.referrals: List[Dict[str, Any]] = []
        self.claims: List[Dict[str, Any]] = []
        self.planted_scenarios: List[Dict[str, Any]] = []

        self._claim_counter = 0
        self._referral_counter = 0
        self._scenario_counter = 0

    def _next_claim_id(self) -> str:
        self._claim_counter += 1
        return f"CLM-{self._claim_counter:06d}"

    def _next_referral_id(self) -> str:
        self._referral_counter += 1
        return f"REF-{self._referral_counter:06d}"

    def _next_scenario_id(self) -> str:
        self._scenario_counter += 1
        return f"SYN-FWA-{self._scenario_counter:04d}"

    def generate_all(self) -> Dict[str, Any]:
        self._generate_procedures()
        self._generate_facilities(100)
        self._generate_providers(500)
        self._generate_members(1000)
        self._generate_normal_referrals(950)
        self._generate_planted_scenarios()
        self._generate_normal_claims(target_total_claims=10000)

        return {
            "seed": self.seed,
            "procedures": self.procedures,
            "facilities": self.facilities,
            "providers": self.providers,
            "members": self.members,
            "referrals": self.referrals,
            "claims": self.claims,
            "planted_scenarios": self.planted_scenarios,
        }

    def _generate_procedures(self) -> None:
        for code, name, cost, cat, bundle in PROCEDURES_SPEC:
            self.procedures.append({
                "procedure_code": code,
                "procedure_name": name,
                "expected_cost": cost,
                "category": cat,
                "bundle_group": bundle,
            })

    def _generate_facilities(self, count: int) -> None:
        for i in range(1, count + 1):
            region = REGIONS[(i - 1) % len(REGIONS)]
            base_lat, base_lng = REGION_COORDS[region]
            greek = GREEK_NAMES[(i - 1) % len(GREEK_NAMES)]
            self.facilities.append({
                "facility_id": f"FAC-{i:04d}",
                "facility_name": f"Facility {greek}-{i:03d}",
                "location": region,
                "lat": round(base_lat + self.rng.uniform(-1.5, 1.5), 4),
                "lng": round(base_lng + self.rng.uniform(-1.5, 1.5), 4),
            })

    def _generate_providers(self, count: int) -> None:
        for i in range(1, count + 1):
            fac = self.facilities[(i - 1) % len(self.facilities)]
            greek = GREEK_NAMES[(i - 1) % len(GREEK_NAMES)]
            specialty = SPECIALTIES[(i - 1) % len(SPECIALTIES)]
            if i == 42:
                # Primary provider for flagship CASE-1842
                specialty = "Pain Management"
                fac = self.facilities[0]  # FAC-0001 in Region-A
            self.providers.append({
                "provider_id": f"PROV-{i:04d}",
                "provider_name": f"Provider {greek}-{i:03d}",
                "specialty": specialty,
                "location": fac["location"],
                "facility_id": fac["facility_id"],
            })

    def _generate_members(self, count: int) -> None:
        for i in range(1, count + 1):
            region = REGIONS[(i - 1) % len(REGIONS)]
            self.members.append({
                "member_id": f"MEM-{i:04d}",
                "age": self.rng.randint(19, 84),
                "synthetic_region": region,
            })

    def _generate_normal_referrals(self, count: int) -> None:
        # Use normal providers (PROV-0100 to PROV-0500) for normal referrals
        normal_provs = self.providers[99:]
        for _ in range(count):
            p1, p2 = self.rng.sample(normal_provs, 2)
            mem = self.rng.choice(self.members)
            day_offset = self.rng.randint(0, 170)
            r_date = (self.base_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            self.referrals.append({
                "referral_id": self._next_referral_id(),
                "from_provider": p1["provider_id"],
                "to_provider": p2["provider_id"],
                "member_id": mem["member_id"],
                "date": r_date,
            })

    def _add_claim(
        self,
        member_id: str,
        provider_id: str,
        facility_id: str,
        procedure_code: str,
        claim_date: str,
        claim_time: str,
        claim_amount: float,
        location: str,
        supporting_activity_count: int = 2,
        scenario_id: str = None,
    ) -> str:
        cid = self._next_claim_id()
        self.claims.append({
            "claim_id": cid,
            "member_id": member_id,
            "provider_id": provider_id,
            "facility_id": facility_id,
            "procedure_code": procedure_code,
            "claim_date": claim_date,
            "claim_timestamp": f"{claim_date}T{claim_time}",
            "claim_amount": round(claim_amount, 2),
            "location": location,
            "status": "Submitted",
            "supporting_activity_count": supporting_activity_count,
            "scenario_id": scenario_id,
        })
        return cid

    def _generate_planted_scenarios(self) -> None:
        """
        Generates 55 planted synthetic FWA scenarios across all 10 required FWA types,
        including the flagship multi-signal demo scenario for PROV-0042 (mapped to CASE-1842).
        """
        # 0. FLAGSHIP MULTI-SIGNAL SCENARIO -> PROV-0042 (CASE-1842)
        scen_flagship = self._next_scenario_id()
        flagship_claims: List[str] = []
        prov_42 = "PROV-0042"
        fac_1 = "FAC-0001"  # Region-A
        fac_4 = "FAC-0004"  # Region-D
        mem_primary = "MEM-0101"

        # (a) Duplicate billing on 2026-05-14
        for idx in range(4):
            cid = self._add_claim(
                member_id=mem_primary,
                provider_id=prov_42,
                facility_id=fac_1,
                procedure_code="PROC-014",
                claim_date="2026-05-14",
                claim_time=f"09:{10 + idx*2:02d}:00",
                claim_amount=42000.0,
                location="Region-A",
                supporting_activity_count=1,
                scenario_id=scen_flagship,
            )
            flagship_claims.append(cid)

        # (b) Impossible timing on 2026-05-15 (Region-A at 10:00 -> Region-D at 10:08 -> Region-A at 10:15)
        cid_t1 = self._add_claim(
            member_id=mem_primary,
            provider_id=prov_42,
            facility_id=fac_1,
            procedure_code="PROC-013",
            claim_date="2026-05-15",
            claim_time="10:00:00",
            claim_amount=14500.0,
            location="Region-A",
            supporting_activity_count=1,
            scenario_id=scen_flagship,
        )
        cid_t2 = self._add_claim(
            member_id="MEM-0102",
            provider_id=prov_42,
            facility_id=fac_4,
            procedure_code="PROC-014",
            claim_date="2026-05-15",
            claim_time="10:08:00",
            claim_amount=98500.0,  # Abnormal billing amount (>2.3x expected 42,000)
            location="Region-D",
            supporting_activity_count=0,
            scenario_id=scen_flagship,
        )
        cid_t3 = self._add_claim(
            member_id="MEM-0103",
            provider_id=prov_42,
            facility_id=fac_1,
            procedure_code="PROC-014",
            claim_date="2026-05-15",
            claim_time="10:15:00",
            claim_amount=94000.0,  # Abnormal billing amount
            location="Region-A",
            supporting_activity_count=0,
            scenario_id=scen_flagship,
        )
        flagship_claims.extend([cid_t1, cid_t2, cid_t3])

        # (c) Excessive utilization + Temporal spike on 2026-05-16 (28 high-value claims in a single day)
        # First add a tiny baseline in Feb/Mar so May represents a massive spike
        for b_day in [10, 25, 42]:
            b_date = (self.base_date + timedelta(days=b_day)).strftime("%Y-%m-%d")
            self._add_claim(
                member_id=f"MEM-{100 + b_day:04d}",
                provider_id=prov_42,
                facility_id=fac_1,
                procedure_code="PROC-001",
                claim_date=b_date,
                claim_time="11:00:00",
                claim_amount=1200.0,
                location="Region-A",
                supporting_activity_count=2,
                scenario_id=scen_flagship,
            )

        for h_idx in range(28):
            mem_id = f"MEM-{101 + (h_idx % 8):04d}"
            proc_code = "PROC-014" if h_idx % 2 == 0 else "PROC-003"
            amt = 88000.0 if proc_code == "PROC-014" else 24500.0
            hour = 8 + (h_idx // 4)
            minute = (h_idx % 4) * 12
            cid = self._add_claim(
                member_id=mem_id,
                provider_id=prov_42,
                facility_id=fac_1 if h_idx % 3 != 0 else fac_4,
                procedure_code=proc_code,
                claim_date="2026-05-16",
                claim_time=f"{hour:02d}:{minute:02d}:00",
                claim_amount=amt,
                location="Region-A" if h_idx % 3 != 0 else "Region-D",
                supporting_activity_count=0 if h_idx % 3 == 0 else 1,
                scenario_id=scen_flagship,
            )
            flagship_claims.append(cid)

        # (d) Unbundling on 2026-05-17 for mem_primary
        for unb_code, unb_amt in [("PROC-004", 1800.0), ("PROC-005", 1400.0), ("PROC-006", 1500.0)]:
            cid = self._add_claim(
                member_id=mem_primary,
                provider_id=prov_42,
                facility_id=fac_1,
                procedure_code=unb_code,
                claim_date="2026-05-17",
                claim_time="14:20:00",
                claim_amount=unb_amt,
                location="Region-A",
                supporting_activity_count=1,
                scenario_id=scen_flagship,
            )
            flagship_claims.append(cid)

        # (e) Dense circular referral loop & network cluster around PROV-0042, PROV-0043, PROV-0044
        for ref_i in range(22):
            mem_r = f"MEM-{101 + (ref_i % 6):04d}"
            self.referrals.append({
                "referral_id": self._next_referral_id(),
                "from_provider": "PROV-0042",
                "to_provider": "PROV-0043",
                "member_id": mem_r,
                "date": "2026-05-14",
            })
            self.referrals.append({
                "referral_id": self._next_referral_id(),
                "from_provider": "PROV-0043",
                "to_provider": "PROV-0044",
                "member_id": mem_r,
                "date": "2026-05-15",
            })
            self.referrals.append({
                "referral_id": self._next_referral_id(),
                "from_provider": "PROV-0044",
                "to_provider": "PROV-0042",
                "member_id": mem_r,
                "date": "2026-05-16",
            })

        self.planted_scenarios.append({
            "scenario_id": scen_flagship,
            "scenario_type": "MULTI_SIGNAL_FLAGSHIP",
            "ground_truth": True,
            "provider_id": prov_42,
            "claim_ids": flagship_claims,
            "description": (
                "Flagship CASE-1842 multi-signal scenario on PROV-0042 featuring duplicate billing, "
                "impossible cross-region timing, excessive daily utilization, abnormal claim amounts, "
                "unbundling, and circular referral network anomalies."
            ),
        })

        # Now generate 54 additional planted scenarios across the 10 categories (providers PROV-0001..PROV-0060)
        # 1. DUPLICATE_BILLING (6 scenarios: PROV-0001 to PROV-0006)
        for i in range(1, 7):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            mem = self.members[i * 5]
            cids = []
            c_date = (self.base_date + timedelta(days=90 + i)).strftime("%Y-%m-%d")
            for dup in range(3):
                cid = self._add_claim(
                    member_id=mem["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-011",
                    claim_date=c_date,
                    claim_time=f"10:{15 + dup*3:02d}:00",
                    claim_amount=18000.0,
                    location=prov["location"],
                    scenario_id=scen_id,
                )
                cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "DUPLICATE_BILLING",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"Repeated identical claims for same member, procedure, and date by {prov['provider_id']}.",
            })

        # 2. UPCODING (6 scenarios: PROV-0007 to PROV-0012)
        for i in range(7, 13):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            cids = []
            for k in range(12):
                mem = self.members[i * 10 + k]
                c_date = (self.base_date + timedelta(days=100 + k)).strftime("%Y-%m-%d")
                # Almost exclusively billing highest complexity evaluation PROC-003 at inflated rates
                cid = self._add_claim(
                    member_id=mem["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-003",
                    claim_date=c_date,
                    claim_time="11:30:00",
                    claim_amount=16500.0,  # Expected is 9500
                    location=prov["location"],
                    scenario_id=scen_id,
                )
                cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "UPCODING",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"Systematic upcoding to high-complexity evaluation PROC-003 above peer baseline by {prov['provider_id']}.",
            })

        # 3. UNBUNDLING (6 scenarios: PROV-0013 to PROV-0018)
        for i in range(13, 19):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            cids = []
            for k in range(4):
                mem = self.members[i * 8 + k]
                c_date = (self.base_date + timedelta(days=110 + k)).strftime("%Y-%m-%d")
                for code, amt in [("PROC-004", 1800.0), ("PROC-005", 1400.0), ("PROC-006", 1500.0)]:
                    cid = self._add_claim(
                        member_id=mem["member_id"],
                        provider_id=prov["provider_id"],
                        facility_id=prov["facility_id"],
                        procedure_code=code,
                        claim_date=c_date,
                        claim_time="13:15:00",
                        claim_amount=amt,
                        location=prov["location"],
                        scenario_id=scen_id,
                    )
                    cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "UNBUNDLING",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"Fragmented billing of bundled diagnostic components (PROC-004/005/006) on same date by {prov['provider_id']}.",
            })

        # 4. PHANTOM_SERVICE (6 scenarios: PROV-0019 to PROV-0024)
        for i in range(19, 25):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            cids = []
            for k in range(6):
                mem = self.members[i * 7 + k]
                c_date = (self.base_date + timedelta(days=115 + k)).strftime("%Y-%m-%d")
                cid = self._add_claim(
                    member_id=mem["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-012",
                    claim_date=c_date,
                    claim_time="15:00:00",
                    claim_amount=64000.0,
                    location=prov["location"],
                    supporting_activity_count=0,  # Zero supporting diagnostic/intake activity
                    scenario_id=scen_id,
                )
                cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "PHANTOM_SERVICE",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"High-cost procedures billed with zero supporting clinical/facility intake records by {prov['provider_id']}.",
            })

        # 5. EXCESSIVE_UTILIZATION (5 scenarios: PROV-0025 to PROV-0029)
        for i in range(25, 30):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            cids = []
            c_date = (self.base_date + timedelta(days=120 + (i - 25))).strftime("%Y-%m-%d")
            for k in range(24):
                mem = self.members[(i * 12 + k) % len(self.members)]
                cid = self._add_claim(
                    member_id=mem["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-009",
                    claim_date=c_date,
                    claim_time=f"{8 + (k // 3):02d}:{(k % 3) * 15:02d}:00",
                    claim_amount=2200.0,
                    location=prov["location"],
                    scenario_id=scen_id,
                )
                cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "EXCESSIVE_UTILIZATION",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"Extreme single-day claim volume (24 claims/day) exceeding peer utilization thresholds by {prov['provider_id']}.",
            })

        # 6. IMPOSSIBLE_TIMING (5 scenarios: PROV-0030 to PROV-0034)
        for i in range(30, 35):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            c_date = (self.base_date + timedelta(days=125 + (i - 30))).strftime("%Y-%m-%d")
            mem1 = self.members[i * 6]
            mem2 = self.members[i * 6 + 1]
            c1 = self._add_claim(
                member_id=mem1["member_id"],
                provider_id=prov["provider_id"],
                facility_id="FAC-0001",
                procedure_code="PROC-011",
                claim_date=c_date,
                claim_time="10:00:00",
                claim_amount=18000.0,
                location="Region-A",
                scenario_id=scen_id,
            )
            c2 = self._add_claim(
                member_id=mem2["member_id"],
                provider_id=prov["provider_id"],
                facility_id="FAC-0004",
                procedure_code="PROC-011",
                claim_date=c_date,
                claim_time="10:09:00",
                claim_amount=18000.0,
                location="Region-D",
                scenario_id=scen_id,
            )
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "IMPOSSIBLE_TIMING",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": [c1, c2],
                "description": f"Provider {prov['provider_id']} billed procedures in distant Region-A and Region-D within 9 minutes.",
            })

        # 7. ABNORMAL_BILLING (5 scenarios: PROV-0035 to PROV-0039)
        for i in range(35, 40):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            cids = []
            for k in range(5):
                mem = self.members[i * 5 + k]
                c_date = (self.base_date + timedelta(days=130 + k)).strftime("%Y-%m-%d")
                cid = self._add_claim(
                    member_id=mem["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-012",
                    claim_date=c_date,
                    claim_time="14:00:00",
                    claim_amount=165000.0,  # Expected is 64,000 (>2.5x expected)
                    location=prov["location"],
                    scenario_id=scen_id,
                )
                cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "ABNORMAL_BILLING",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"Claim amounts >2.5x above expected procedure cost distribution by {prov['provider_id']}.",
            })

        # 8. REFERRAL_ANOMALY (5 scenarios: PROV-0040, PROV-0041, PROV-0045, PROV-0046, PROV-0047)
        ref_provs = [40, 41, 45, 46, 47]
        for idx, p_num in enumerate(ref_provs):
            scen_id = self._next_scenario_id()
            prov = self.providers[p_num - 1]
            partner = self.providers[p_num]
            cids = []
            for k in range(14):
                mem = self.members[(p_num * 9 + k) % len(self.members)]
                c_date = (self.base_date + timedelta(days=132 + (k % 5))).strftime("%Y-%m-%d")
                self.referrals.append({
                    "referral_id": self._next_referral_id(),
                    "from_provider": prov["provider_id"],
                    "to_provider": partner["provider_id"],
                    "member_id": mem["member_id"],
                    "date": c_date,
                })
                self.referrals.append({
                    "referral_id": self._next_referral_id(),
                    "from_provider": partner["provider_id"],
                    "to_provider": prov["provider_id"],
                    "member_id": mem["member_id"],
                    "date": c_date,
                })
                cid = self._add_claim(
                    member_id=mem["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-015",
                    claim_date=c_date,
                    claim_time="12:00:00",
                    claim_amount=8500.0,
                    location=prov["location"],
                    scenario_id=scen_id,
                )
                cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "REFERRAL_ANOMALY",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"Concentrated bi-directional referral loop between {prov['provider_id']} and {partner['provider_id']}.",
            })

        # 9. NETWORK_ANOMALY (5 scenarios: PROV-0048 to PROV-0052)
        for i in range(48, 53):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            shared_members = [self.members[i * 4 + m]["member_id"] for m in range(4)]
            cids = []
            for m_id in shared_members:
                for f_idx in range(3):
                    fac_id = f"FAC-{(i + f_idx):04d}"
                    c_date = (self.base_date + timedelta(days=138 + f_idx)).strftime("%Y-%m-%d")
                    cid = self._add_claim(
                        member_id=m_id,
                        provider_id=prov["provider_id"],
                        facility_id=fac_id,
                        procedure_code="PROC-013",
                        claim_date=c_date,
                        claim_time="16:00:00",
                        claim_amount=14500.0,
                        location=prov["location"],
                        scenario_id=scen_id,
                    )
                    cids.append(cid)
                    self.referrals.append({
                        "referral_id": self._next_referral_id(),
                        "from_provider": prov["provider_id"],
                        "to_provider": f"PROV-{i+1:04d}",
                        "member_id": m_id,
                        "date": c_date,
                    })
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "NETWORK_ANOMALY",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"High-density closed clique of shared members, facilities, and referrals centered on {prov['provider_id']}.",
            })

        # 10. TEMPORAL_BILLING_SPIKE (5 scenarios: PROV-0053 to PROV-0057)
        for i in range(53, 58):
            scen_id = self._next_scenario_id()
            prov = self.providers[i - 1]
            cids = []
            # Baseline: 3 low-cost claims across Jan-Mar
            for b in range(3):
                b_date = (self.base_date + timedelta(days=15 * (b + 1))).strftime("%Y-%m-%d")
                self._add_claim(
                    member_id=self.members[i * 3 + b]["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-001",
                    claim_date=b_date,
                    claim_time="09:00:00",
                    claim_amount=1200.0,
                    location=prov["location"],
                    scenario_id=scen_id,
                )
            # Sudden spike in late May: 18 high-value claims within 2 days
            for s in range(18):
                s_date = (self.base_date + timedelta(days=142 + (s % 2))).strftime("%Y-%m-%d")
                mem = self.members[(i * 7 + s) % len(self.members)]
                cid = self._add_claim(
                    member_id=mem["member_id"],
                    provider_id=prov["provider_id"],
                    facility_id=prov["facility_id"],
                    procedure_code="PROC-016",
                    claim_date=s_date,
                    claim_time=f"{9 + (s // 2):02d}:{(s % 2)*30:02d}:00",
                    claim_amount=36000.0,
                    location=prov["location"],
                    scenario_id=scen_id,
                )
                cids.append(cid)
            self.planted_scenarios.append({
                "scenario_id": scen_id,
                "scenario_type": "TEMPORAL_BILLING_SPIKE",
                "ground_truth": True,
                "provider_id": prov["provider_id"],
                "claim_ids": cids,
                "description": f"Sudden 600%+ temporal surge in billing volume and claim value over 48h by {prov['provider_id']}.",
            })

    def _generate_normal_claims(self, target_total_claims: int = 10000) -> None:
        """
        Generates normal legitimate claims across providers PROV-0060..PROV-0500
        until total claims equal target_total_claims (10,000).
        Ensures normal claims do not accidentally create duplicate billing or impossible timing.
        """
        normal_providers = self.providers[59:]  # PROV-0060 to PROV-0500
        normal_procedures = [
            p for p in self.procedures
            if p["procedure_code"] not in ("PROC-003", "PROC-005", "PROC-006", "PROC-012", "PROC-014", "PROC-016")
        ]

        remaining = target_total_claims - len(self.claims)
        used_keys = set()

        for idx in range(remaining):
            prov = normal_providers[idx % len(normal_providers)]
            mem = self.members[(idx * 7 + 13) % len(self.members)]
            proc = normal_procedures[idx % len(normal_procedures)]

            day_offset = (idx * 3 + (idx // len(normal_providers))) % 165
            c_date = (self.base_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            key = (mem["member_id"], prov["provider_id"], proc["procedure_code"], c_date)
            while key in used_keys:
                day_offset = (day_offset + 1) % 165
                c_date = (self.base_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
                key = (mem["member_id"], prov["provider_id"], proc["procedure_code"], c_date)
            used_keys.add(key)

            hour = 9 + (idx % 8)
            minute = (idx * 7) % 60
            # Expected cost with small legitimate variance (+/- 8%)
            jitter = self.rng.uniform(0.92, 1.08)
            amount = round(proc["expected_cost"] * jitter, 2)

            self._add_claim(
                member_id=mem["member_id"],
                provider_id=prov["provider_id"],
                facility_id=prov["facility_id"],
                procedure_code=proc["procedure_code"],
                claim_date=c_date,
                claim_time=f"{hour:02d}:{minute:02d}:00",
                claim_amount=amount,
                location=prov["location"],
                supporting_activity_count=self.rng.randint(1, 4),
                scenario_id=None,
            )


def generate_and_save_dataset(output_path: str = None) -> Dict[str, Any]:
    if output_path is None:
        output_path = os.path.join(os.path.dirname(__file__), "synthetic_dataset.json")
    gen = SyntheticDataGenerator(seed=RANDOM_SEED)
    dataset = gen.generate_all()
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    return dataset


def load_or_generate_dataset(dataset_path: str = None) -> Dict[str, Any]:
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "synthetic_dataset.json")
    if os.path.exists(dataset_path):
        with open(dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return generate_and_save_dataset(dataset_path)


if __name__ == "__main__":
    data = generate_and_save_dataset()
    print(
        f"Generated synthetic dataset (SEED={data['seed']}): "
        f"{len(data['claims'])} claims, {len(data['providers'])} providers, "
        f"{len(data['members'])} members, {len(data['facilities'])} facilities, "
        f"{len(data['referrals'])} referrals, {len(data['planted_scenarios'])} planted scenarios."
    )

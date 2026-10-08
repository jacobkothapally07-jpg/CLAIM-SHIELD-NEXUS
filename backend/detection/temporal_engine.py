from collections import defaultdict
from datetime import datetime
from typing import Dict, Any, List


def run_temporal_analysis(dataset: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes claim spikes, repeated short intervals, impossible sequences,
    unusual billing acceleration, suspicious temporal clusters, and impossible travel.
    Returns temporal risk scores (0–100) per provider.
    """
    claims = dataset["claims"]
    providers = dataset["providers"]

    prov_claims = defaultdict(list)
    for c in claims:
        prov_claims[c["provider_id"]].append(c)

    temporal_scores: Dict[str, float] = {}
    temporal_details: Dict[str, Dict[str, Any]] = {}

    for p in providers:
        pid = p["provider_id"]
        clms = sorted(prov_claims.get(pid, []), key=lambda x: x["claim_timestamp"])
        if not clms:
            temporal_scores[pid] = 0.0
            temporal_details[pid] = {"score": 0.0}
            continue

        # 1. Short interval bursts (< 15 minutes apart on same day)
        short_intervals = 0
        impossible_travel = 0
        for i in range(len(clms) - 1):
            t1 = datetime.fromisoformat(clms[i]["claim_timestamp"])
            t2 = datetime.fromisoformat(clms[i + 1]["claim_timestamp"])
            mins = abs((t2 - t1).total_seconds()) / 60.0
            if mins <= 15.0:
                short_intervals += 1
            if clms[i]["claim_date"] == clms[i + 1]["claim_date"] and clms[i]["location"] != clms[i + 1]["location"] and mins <= 30.0:
                impossible_travel += 1

        # 2. Daily concentration / cluster spike
        daily_counts = defaultdict(int)
        monthly_billing = defaultdict(float)
        for c in clms:
            daily_counts[c["claim_date"]] += 1
            monthly_billing[c["claim_date"][:7]] += c["claim_amount"]

        max_daily = max(daily_counts.values())
        m_vals = list(monthly_billing.values())
        if len(m_vals) >= 2:
            peak_m = max(m_vals)
            rest_avg = (sum(m_vals) - peak_m) / max(1, len(m_vals) - 1)
            billing_accel = peak_m / max(500.0, rest_avg)
        else:
            billing_accel = 1.0

        score = (
            min(35.0, short_intervals * 4.5)
            + min(35.0, impossible_travel * 20.0)
            + min(20.0, max(0, max_daily - 3) * 1.5)
            + min(25.0, max(0.0, billing_accel - 1.5) * 4.0)
        )
        temporal_scores[pid] = round(min(100.0, score), 1)
        temporal_details[pid] = {
            "temporal_risk_score": temporal_scores[pid],
            "short_interval_count": short_intervals,
            "impossible_travel_events": impossible_travel,
            "peak_daily_claims": max_daily,
            "billing_acceleration_ratio": round(billing_accel, 2),
        }

    return {
        "provider_temporal_scores": temporal_scores,
        "provider_temporal_details": temporal_details,
    }

from collections import defaultdict
from datetime import datetime
from typing import Dict, Any, List

FEATURE_NAMES = [
    "claims_per_day",
    "average_claim_amount",
    "maximum_claim_amount",
    "unique_members",
    "unique_procedures",
    "high_value_claim_ratio",
    "duplicate_ratio",
    "claim_growth",
    "average_time_between_claims",
    "procedure_frequency",
]


def extract_provider_features(dataset: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
    claims = dataset["claims"]
    providers = dataset["providers"]
    proc_map = {p["procedure_code"]: p["expected_cost"] for p in dataset["procedures"]}

    prov_claims = defaultdict(list)
    for c in claims:
        prov_claims[c["provider_id"]].append(c)

    features_by_provider: Dict[str, Dict[str, float]] = {}

    for p in providers:
        pid = p["provider_id"]
        clms = prov_claims.get(pid, [])
        if not clms:
            features_by_provider[pid] = {f: 0.0 for f in FEATURE_NAMES}
            continue

        total_claims = len(clms)
        amounts = [c["claim_amount"] for c in clms]
        avg_amt = sum(amounts) / total_claims
        max_amt = max(amounts)

        daily_counts = defaultdict(int)
        dup_keys = defaultdict(int)
        proc_counts = defaultdict(int)
        monthly_counts = defaultdict(int)
        high_val_cnt = 0

        for c in clms:
            daily_counts[c["claim_date"]] += 1
            dup_keys[(c["member_id"], c["procedure_code"], c["claim_date"])] += 1
            proc_counts[c["procedure_code"]] += 1
            monthly_counts[c["claim_date"][:7]] += 1
            exp = proc_map.get(c["procedure_code"], 1000.0)
            if c["claim_amount"] > exp * 1.3 or c["claim_amount"] >= 20000.0:
                high_val_cnt += 1

        max_claims_per_day = float(max(daily_counts.values()))
        unique_mems = float(len({c["member_id"] for c in clms}))
        unique_procs = float(len(proc_counts))
        high_val_ratio = high_val_cnt / total_claims

        dup_claim_cnt = sum(cnt for cnt in dup_keys.values() if cnt > 1)
        dup_ratio = dup_claim_cnt / total_claims

        # Claim growth: ratio of peak month to average of other months
        if len(monthly_counts) >= 2:
            m_vals = list(monthly_counts.values())
            peak_m = max(m_vals)
            rest_avg = (sum(m_vals) - peak_m) / max(1, len(m_vals) - 1)
            claim_growth = peak_m / max(1.0, rest_avg)
        else:
            claim_growth = 1.0

        # Average time between claims (in hours, inverted so rapid sequences have smaller values)
        sorted_ts = sorted(datetime.fromisoformat(c["claim_timestamp"]) for c in clms)
        if len(sorted_ts) >= 2:
            diffs_hours = [
                max(0.05, (sorted_ts[i + 1] - sorted_ts[i]).total_seconds() / 3600.0)
                for i in range(len(sorted_ts) - 1)
            ]
            avg_time_between = sum(diffs_hours) / len(diffs_hours)
        else:
            avg_time_between = 168.0

        # Procedure frequency concentration (dominant procedure share * total count)
        top_proc_cnt = max(proc_counts.values())
        proc_freq = float(top_proc_cnt)

        features_by_provider[pid] = {
            "claims_per_day": round(max_claims_per_day, 3),
            "average_claim_amount": round(avg_amt, 2),
            "maximum_claim_amount": round(max_amt, 2),
            "unique_members": round(unique_mems, 1),
            "unique_procedures": round(unique_procs, 1),
            "high_value_claim_ratio": round(high_val_ratio, 4),
            "duplicate_ratio": round(dup_ratio, 4),
            "claim_growth": round(claim_growth, 3),
            "average_time_between_claims": round(avg_time_between, 3),
            "procedure_frequency": round(proc_freq, 2),
        }

    return features_by_provider

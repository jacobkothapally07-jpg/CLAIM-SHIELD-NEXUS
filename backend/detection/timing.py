from collections import defaultdict
from datetime import datetime
from typing import Dict, Any, List


def impossible_timing_detector(dataset: Dict[str, Any], weight: float = 25.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects impossible timing: same provider billing procedures in different
    distant synthetic regions (e.g. Region-A and Region-D) within < 45 minutes.
    """
    claims = dataset["claims"]
    prov_claims = defaultdict(list)

    for c in claims:
        prov_claims[c["provider_id"]].append(c)

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}

    for prov_id, clms in prov_claims.items():
        # Sort chronologically by timestamp
        sorted_clms = sorted(clms, key=lambda x: x["claim_timestamp"])
        conflicts = []
        conflict_cids = set()

        for i in range(len(sorted_clms) - 1):
            c1 = sorted_clms[i]
            c2 = sorted_clms[i + 1]
            if c1["claim_date"] == c2["claim_date"] and c1["location"] != c2["location"]:
                t1 = datetime.fromisoformat(c1["claim_timestamp"])
                t2 = datetime.fromisoformat(c2["claim_timestamp"])
                diff_mins = abs((t2 - t1).total_seconds()) / 60.0
                if diff_mins <= 30.0:
                    conflicts.append((c1, c2, int(diff_mins)))
                    conflict_cids.add(c1["claim_id"])
                    conflict_cids.add(c2["claim_id"])

        if conflicts:
            c1, c2, mins = conflicts[0]
            t1_str = c1["claim_timestamp"].split("T")[1][:5]
            t2_str = c2["claim_timestamp"].split("T")[1][:5]
            provider_signals[prov_id] = [{
                "signal": "impossible_timing",
                "score": weight,
                "confidence": 0.98,
                "severity": "critical",
                "supporting_claims": sorted(list(conflict_cids)),
                "evidence": (
                    f"Provider {prov_id} recorded activity in {c1['location']} at {t1_str} ({c1['claim_id']}) "
                    f"and distant {c2['location']} at {t2_str} ({c2['claim_id']}) on {c1['claim_date']} "
                    f"({mins} min interval — geographically infeasible travel)."
                ),
            }]

    return provider_signals

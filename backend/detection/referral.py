from collections import defaultdict
from typing import Dict, Any, List


def referral_detector(dataset: Dict[str, Any], weight: float = 10.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects referral anomalies: unusually concentrated, repeated, or circular
    referral relationships between synthetic providers.
    """
    referrals = dataset["referrals"]
    claims = dataset["claims"]

    pair_counts = defaultdict(int)
    outgoing_counts = defaultdict(int)
    for r in referrals:
        pair_counts[(r["from_provider"], r["to_provider"])] += 1
        outgoing_counts[r["from_provider"]] += 1

    prov_claims = defaultdict(list)
    for c in claims:
        prov_claims[c["provider_id"]].append(c["claim_id"])

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}
    for (p_from, p_to), count in pair_counts.items():
        rev_count = pair_counts.get((p_to, p_from), 0)
        # Concentrated or reciprocal loop
        if count >= 10:
            cids = prov_claims.get(p_from, [])[:10]
            provider_signals[p_from] = [{
                "signal": "referral_anomaly",
                "score": weight,
                "confidence": 0.90,
                "severity": "medium" if count < 18 else "high",
                "supporting_claims": cids,
                "evidence": (
                    f"Concentrated referral pattern detected: {p_from} directed {count} referrals to {p_to} "
                    f"(with {rev_count} reciprocal/circular referrals back into the same provider cluster)."
                ),
            }]

    return provider_signals

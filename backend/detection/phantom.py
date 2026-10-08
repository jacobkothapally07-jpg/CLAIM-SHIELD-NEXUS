from collections import defaultdict
from typing import Dict, Any, List


def phantom_service_detector(dataset: Dict[str, Any], weight: float = 18.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects phantom services: high-cost procedures billed where surrounding synthetic
    clinical/intake activity count is 0.
    """
    claims = dataset["claims"]
    prov_phantom = defaultdict(list)

    for c in claims:
        if c.get("supporting_activity_count", 1) == 0 and c["claim_amount"] >= 10000.0:
            prov_phantom[c["provider_id"]].append(c)

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}
    for prov_id, clms in prov_phantom.items():
        if len(clms) >= 3:
            cids = [x["claim_id"] for x in clms]
            total_val = sum(x["claim_amount"] for x in clms)
            provider_signals[prov_id] = [{
                "signal": "phantom_service",
                "score": weight,
                "confidence": 0.89,
                "severity": "high",
                "supporting_claims": cids,
                "evidence": (
                    f"Detected {len(clms)} high-value claims (totaling ₹{total_val:,.0f}) for {prov_id} "
                    f"with zero supporting synthetic intake, referral, or diagnostic activity records."
                ),
            }]
    return provider_signals

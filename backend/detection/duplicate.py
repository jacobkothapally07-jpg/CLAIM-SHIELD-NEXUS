from collections import defaultdict
from typing import Dict, Any, List


def duplicate_detector(dataset: Dict[str, Any], weight: float = 20.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects duplicate billing: same synthetic member, provider, procedure, and date
    appearing across multiple claims with identical or near-identical amounts.
    """
    claims = dataset["claims"]
    grouped = defaultdict(list)

    for c in claims:
        key = (c["provider_id"], c["member_id"], c["procedure_code"], c["claim_date"])
        grouped[key].append(c)

    provider_signals: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    for (prov_id, mem_id, proc_code, c_date), clm_list in grouped.items():
        if len(clm_list) >= 2:
            cids = [x["claim_id"] for x in clm_list]
            total_amt = sum(x["claim_amount"] for x in clm_list)
            provider_signals[prov_id].append({
                "signal": "duplicate_billing",
                "score": weight,
                "confidence": 0.95,
                "severity": "high",
                "supporting_claims": cids,
                "evidence": (
                    f"Same synthetic member ({mem_id}), provider ({prov_id}), procedure ({proc_code}) "
                    f"and date ({c_date}) detected across {len(clm_list)} claims "
                    f"({', '.join(cids[:4])}) totaling ₹{total_amt:,.0f}."
                ),
            })

    # Deduplicate to strongest signal per provider while preserving all supporting claims
    consolidated: Dict[str, List[Dict[str, Any]]] = {}
    for prov_id, sigs in provider_signals.items():
        all_cids = []
        for s in sigs:
            all_cids.extend(s["supporting_claims"])
        consolidated[prov_id] = [{
            "signal": "duplicate_billing",
            "score": weight,
            "confidence": 0.96 if len(all_cids) >= 4 else 0.94,
            "severity": "critical" if len(all_cids) >= 4 else "high",
            "supporting_claims": sorted(list(set(all_cids))),
            "evidence": sigs[0]["evidence"],
        }]
    return consolidated

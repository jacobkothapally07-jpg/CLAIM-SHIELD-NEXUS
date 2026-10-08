from collections import defaultdict
from typing import Dict, Any, List


def unbundling_detector(dataset: Dict[str, Any], weight: float = 15.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects unbundling: billing fragmented sub-procedures (PROC-004, PROC-005, PROC-006)
    for the same member on the same date instead of a single bundled panel.
    """
    claims = dataset["claims"]
    grouped = defaultdict(list)

    for c in claims:
        if c["procedure_code"] in ("PROC-004", "PROC-005", "PROC-006"):
            grouped[(c["provider_id"], c["member_id"], c["claim_date"])].append(c)

    prov_unbundled = defaultdict(list)
    for (prov_id, mem_id, c_date), clms in grouped.items():
        codes = {x["procedure_code"] for x in clms}
        if {"PROC-004", "PROC-005", "PROC-006"}.issubset(codes):
            prov_unbundled[prov_id].extend(clms)

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}
    for prov_id, clms in prov_unbundled.items():
        cids = sorted(list({x["claim_id"] for x in clms}))
        provider_signals[prov_id] = [{
            "signal": "unbundling",
            "score": weight,
            "confidence": 0.93,
            "severity": "medium",
            "supporting_claims": cids,
            "evidence": (
                f"Provider {prov_id} separately billed bundled diagnostic components "
                f"(PROC-004, PROC-005, PROC-006) on the same service date across {len(cids)} claims."
            ),
        }]
    return provider_signals

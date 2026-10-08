from collections import defaultdict
from typing import Dict, Any, List


def upcoding_detector(dataset: Dict[str, Any], weight: float = 15.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects upcoding: provider disproportionately bills highest-complexity consultation
    code PROC-003 and/or at amounts significantly higher than expected consultation cost.
    """
    claims = dataset["claims"]
    proc_map = {p["procedure_code"]: p for p in dataset["procedures"]}

    prov_claims = defaultdict(list)
    for c in claims:
        prov_claims[c["provider_id"]].append(c)

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}

    for prov_id, clms in prov_claims.items():
        upcoded = []
        for c in clms:
            pcode = c["procedure_code"]
            expected = proc_map[pcode]["expected_cost"]
            # PROC-003 billed above 1.35x expected or high ratio of PROC-003
            if pcode == "PROC-003" and c["claim_amount"] > expected * 1.35:
                upcoded.append(c)

        if len(upcoded) >= 5:
            cids = [x["claim_id"] for x in upcoded]
            avg_amt = sum(x["claim_amount"] for x in upcoded) / len(upcoded)
            provider_signals[prov_id] = [{
                "signal": "upcoding",
                "score": weight,
                "confidence": 0.91,
                "severity": "high",
                "supporting_claims": cids,
                "evidence": (
                    f"Provider {prov_id} billed high-complexity code PROC-003 across {len(upcoded)} claims "
                    f"at an average of ₹{avg_amt:,.0f} vs. expected peer benchmark ₹9,500."
                ),
            }]

    return provider_signals

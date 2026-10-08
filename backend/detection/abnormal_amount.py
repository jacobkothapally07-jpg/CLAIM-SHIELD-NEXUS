from collections import defaultdict
from typing import Dict, Any, List


def abnormal_amount_detector(dataset: Dict[str, Any], weight: float = 15.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects abnormal billing amounts: claims where billed amount exceeds >2.0x the expected
    synthetic procedure cost distribution.
    """
    claims = dataset["claims"]
    proc_map = {p["procedure_code"]: p for p in dataset["procedures"]}

    prov_outliers = defaultdict(list)
    for c in claims:
        pcode = c["procedure_code"]
        expected = proc_map[pcode]["expected_cost"]
        if c["claim_amount"] >= expected * 2.0:
            prov_outliers[c["provider_id"]].append((c, expected))

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}
    for prov_id, outliers in prov_outliers.items():
        if len(outliers) >= 2:
            cids = [x[0]["claim_id"] for x in outliers]
            max_c, max_exp = max(outliers, key=lambda x: x[0]["claim_amount"])
            ratio = max_c["claim_amount"] / max_exp
            provider_signals[prov_id] = [{
                "signal": "abnormal_billing",
                "score": weight,
                "confidence": 0.94,
                "severity": "high",
                "supporting_claims": cids,
                "evidence": (
                    f"Provider {prov_id} submitted {len(outliers)} claims with extreme billing deviation, "
                    f"peaking at ₹{max_c['claim_amount']:,.0f} ({ratio:.1f}x expected peer benchmark ₹{max_exp:,.0f})."
                ),
            }]
    return provider_signals

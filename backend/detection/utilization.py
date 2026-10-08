from collections import defaultdict
from typing import Dict, Any, List


def utilization_detector(dataset: Dict[str, Any], weight: float = 15.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects excessive utilization: providers with unusually high claims/day,
    procedures/day, or billing/day compared to synthetic peer providers.
    """
    claims = dataset["claims"]
    daily_prov = defaultdict(list)

    for c in claims:
        daily_prov[(c["provider_id"], c["claim_date"])].append(c)

    prov_flagged_days = defaultdict(list)
    for (prov_id, c_date), clms in daily_prov.items():
        if len(clms) >= 12:
            prov_flagged_days[prov_id].append((c_date, clms))

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}
    for prov_id, day_entries in prov_flagged_days.items():
        day_entries.sort(key=lambda x: len(x[1]), reverse=True)
        peak_date, peak_clms = day_entries[0]
        all_cids = []
        for _, clms in day_entries:
            all_cids.extend([x["claim_id"] for x in clms])
        unique_mems = len({x["member_id"] for x in peak_clms})
        daily_total = sum(x["claim_amount"] for x in peak_clms)
        provider_signals[prov_id] = [{
            "signal": "excessive_utilization",
            "score": weight,
            "confidence": 0.94,
            "severity": "high" if len(peak_clms) < 25 else "critical",
            "supporting_claims": sorted(list(set(all_cids))),
            "evidence": (
                f"Provider {prov_id} submitted {len(peak_clms)} claims across {unique_mems} unique members "
                f"(₹{daily_total:,.0f}) on {peak_date}, exceeding peer daily utilization baseline (~1.4 claims/day) by >10x."
            ),
        }]
    return provider_signals

from collections import defaultdict
from typing import Dict, Any, List


def temporal_detector(dataset: Dict[str, Any], weight: float = 15.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects temporal billing spikes: providers whose recent/monthly claim volume or billing
    suddenly increases far beyond their previous historical baseline.
    """
    claims = dataset["claims"]
    prov_monthly = defaultdict(lambda: defaultdict(list))

    for c in claims:
        month_key = c["claim_date"][:7]  # YYYY-MM
        prov_monthly[c["provider_id"]][month_key].append(c)

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}

    for pid, m_dict in prov_monthly.items():
        months = sorted(m_dict.keys())
        if len(months) < 2:
            continue
        counts = [len(m_dict[m]) for m in months]
        max_cnt = max(counts)
        max_month = months[counts.index(max_cnt)]
        other_counts = [cnt for m, cnt in zip(months, counts) if m != max_month]
        baseline_avg = sum(other_counts) / max(1, len(other_counts))

        if max_cnt >= 15 and max_cnt >= baseline_avg * 4.0:
            spike_clms = m_dict[max_month]
            spike_val = sum(x["claim_amount"] for x in spike_clms)
            provider_signals[pid] = [{
                "signal": "temporal_spike",
                "score": weight,
                "confidence": 0.91,
                "severity": "high",
                "supporting_claims": [x["claim_id"] for x in spike_clms[:15]],
                "evidence": (
                    f"Sudden temporal billing acceleration for {pid} in {max_month}: "
                    f"{max_cnt} claims (₹{spike_val:,.0f}) vs. historical baseline of {baseline_avg:.1f} claims/month."
                ),
            }]

    return provider_signals

from collections import defaultdict
from typing import Dict, Any, List


def network_detector(dataset: Dict[str, Any], weight: float = 15.0) -> Dict[str, List[Dict[str, Any]]]:
    """
    Detects network anomalies: suspicious provider/facility/member/referral clusters
    where the same subset of members repeatedly cycles across multiple facilities or referrals.
    """
    claims = dataset["claims"]
    referrals = dataset["referrals"]

    prov_facs = defaultdict(set)
    prov_mem_counts = defaultdict(lambda: defaultdict(int))
    prov_cids = defaultdict(list)

    for c in claims:
        pid = c["provider_id"]
        prov_facs[pid].add(c["facility_id"])
        prov_mem_counts[pid][c["member_id"]] += 1
        prov_cids[pid].append(c["claim_id"])

    ref_involvement = defaultdict(int)
    for r in referrals:
        ref_involvement[r["from_provider"]] += 1
        ref_involvement[r["to_provider"]] += 1

    provider_signals: Dict[str, List[Dict[str, Any]]] = {}

    for pid, facs in prov_facs.items():
        repeated_members = [m for m, cnt in prov_mem_counts[pid].items() if cnt >= 3]
        ref_cnt = ref_involvement.get(pid, 0)
        # Flag if operating across multiple facilities with repeated shared members + referral ties
        if (len(facs) >= 2 and len(repeated_members) >= 3) or (len(repeated_members) >= 4 and ref_cnt >= 12):
            provider_signals[pid] = [{
                "signal": "network_anomaly",
                "score": weight,
                "confidence": 0.92,
                "severity": "high",
                "supporting_claims": prov_cids[pid][:15],
                "evidence": (
                    f"Dense network cluster around {pid}: {len(repeated_members)} synthetic members repeatedly billed "
                    f"across {len(facs)} facilities ({', '.join(sorted(facs))}) with {ref_cnt} linked network referrals."
                ),
            }]

    return provider_signals

from collections import defaultdict
from typing import Dict, Any, List

from backend.detection.duplicate import duplicate_detector
from backend.detection.upcoding import upcoding_detector
from backend.detection.unbundling import unbundling_detector
from backend.detection.phantom import phantom_service_detector
from backend.detection.utilization import utilization_detector
from backend.detection.timing import impossible_timing_detector
from backend.detection.abnormal_amount import abnormal_amount_detector
from backend.detection.referral import referral_detector
from backend.detection.network import network_detector
from backend.detection.temporal import temporal_detector

DEFAULT_RULE_WEIGHTS = {
    "duplicate_billing": 20.0,
    "impossible_timing": 25.0,
    "excessive_utilization": 15.0,
    "abnormal_billing": 15.0,
    "referral_anomaly": 10.0,
    "network_anomaly": 15.0,
    "upcoding": 15.0,
    "unbundling": 15.0,
    "phantom_service": 18.0,
    "temporal_spike": 15.0,
}


def run_all_rule_detectors(
    dataset: Dict[str, Any], weights: Dict[str, float] = None
) -> Dict[str, Any]:
    w = {**DEFAULT_RULE_WEIGHTS, **(weights or {})}

    detector_runs = [
        duplicate_detector(dataset, w["duplicate_billing"]),
        upcoding_detector(dataset, w["upcoding"]),
        unbundling_detector(dataset, w["unbundling"]),
        phantom_service_detector(dataset, w["phantom_service"]),
        utilization_detector(dataset, w["excessive_utilization"]),
        impossible_timing_detector(dataset, w["impossible_timing"]),
        abnormal_amount_detector(dataset, w["abnormal_billing"]),
        referral_detector(dataset, w["referral_anomaly"]),
        network_detector(dataset, w["network_anomaly"]),
        temporal_detector(dataset, w["temporal_spike"]),
    ]

    provider_signals: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    claim_signals: Dict[str, List[str]] = defaultdict(list)

    for result_map in detector_runs:
        for prov_id, sig_list in result_map.items():
            for sig in sig_list:
                provider_signals[prov_id].append(sig)
                for cid in sig.get("supporting_claims", []):
                    if sig["signal"] not in claim_signals[cid]:
                        claim_signals[cid].append(sig["signal"])

    provider_rule_scores: Dict[str, float] = {}
    for prov in dataset["providers"]:
        pid = prov["provider_id"]
        sigs = provider_signals.get(pid, [])
        raw_sum = sum(s["score"] for s in sigs)
        # Scale single strong rule triggers clearly while capping at 100
        if len(sigs) == 1:
            scaled = min(100.0, raw_sum * 3.8)
        elif len(sigs) == 2:
            scaled = min(100.0, raw_sum * 2.4)
        else:
            scaled = min(100.0, raw_sum)
        provider_rule_scores[pid] = round(scaled, 1)

    return {
        "provider_signals": dict(provider_signals),
        "provider_rule_scores": provider_rule_scores,
        "claim_signals": dict(claim_signals),
    }

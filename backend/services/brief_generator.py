"""
AI Investigation Brief Generator for ClaimShield Nexus.
Strictly adheres to structured evidence from the detection engine.
Never invents evidence and never claims confirmed fraud.
"""

from typing import Dict, Any, List


def generate_investigation_brief(
    case: Dict[str, Any],
    evidence_list: List[Dict[str, Any]],
    forecast: Dict[str, Any],
    graph_data: Dict[str, Any],
) -> Dict[str, Any]:
    if not case:
        return {
            "summary": "Insufficient evidence in available synthetic data.",
            "sections": {},
        }

    case_id = case["case_id"]
    prov_id = case["provider_id"]
    prov_name = case["provider_name"]
    risk_score = case["risk_score"]
    risk_level = case["risk_level"]
    exposure = case["potential_exposure"]
    total_claimed = case["total_claimed_amount"]
    susp_count = case["suspicious_claim_count"]
    signals = case.get("primary_signals", [])

    if not evidence_list:
        return {
            "case_id": case_id,
            "headline": "Insufficient evidence in available synthetic data.",
            "why_flagged": "Insufficient evidence in available synthetic data.",
            "supporting_evidence": [],
            "suspicious_relationships": "Insufficient evidence in available synthetic data.",
            "financial_impact": f"₹{exposure:,.0f} synthetic potential exposure",
            "limitations": "These signals do not establish fraud and require human SIU investigator validation.",
            "recommended_actions": ["Human SIU review"],
        }

    signal_labels = [s.replace("_", " ") for s in signals]
    why_flagged = (
        f"Case {case_id} ({prov_id} — {prov_name}) was prioritized with a composite risk score of "
        f"{risk_score}/100 ({risk_level} risk) because {len(signals)} independent FWA risk signals "
        f"were detected across {susp_count} synthetic claims: {', '.join(signal_labels)}."
    )

    supporting_points = [
        f"[{ev['signal_type'].upper()} | +{ev['score_contribution']} pts | {int(ev['confidence']*100)}% conf]: {ev['explanation']}"
        for ev in evidence_list
    ]

    suspicious_edges = [e for e in graph_data.get("edges", []) if e.get("suspicious")]
    fac_nodes = [n["label"] for n in graph_data.get("nodes", []) if n.get("type") == "Facility"]
    ref_nodes = [n["label"] for n in graph_data.get("nodes", []) if n.get("type") == "ReferralProvider"]

    if ref_nodes or len(fac_nodes) > 1:
        rel_summary = (
            f"Graph topology reveals {len(suspicious_edges)} high-risk relationship edges linking {prov_id} "
            f"across facilities ({', '.join(fac_nodes[:3]) or 'Insufficient evidence in available synthetic data'}) "
            f"and referral partners ({', '.join(ref_nodes[:3]) or 'no external referral partners flagged in synthetic data'})."
        )
    else:
        rel_summary = (
            f"Activity is concentrated within {case['facility_id']} ({case['location']}) with "
            f"{len(suspicious_edges)} flagged claim-submission links."
        )

    fin_impact = (
        f"Across {susp_count} suspicious synthetic claims totaling ₹{total_claimed:,.0f}, the estimated "
        f"synthetic potential exposure is ₹{exposure:,.0f}. Future synthetic risk forecast projects "
        f"{forecast.get('forecast_30_day', 0)}% (30d), {forecast.get('forecast_60_day', 0)}% (60d), and "
        f"{forecast.get('forecast_90_day', 0)}% (90d) sustained risk probability if unaddressed."
    )

    limitations = (
        "IMPORTANT LIMITATION: All findings are derived from synthetic demonstration data and statistical/rule "
        "correlations. These signals indicate potential FWA patterns only — they do not establish or confirm fraud "
        "and require human SIU investigator validation, medical record audit, and provider outreach."
    )

    recommended_review = [
        f"Audit clinical documentation and encounter timestamps for primary claim {case['primary_claim_id']} and {susp_count} associated claims.",
        f"Verify time-of-service logs for {prov_id} across {case['location']} facilities to reconcile any overlapping or cross-region submissions.",
        "Inspect itemized procedure coding against peer specialty benchmarks to evaluate potential upcoding or unbundled component billing.",
        "Review referral authorization logs for circular or concentrated patient routing patterns.",
    ]

    formatted_text = (
        f"INVESTIGATION SUMMARY — {case_id}\n\n"
        f"Why This Case Was Flagged:\n{why_flagged}\n\n"
        f"Strongest Correlated Signals:\n"
        + "\n".join(f"• {pt}" for pt in supporting_points)
        + f"\n\nSuspicious Relationships:\n{rel_summary}\n\n"
        f"Potential Financial Impact:\n{fin_impact}\n\n"
        f"Recommended SIU Investigator Actions:\n"
        + "\n".join(f"• {act}" for act in recommended_review)
        + f"\n\nImportant Limitation:\n{limitations}"
    )

    return {
        "case_id": case_id,
        "provider_id": prov_id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "why_flagged": why_flagged,
        "supporting_evidence": supporting_points,
        "suspicious_relationships": rel_summary,
        "financial_impact": fin_impact,
        "limitations": limitations,
        "recommended_actions": recommended_review,
        "formatted_brief": formatted_text,
        "generated_at": "2026-05-18T10:00:00Z",
    }

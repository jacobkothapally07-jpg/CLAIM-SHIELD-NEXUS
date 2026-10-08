from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.services.risk_engine import ClaimShieldEngine
from backend.services.brief_generator import generate_investigation_brief

router = APIRouter(prefix="/api")

# Singleton engine instance initialized from deterministic synthetic dataset
ENGINE = ClaimShieldEngine()


class StatusUpdatePayload(BaseModel):
    status: str
    investigator: Optional[str] = "SIU Investigator"


class NoteCreatePayload(BaseModel):
    investigator: str = "SIU Investigator"
    note: str


class BriefRequestPayload(BaseModel):
    case_id: str


@router.get("/dashboard/summary")
def get_dashboard_summary():
    total_claims = len(ENGINE.enriched_claims)
    suspicious_alerts = sum(1 for c in ENGINE.enriched_claims if len(c["signals"]) > 0)
    cases = list(ENGINE.cases_by_id.values())
    high_risk_cases = sum(1 for c in cases if c["risk_level"] == "HIGH")
    critical_cases = sum(1 for c in cases if c["risk_level"] == "CRITICAL")
    total_exposure = round(sum(c["potential_exposure"] for c in cases), 2)

    # Claims & temporal risk trend by month
    monthly = defaultdict(lambda: {"month": "", "claims": 0, "alerts": 0, "amount": 0.0, "avg_risk": 0.0})
    for c in ENGINE.enriched_claims:
        ym = c["claim_date"][:7]
        monthly[ym]["month"] = ym
        monthly[ym]["claims"] += 1
        if c["signals"]:
            monthly[ym]["alerts"] += 1
        monthly[ym]["amount"] = round(monthly[ym]["amount"] + c["claim_amount"], 2)
        monthly[ym]["avg_risk"] += c["risk_score"]

    claims_trend = []
    for ym in sorted(monthly.keys()):
        item = monthly[ym]
        item["avg_risk"] = round(item["avg_risk"] / max(1, item["claims"]), 1)
        claims_trend.append(item)

    # Signal distribution across cases
    sig_counts = defaultdict(int)
    for c in cases:
        for s in c["primary_signals"]:
            sig_counts[s] += 1
    signal_distribution = [
        {"signal": k.replace("_", " ").title(), "signal_key": k, "count": v}
        for k, v in sorted(sig_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Exposure by risk category
    exp_by_cat = {"LOW": 0.0, "MEDIUM": 0.0, "HIGH": 0.0, "CRITICAL": 0.0}
    for c in cases:
        exp_by_cat[c["risk_level"]] = round(exp_by_cat[c["risk_level"]] + c["potential_exposure"], 2)
    exposure_by_category = [
        {"category": k, "exposure": v} for k, v in exp_by_cat.items()
    ]

    return {
        "environment_badge": "SYNTHETIC DATA • DEMONSTRATION ENVIRONMENT",
        "metrics": {
            "claims_analyzed": total_claims,
            "suspicious_alerts": suspicious_alerts,
            "high_risk_cases": high_risk_cases,
            "critical_cases": critical_cases,
            "potential_exposure": total_exposure,
            "total_cases": len(cases),
        },
        "claims_trend": claims_trend,
        "signal_distribution": signal_distribution,
        "exposure_by_category": exposure_by_category,
        "priority_queue": sorted(cases, key=lambda x: x["risk_score"], reverse=True)[:12],
    }


@router.get("/risk-distribution")
def get_risk_distribution():
    buckets = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for p in ENGINE.provider_profiles.values():
        buckets[p["risk_level"]] += 1

    case_buckets = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for c in ENGINE.cases_by_id.values():
        case_buckets[c["risk_level"]] += 1

    return {
        "provider_distribution": [
            {"level": "LOW", "range": "0–30", "count": buckets["LOW"]},
            {"level": "MEDIUM", "range": "31–60", "count": buckets["MEDIUM"]},
            {"level": "HIGH", "range": "61–80", "count": buckets["HIGH"]},
            {"level": "CRITICAL", "range": "81–100", "count": buckets["CRITICAL"]},
        ],
        "case_distribution": [
            {"level": "LOW", "range": "0–30", "count": case_buckets["LOW"]},
            {"level": "MEDIUM", "range": "31–60", "count": case_buckets["MEDIUM"]},
            {"level": "HIGH", "range": "61–80", "count": case_buckets["HIGH"]},
            {"level": "CRITICAL", "range": "81–100", "count": case_buckets["CRITICAL"]},
        ],
    }


@router.get("/top-providers")
def get_top_providers(limit: int = Query(15, ge=1, le=100)):
    provs = sorted(
        ENGINE.provider_profiles.values(),
        key=lambda x: x["risk_score"],
        reverse=True,
    )
    return {"providers": provs[:limit]}


@router.get("/claims")
def get_claims(
    risk: Optional[str] = None,
    date: Optional[str] = None,
    provider: Optional[str] = None,
    facility: Optional[str] = None,
    signal: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    filtered = ENGINE.enriched_claims

    if risk and risk.upper() != "ALL":
        filtered = [c for c in filtered if c["risk_level"] == risk.upper()]
    if date:
        filtered = [c for c in filtered if c["claim_date"].startswith(date)]
    if provider:
        q_p = provider.upper()
        filtered = [c for c in filtered if q_p in c["provider_id"].upper() or q_p in c["provider_name"].upper()]
    if facility:
        q_f = facility.upper()
        filtered = [c for c in filtered if q_f in c["facility_id"].upper() or q_f in c["facility_name"].upper()]
    if signal and signal.lower() != "all":
        filtered = [c for c in filtered if signal.lower() in [s.lower() for s in c["signals"]]]
    if status and status.lower() != "all":
        filtered = [c for c in filtered if c["status"].lower() == status.lower()]
    if search:
        q = search.upper()
        filtered = [
            c for c in filtered
            if q in c["claim_id"].upper()
            or q in c["provider_id"].upper()
            or q in c["member_id"].upper()
            or q in c["facility_id"].upper()
            or q in c["procedure_code"].upper()
        ]

    # Sort suspicious / highest-risk claims first by default so investigators see relevant items immediately
    sorted_claims = sorted(filtered, key=lambda x: (x["risk_score"], x["claim_amount"]), reverse=True)
    total = len(sorted_claims)
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "claims": sorted_claims[offset: offset + limit],
    }


@router.get("/providers")
def get_providers(
    risk: Optional[str] = None,
    specialty: Optional[str] = None,
    region: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
):
    provs = list(ENGINE.provider_profiles.values())
    if risk and risk.upper() != "ALL":
        provs = [p for p in provs if p["risk_level"] == risk.upper()]
    if specialty and specialty.lower() != "all":
        provs = [p for p in provs if p["specialty"].lower() == specialty.lower()]
    if region and region.lower() != "all":
        provs = [p for p in provs if p["location"].lower() == region.lower()]
    if search:
        q = search.upper()
        provs = [
            p for p in provs
            if q in p["provider_id"].upper() or q in p["provider_name"].upper() or q in p["specialty"].upper()
        ]

    provs.sort(key=lambda x: x["risk_score"], reverse=True)
    return {
        "total": len(provs),
        "providers": provs[:limit],
    }


@router.get("/providers/{provider_id}")
def get_provider_detail(provider_id: str):
    prof = ENGINE.provider_profiles.get(provider_id)
    if not prof:
        raise HTTPException(status_code=404, detail=f"Provider {provider_id} not found")

    referrals = [
        r for r in ENGINE.dataset["referrals"]
        if r["from_provider"] == provider_id or r["to_provider"] == provider_id
    ]
    related_cases = [
        c for c in ENGINE.cases_by_id.values() if c["provider_id"] == provider_id
    ]
    recent_claims = [
        c for c in ENGINE.enriched_claims if c["provider_id"] == provider_id
    ][:25]

    return {
        "provider": prof,
        "referrals": referrals[:30],
        "cases": related_cases,
        "recent_claims": recent_claims,
    }


@router.get("/cases")
def get_cases(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    signal: Optional[str] = None,
    search: Optional[str] = None,
):
    cases = list(ENGINE.cases_by_id.values())
    if status and status.lower() != "all":
        cases = [c for c in cases if c["status"].lower() == status.lower()]
    if risk_level and risk_level.upper() != "ALL":
        cases = [c for c in cases if c["risk_level"] == risk_level.upper()]
    if signal and signal.lower() != "all":
        cases = [c for c in cases if signal.lower() in [s.lower() for s in c["primary_signals"]]]
    if search:
        q = search.upper()
        cases = [
            c for c in cases
            if q in c["case_id"].upper()
            or q in c["provider_id"].upper()
            or q in c["provider_name"].upper()
            or q in c["facility_id"].upper()
        ]

    cases.sort(key=lambda x: (x["risk_score"], x["potential_exposure"]), reverse=True)
    return {
        "total": len(cases),
        "cases": cases,
    }


@router.get("/cases/{case_id}")
def get_case_detail(case_id: str):
    case = ENGINE.cases_by_id.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    return {
        "case": case,
        "evidence": ENGINE.case_evidence.get(case_id, []),
        "notes": ENGINE.case_notes.get(case_id, []),
        "forecast": ENGINE.get_case_forecast(case_id),
    }


@router.get("/cases/{case_id}/evidence")
def get_case_evidence(case_id: str):
    if case_id not in ENGINE.cases_by_id:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return {
        "case_id": case_id,
        "risk_score": ENGINE.cases_by_id[case_id]["risk_score"],
        "evidence": ENGINE.case_evidence.get(case_id, []),
    }


@router.get("/cases/{case_id}/timeline")
def get_case_timeline(case_id: str):
    if case_id not in ENGINE.cases_by_id:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return {
        "case_id": case_id,
        "timeline": ENGINE.get_case_timeline(case_id),
    }


@router.get("/cases/{case_id}/graph")
def get_case_graph(case_id: str):
    if case_id not in ENGINE.cases_by_id:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return {
        "case_id": case_id,
        **ENGINE.get_case_graph(case_id),
    }


@router.get("/cases/{case_id}/forecast")
def get_case_forecast(case_id: str):
    if case_id not in ENGINE.cases_by_id:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    return ENGINE.get_case_forecast(case_id)


@router.post("/cases/{case_id}/status")
def update_case_status(case_id: str, payload: StatusUpdatePayload):
    if case_id not in ENGINE.cases_by_id:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    valid_statuses = {"New", "Under Review", "Escalated", "Dismissed", "Resolved"}
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {sorted(valid_statuses)}")

    ENGINE.cases_by_id[case_id]["status"] = payload.status
    note_entry = {
        "note_id": f"NOTE-{len(ENGINE.case_notes[case_id]) + 1:04d}",
        "case_id": case_id,
        "investigator": payload.investigator or "SIU Investigator",
        "note": f"Case status updated to '{payload.status}'.",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    ENGINE.case_notes[case_id].append(note_entry)
    return {
        "case_id": case_id,
        "status": payload.status,
        "case": ENGINE.cases_by_id[case_id],
        "notes": ENGINE.case_notes[case_id],
    }


@router.post("/cases/{case_id}/notes")
def add_case_note(case_id: str, payload: NoteCreatePayload):
    if case_id not in ENGINE.cases_by_id:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    if not payload.note.strip():
        raise HTTPException(status_code=400, detail="Note cannot be empty")

    note_entry = {
        "note_id": f"NOTE-{len(ENGINE.case_notes[case_id]) + 1:04d}",
        "case_id": case_id,
        "investigator": payload.investigator or "SIU Investigator",
        "note": payload.note.strip(),
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    ENGINE.case_notes[case_id].append(note_entry)
    return {
        "case_id": case_id,
        "note": note_entry,
        "notes": ENGINE.case_notes[case_id],
    }


@router.post("/generate-investigation-brief")
def create_investigation_brief(payload: BriefRequestPayload):
    case = ENGINE.cases_by_id.get(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {payload.case_id} not found")

    evidence = ENGINE.case_evidence.get(payload.case_id, [])
    forecast = ENGINE.get_case_forecast(payload.case_id)
    graph_data = ENGINE.get_case_graph(payload.case_id)
    return generate_investigation_brief(case, evidence, forecast, graph_data)


@router.get("/network")
def get_network_intelligence(
    provider: Optional[str] = None,
    facility: Optional[str] = None,
    risk: Optional[str] = None,
    case_id: Optional[str] = None,
    referral_only: bool = False,
):
    """
    Returns network intelligence graph of suspicious clusters, provider-facility ties,
    and referral patterns for the Network Intelligence page.
    """
    if case_id and case_id in ENGINE.cases_by_id:
        g = ENGINE.get_case_graph(case_id)
        return {
            "nodes": g["nodes"],
            "edges": g["edges"],
            "clusters": _get_suspicious_clusters(),
        }

    # Select top high-risk providers or filtered providers
    provs = sorted(ENGINE.provider_profiles.values(), key=lambda x: x["risk_score"], reverse=True)
    if risk and risk.upper() != "ALL":
        provs = [p for p in provs if p["risk_level"] == risk.upper()]
    if provider:
        q = provider.upper()
        provs = [p for p in provs if q in p["provider_id"].upper() or q in p["provider_name"].upper()]
    if facility:
        q = facility.upper()
        provs = [
            p for p in provs
            if q in p["facility_id"].upper() or any(q in f.upper() for f in p["connected_facilities"])
        ]

    selected_provs = provs[:18]
    selected_pids = {p["provider_id"] for p in selected_provs}

    nodes = {}
    edges = []

    for p in selected_provs:
        pid = p["provider_id"]
        nodes[pid] = {
            "id": pid,
            "label": f"{pid} ({p['provider_name']})",
            "type": "Provider",
            "risk": p["risk_level"].lower(),
            "risk_score": p["risk_score"],
            "details": f"{p['specialty']} • Risk {p['risk_score']}/100 • {p['location']}",
        }
        if not referral_only:
            for fid in p["connected_facilities"][:3]:
                f_obj = ENGINE.facilities_by_id[fid]
                if fid not in nodes:
                    nodes[fid] = {
                        "id": fid,
                        "label": f"{fid} ({f_obj['facility_name']})",
                        "type": "Facility",
                        "risk": "medium" if len(p["connected_facilities"]) > 1 else "low",
                        "risk_score": 45.0,
                        "details": f"Facility in {f_obj['location']}",
                    }
                edges.append({
                    "id": f"net-pf-{pid}-{fid}",
                    "source": pid,
                    "target": fid,
                    "label": "FACILITY_TIE",
                    "suspicious": len(p["connected_facilities"]) > 1,
                })

    # Add referral edges involving selected providers
    ref_pair_counts = defaultdict(int)
    for r in ENGINE.dataset["referrals"]:
        if r["from_provider"] in selected_pids or r["to_provider"] in selected_pids:
            ref_pair_counts[(r["from_provider"], r["to_provider"])] += 1

    for (u, v), cnt in ref_pair_counts.items():
        if cnt < 3 and len(ref_pair_counts) > 25:
            continue
        for pid_node in (u, v):
            if pid_node not in nodes and pid_node in ENGINE.provider_profiles:
                p_obj = ENGINE.provider_profiles[pid_node]
                nodes[pid_node] = {
                    "id": pid_node,
                    "label": f"{pid_node} ({p_obj['provider_name']})",
                    "type": "Provider",
                    "risk": p_obj["risk_level"].lower(),
                    "risk_score": p_obj["risk_score"],
                    "details": f"{p_obj['specialty']} • Risk {p_obj['risk_score']}/100",
                }
        edges.append({
            "id": f"net-ref-{u}-{v}",
            "source": u,
            "target": v,
            "label": f"REFERRAL ({cnt}x)",
            "suspicious": cnt >= 8,
        })

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "clusters": _get_suspicious_clusters(),
    }


def _get_suspicious_clusters():
    clusters = []
    for c in sorted(ENGINE.cases_by_id.values(), key=lambda x: x["risk_score"], reverse=True)[:10]:
        if any(s in c["primary_signals"] for s in ("network_anomaly", "referral_anomaly", "impossible_timing")):
            clusters.append({
                "case_id": c["case_id"],
                "provider_id": c["provider_id"],
                "provider_name": c["provider_name"],
                "facility_id": c["facility_id"],
                "risk_score": c["risk_score"],
                "signals": c["primary_signals"],
                "potential_exposure": c["potential_exposure"],
            })
    return clusters

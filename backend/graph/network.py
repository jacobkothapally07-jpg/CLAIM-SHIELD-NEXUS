from collections import defaultdict
from typing import Dict, Any, List
import networkx as nx


def run_graph_analysis(dataset: Dict[str, Any]) -> Dict[str, Any]:
    """
    Constructs a NetworkX graph of Providers, Members, Facilities, Claims, Referrals, and Locations.
    Analyzes unusual connectivity, dense clusters, referral concentration, and repeated relationships.
    Returns per-provider graph risk scores (0–100) and subgraph extraction helpers.
    """
    G = nx.Graph()
    ref_G = nx.DiGraph()

    providers = dataset["providers"]
    facilities = dataset["facilities"]
    members = dataset["members"]
    claims = dataset["claims"]
    referrals = dataset["referrals"]

    prov_map = {p["provider_id"]: p for p in providers}
    fac_map = {f["facility_id"]: f for f in facilities}

    for p in providers:
        pid = p["provider_id"]
        G.add_node(pid, node_type="Provider", label=p["provider_name"], region=p["location"])
        ref_G.add_node(pid, label=p["provider_name"])
        G.add_edge(pid, p["facility_id"], relation="ASSIGNED_FACILITY", weight=1)
        G.add_edge(pid, p["location"], relation="LOCATED_IN", weight=1)

    for f in facilities:
        fid = f["facility_id"]
        G.add_node(fid, node_type="Facility", label=f["facility_name"], region=f["location"])

    for m in members:
        mid = m["member_id"]
        G.add_node(mid, node_type="Member", label=mid, region=m["synthetic_region"])

    prov_member_weights = defaultdict(lambda: defaultdict(int))
    prov_fac_set = defaultdict(set)
    prov_regions = defaultdict(set)

    for c in claims:
        pid = c["provider_id"]
        mid = c["member_id"]
        fid = c["facility_id"]
        prov_member_weights[pid][mid] += 1
        prov_fac_set[pid].add(fid)
        prov_regions[pid].add(c["location"])

        if G.has_edge(pid, mid):
            G[pid][mid]["weight"] += 1
        else:
            G.add_edge(pid, mid, relation="BILLED_MEMBER", weight=1)

        if G.has_edge(pid, fid):
            G[pid][fid]["weight"] += 1
        else:
            G.add_edge(pid, fid, relation="BILLED_AT_FACILITY", weight=1)

    pair_ref_counts = defaultdict(int)
    for r in referrals:
        u = r["from_provider"]
        v = r["to_provider"]
        pair_ref_counts[(u, v)] += 1
        if ref_G.has_edge(u, v):
            ref_G[u][v]["weight"] += 1
        else:
            ref_G.add_edge(u, v, weight=1, relation="REFERRED_TO")

        if G.has_edge(u, v):
            G[u][v]["weight"] += 1
        else:
            G.add_edge(u, v, relation="REFERRAL_TIE", weight=1)

    # Calculate graph metrics per provider
    deg_centrality = nx.degree_centrality(G)
    pagerank_ref = nx.pagerank(ref_G, weight="weight") if ref_G.number_of_edges() > 0 else {}

    raw_scores = {}
    graph_details = {}

    for p in providers:
        pid = p["provider_id"]
        deg = deg_centrality.get(pid, 0.0)
        pr = pagerank_ref.get(pid, 0.0)

        # Repeated member interactions (>= 3 claims on same member)
        repeated_mems = sum(1 for cnt in prov_member_weights[pid].values() if cnt >= 3)
        multi_fac = len(prov_fac_set[pid])
        multi_reg = len(prov_regions[pid])

        # Reciprocal / concentrated referrals
        out_edges = ref_G.out_edges(pid, data=True)
        in_edges = ref_G.in_edges(pid, data=True)
        total_out_ref = sum(d.get("weight", 1) for _, _, d in out_edges)
        total_in_ref = sum(d.get("weight", 1) for _, _, d in in_edges)
        reciprocal_refs = 0
        for _, target, d in out_edges:
            if ref_G.has_edge(target, pid):
                reciprocal_refs += d.get("weight", 1) + ref_G[target][pid].get("weight", 1)

        score = (
            min(30.0, repeated_mems * 5.5)
            + min(25.0, (multi_fac - 1) * 14.0)
            + min(15.0, (multi_reg - 1) * 15.0)
            + min(30.0, reciprocal_refs * 0.9 + (total_out_ref + total_in_ref) * 0.45)
            + min(15.0, deg * 400.0 + pr * 600.0)
        )
        raw_scores[pid] = round(min(100.0, score), 1)
        graph_details[pid] = {
            "graph_risk_score": raw_scores[pid],
            "repeated_member_ties": repeated_mems,
            "connected_facilities": sorted(list(prov_fac_set[pid])),
            "referral_volume": total_out_ref + total_in_ref,
            "reciprocal_referral_count": reciprocal_refs,
        }

    return {
        "provider_graph_scores": raw_scores,
        "provider_graph_details": graph_details,
    }


def build_case_subgraph(dataset: Dict[str, Any], provider_id: str, case_claims: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Builds an interactive node/edge graph payload for a specific investigation case
    containing Provider, Member, Facility, Claim, and Referral nodes.
    """
    prov_map = {p["provider_id"]: p for p in dataset["providers"]}
    fac_map = {f["facility_id"]: f for f in dataset["facilities"]}
    mem_map = {m["member_id"]: m for m in dataset["members"]}

    nodes = {}
    edges = []

    p_main = prov_map[provider_id]
    nodes[provider_id] = {
        "id": provider_id,
        "label": f"{provider_id} ({p_main['provider_name']})",
        "type": "Provider",
        "risk": "high",
        "details": f"{p_main['specialty']} • {p_main['location']}",
    }

    # Limit claims in visual graph to top 8 so graph stays legible and interactive
    displayed_claims = sorted(case_claims, key=lambda x: x["claim_amount"], reverse=True)[:8]
    for idx, c in enumerate(displayed_claims):
        cid = c["claim_id"]
        mid = c["member_id"]
        fid = c["facility_id"]

        nodes[cid] = {
            "id": cid,
            "label": f"{cid} (₹{c['claim_amount']:,.0f})",
            "type": "Claim",
            "risk": "critical" if c["claim_amount"] >= 40000 else "medium",
            "details": f"{c['procedure_code']} on {c['claim_date']} ({c['location']})",
        }
        edges.append({
            "id": f"e-{provider_id}-{cid}",
            "source": provider_id,
            "target": cid,
            "label": "SUBMITTED",
            "suspicious": True,
        })

        if mid not in nodes:
            m_obj = mem_map.get(mid, {"age": 45, "synthetic_region": c["location"]})
            nodes[mid] = {
                "id": mid,
                "label": mid,
                "type": "Member",
                "risk": "medium",
                "details": f"Synthetic Age {m_obj['age']} • {m_obj['synthetic_region']}",
            }
        edges.append({
            "id": f"e-{cid}-{mid}",
            "source": cid,
            "target": mid,
            "label": "FOR_MEMBER",
            "suspicious": False,
        })

        if fid not in nodes:
            f_obj = fac_map.get(fid, {"facility_name": fid, "location": c["location"]})
            nodes[fid] = {
                "id": fid,
                "label": f"{fid} ({f_obj['facility_name']})",
                "type": "Facility",
                "risk": "medium" if fid != p_main["facility_id"] else "low",
                "details": f"Location: {f_obj['location']}",
            }
        edges.append({
            "id": f"e-{cid}-{fid}",
            "source": cid,
            "target": fid,
            "label": "AT_FACILITY",
            "suspicious": fid != p_main["facility_id"],
        })

    # Add referral relationships involving provider_id
    ref_counts = defaultdict(int)
    for r in dataset["referrals"]:
        if r["from_provider"] == provider_id or r["to_provider"] == provider_id:
            ref_counts[(r["from_provider"], r["to_provider"])] += 1

    # Also include transitive ring edges between partner providers if present (e.g. PROV-0043 -> PROV-0044)
    partner_provs = set()
    for (u, v), cnt in ref_counts.items():
        other = v if u == provider_id else u
        partner_provs.add(other)
        if other not in nodes and other in prov_map:
            po = prov_map[other]
            nodes[other] = {
                "id": other,
                "label": f"{other} ({po['provider_name']})",
                "type": "ReferralProvider",
                "risk": "high" if cnt >= 5 else "low",
                "details": f"Referral Partner • {po['specialty']}",
            }
        edges.append({
            "id": f"ref-{u}-{v}",
            "source": u,
            "target": v,
            "label": f"REFERRED ({cnt}x)",
            "suspicious": cnt >= 5,
        })

    for r in dataset["referrals"]:
        if r["from_provider"] in partner_provs and r["to_provider"] in partner_provs:
            u, v = r["from_provider"], r["to_provider"]
            edge_id = f"ref-ring-{u}-{v}"
            if not any(e["id"] == edge_id for e in edges):
                edges.append({
                    "id": edge_id,
                    "source": u,
                    "target": v,
                    "label": "CIRCULAR_REFERRAL",
                    "suspicious": True,
                })

    return {
        "nodes": list(nodes.values()),
        "edges": edges,
    }

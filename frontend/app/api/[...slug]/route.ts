import { NextRequest, NextResponse } from "next/server";
import snapshotData from "../../../data/seed42_snapshot.json";

// Type-safe access to deterministic SEED=42 engine output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SNAPSHOT: any = snapshotData;

function normalizeCaseId(rawId: string): string {
  const upper = rawId.toUpperCase();
  if (upper === "CASE-184294") return "CASE-1842";
  return upper;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join("/");
  const sp = req.nextUrl.searchParams;

  // 1. GET /api/dashboard/summary
  if (path === "dashboard/summary") {
    return NextResponse.json(SNAPSHOT.summary);
  }

  // 2. GET /api/risk-distribution
  if (path === "risk-distribution") {
    return NextResponse.json(SNAPSHOT.risk_distribution);
  }

  // 3. GET /api/top-providers
  if (path === "top-providers") {
    const limit = Number(sp.get("limit") || 15);
    return NextResponse.json({
      providers: SNAPSHOT.providers.slice(0, limit),
    });
  }

  // 4. GET /api/cases
  if (path === "cases") {
    const status = sp.get("status");
    const riskLevel = sp.get("risk_level");
    const signal = sp.get("signal");
    const search = sp.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cases: any[] = [...SNAPSHOT.cases];
    if (status && status.toLowerCase() !== "all") {
      cases = cases.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }
    if (riskLevel && riskLevel.toUpperCase() !== "ALL") {
      cases = cases.filter(
        (c) => c.risk_level.toUpperCase() === riskLevel.toUpperCase()
      );
    }
    if (signal && signal.toLowerCase() !== "all") {
      cases = cases.filter((c) =>
        c.primary_signals.some(
          (s: string) => s.toLowerCase() === signal.toLowerCase()
        )
      );
    }
    if (search) {
      const q = search.toUpperCase();
      cases = cases.filter(
        (c) =>
          c.case_id.toUpperCase().includes(q) ||
          c.provider_id.toUpperCase().includes(q) ||
          c.provider_name.toUpperCase().includes(q) ||
          c.facility_id.toUpperCase().includes(q)
      );
    }
    return NextResponse.json({
      total: cases.length,
      cases,
    });
  }

  // 5. GET /api/cases/:caseId, /timeline, /graph, /evidence, /forecast
  if (slug[0] === "cases" && slug[1]) {
    const cid = normalizeCaseId(slug[1]);
    const entry = SNAPSHOT.case_details[cid];
    if (!entry) {
      return NextResponse.json(
        { detail: `Case ${cid} not found` },
        { status: 404 }
      );
    }
    const sub = slug[2];
    if (!sub) {
      return NextResponse.json(entry.detail);
    }
    if (sub === "timeline") {
      return NextResponse.json(entry.timeline);
    }
    if (sub === "graph") {
      return NextResponse.json(entry.graph);
    }
    if (sub === "evidence") {
      return NextResponse.json({
        case_id: cid,
        risk_score: entry.detail.case.risk_score,
        evidence: entry.detail.evidence,
      });
    }
    if (sub === "forecast") {
      return NextResponse.json(entry.detail.forecast);
    }
  }

  // 6. GET /api/claims
  if (path === "claims") {
    const risk = sp.get("risk");
    const date = sp.get("date");
    const provider = sp.get("provider");
    const facility = sp.get("facility");
    const signal = sp.get("signal");
    const status = sp.get("status");
    const search = sp.get("search");
    const limit = Number(sp.get("limit") || 100);
    const offset = Number(sp.get("offset") || 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filtered: any[] = [...SNAPSHOT.claims_sample];
    const hasFilter = Boolean(
      (risk && risk.toUpperCase() !== "ALL") ||
        date ||
        provider ||
        facility ||
        (signal && signal.toLowerCase() !== "all") ||
        (status && status.toLowerCase() !== "all") ||
        search
    );

    if (risk && risk.toUpperCase() !== "ALL") {
      filtered = filtered.filter((c) => c.risk_level === risk.toUpperCase());
    }
    if (date) {
      filtered = filtered.filter((c) => c.claim_date.startsWith(date));
    }
    if (provider) {
      const qp = provider.toUpperCase();
      filtered = filtered.filter(
        (c) =>
          c.provider_id.toUpperCase().includes(qp) ||
          c.provider_name.toUpperCase().includes(qp)
      );
    }
    if (facility) {
      const qf = facility.toUpperCase();
      filtered = filtered.filter(
        (c) =>
          c.facility_id.toUpperCase().includes(qf) ||
          c.facility_name.toUpperCase().includes(qf)
      );
    }
    if (signal && signal.toLowerCase() !== "all") {
      filtered = filtered.filter((c) =>
        c.signals.some((s: string) => s.toLowerCase() === signal.toLowerCase())
      );
    }
    if (status && status.toLowerCase() !== "all") {
      filtered = filtered.filter(
        (c) => c.status.toLowerCase() === status.toLowerCase()
      );
    }
    if (search) {
      const q = search.toUpperCase();
      filtered = filtered.filter(
        (c) =>
          c.claim_id.toUpperCase().includes(q) ||
          c.provider_id.toUpperCase().includes(q) ||
          c.member_id.toUpperCase().includes(q) ||
          c.facility_id.toUpperCase().includes(q) ||
          c.procedure_code.toUpperCase().includes(q)
      );
    }

    return NextResponse.json({
      total: hasFilter ? filtered.length : SNAPSHOT.claims_total,
      limit,
      offset,
      claims: filtered.slice(offset, offset + limit),
    });
  }

  // 7. GET /api/providers
  if (path === "providers") {
    const risk = sp.get("risk");
    const specialty = sp.get("specialty");
    const region = sp.get("region");
    const search = sp.get("search");
    const limit = Number(sp.get("limit") || 100);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provs: any[] = [...SNAPSHOT.providers];
    if (risk && risk.toUpperCase() !== "ALL") {
      provs = provs.filter((p) => p.risk_level === risk.toUpperCase());
    }
    if (specialty && specialty.toLowerCase() !== "all") {
      provs = provs.filter(
        (p) => p.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }
    if (region && region.toLowerCase() !== "all") {
      provs = provs.filter(
        (p) => p.location.toLowerCase() === region.toLowerCase()
      );
    }
    if (search) {
      const q = search.toUpperCase();
      provs = provs.filter(
        (p) =>
          p.provider_id.toUpperCase().includes(q) ||
          p.provider_name.toUpperCase().includes(q) ||
          p.specialty.toUpperCase().includes(q)
      );
    }
    return NextResponse.json({
      total: provs.length,
      providers: provs.slice(0, limit),
    });
  }

  // 8. GET /api/providers/:providerId
  if (slug[0] === "providers" && slug[1]) {
    const pid = slug[1].toUpperCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prof = SNAPSHOT.providers.find((p: any) => p.provider_id === pid);
    if (!prof) {
      return NextResponse.json(
        { detail: `Provider ${pid} not found` },
        { status: 404 }
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const referrals = SNAPSHOT.referrals.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.from_provider === pid || r.to_provider === pid
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cases = SNAPSHOT.cases.filter((c: any) => c.provider_id === pid);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentClaims = SNAPSHOT.claims_sample
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((c: any) => c.provider_id === pid)
      .slice(0, 25);

    return NextResponse.json({
      provider: prof,
      referrals: referrals.slice(0, 30),
      cases,
      recent_claims: recentClaims,
    });
  }

  // 9. GET /api/network
  if (path === "network") {
    const caseIdParam = sp.get("case_id");
    if (caseIdParam) {
      const cid = normalizeCaseId(caseIdParam);
      if (SNAPSHOT.case_details[cid]) {
        return NextResponse.json({
          nodes: SNAPSHOT.case_details[cid].graph.nodes,
          edges: SNAPSHOT.case_details[cid].graph.edges,
          clusters: SNAPSHOT.network_default.clusters,
        });
      }
    }

    const provider = sp.get("provider");
    const facility = sp.get("facility");
    const risk = sp.get("risk");
    const referralOnly = sp.get("referral_only") === "true";

    if (!provider && !facility && (!risk || risk === "ALL") && !referralOnly) {
      return NextResponse.json(SNAPSHOT.network_default);
    }

    // Filtered network construction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provs: any[] = [...SNAPSHOT.providers];
    if (risk && risk.toUpperCase() !== "ALL") {
      provs = provs.filter((p) => p.risk_level === risk.toUpperCase());
    }
    if (provider) {
      const q = provider.toUpperCase();
      provs = provs.filter(
        (p) =>
          p.provider_id.toUpperCase().includes(q) ||
          p.provider_name.toUpperCase().includes(q)
      );
    }
    if (facility) {
      const q = facility.toUpperCase();
      provs = provs.filter(
        (p) =>
          p.facility_id.toUpperCase().includes(q) ||
          p.connected_facilities.some((f: string) =>
            f.toUpperCase().includes(q)
          )
      );
    }

    const selectedProvs = provs.slice(0, 18);
    const selectedPids = new Set(selectedProvs.map((p) => p.provider_id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodesMap: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edges: any[] = [];

    for (const p of selectedProvs) {
      const pid = p.provider_id;
      nodesMap[pid] = {
        id: pid,
        label: `${pid} (${p.provider_name})`,
        type: "Provider",
        risk: p.risk_level.toLowerCase(),
        risk_score: p.risk_score,
        details: `${p.specialty} • Risk ${p.risk_score}/100 • ${p.location}`,
      };
      if (!referralOnly) {
        for (const fid of p.connected_facilities.slice(0, 3)) {
          const fObj = SNAPSHOT.facilities[fid] || {
            facility_name: fid,
            location: p.location,
          };
          if (!nodesMap[fid]) {
            nodesMap[fid] = {
              id: fid,
              label: `${fid} (${fObj.facility_name})`,
              type: "Facility",
              risk: p.connected_facilities.length > 1 ? "medium" : "low",
              risk_score: 45,
              details: `Facility in ${fObj.location}`,
            };
          }
          edges.push({
            id: `net-pf-${pid}-${fid}`,
            source: pid,
            target: fid,
            label: "FACILITY_TIE",
            suspicious: p.connected_facilities.length > 1,
          });
        }
      }
    }

    const refCounts: Record<string, number> = {};
    for (const r of SNAPSHOT.referrals) {
      if (selectedPids.has(r.from_provider) || selectedPids.has(r.to_provider)) {
        const key = `${r.from_provider}__${r.to_provider}`;
        refCounts[key] = (refCounts[key] || 0) + 1;
      }
    }

    const entries = Object.entries(refCounts);
    for (const [key, cnt] of entries) {
      if (cnt < 3 && entries.length > 25) continue;
      const [u, v] = key.split("__");
      for (const pidNode of [u, v]) {
        if (!nodesMap[pidNode]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pObj = SNAPSHOT.providers.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (item: any) => item.provider_id === pidNode
          );
          if (pObj) {
            nodesMap[pidNode] = {
              id: pidNode,
              label: `${pidNode} (${pObj.provider_name})`,
              type: "Provider",
              risk: pObj.risk_level.toLowerCase(),
              risk_score: pObj.risk_score,
              details: `${pObj.specialty} • Risk ${pObj.risk_score}/100`,
            };
          }
        }
      }
      edges.push({
        id: `net-ref-${u}-${v}`,
        source: u,
        target: v,
        label: `REFERRAL (${cnt}x)`,
        suspicious: cnt >= 8,
      });
    }

    return NextResponse.json({
      nodes: Object.values(nodesMap),
      edges,
      clusters: SNAPSHOT.network_default.clusters,
    });
  }

  return NextResponse.json({ error: `Unknown endpoint /api/${path}` }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const path = slug.join("/");
  const body = await req.json().catch(() => ({}));

  // 1. POST /api/generate-investigation-brief
  if (path === "generate-investigation-brief") {
    const cid = normalizeCaseId(String(body.case_id || "CASE-1842"));
    const entry = SNAPSHOT.case_details[cid];
    if (!entry) {
      return NextResponse.json(
        { detail: `Case ${cid} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(entry.brief);
  }

  // 2. POST /api/cases/:caseId/status
  if (slug[0] === "cases" && slug[1] && slug[2] === "status") {
    const cid = normalizeCaseId(slug[1]);
    const entry = SNAPSHOT.case_details[cid];
    if (!entry) {
      return NextResponse.json(
        { detail: `Case ${cid} not found` },
        { status: 404 }
      );
    }
    const status = String(body.status || "Under Review");
    const investigator = String(body.investigator || "SIU Lead Investigator");
    entry.detail.case.status = status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchingCase = SNAPSHOT.cases.find((c: any) => c.case_id === cid);
    if (matchingCase) matchingCase.status = status;

    const noteEntry = {
      note_id: `NOTE-${String(entry.detail.notes.length + 1).padStart(4, "0")}`,
      case_id: cid,
      investigator,
      note: `Case status updated to '${status}'.`,
      timestamp: new Date().toISOString().slice(0, 19) + "Z",
    };
    entry.detail.notes.push(noteEntry);

    return NextResponse.json({
      case_id: cid,
      status,
      case: entry.detail.case,
      notes: entry.detail.notes,
    });
  }

  // 3. POST /api/cases/:caseId/notes
  if (slug[0] === "cases" && slug[1] && slug[2] === "notes") {
    const cid = normalizeCaseId(slug[1]);
    const entry = SNAPSHOT.case_details[cid];
    if (!entry) {
      return NextResponse.json(
        { detail: `Case ${cid} not found` },
        { status: 404 }
      );
    }
    const note = String(body.note || "").trim();
    const investigator = String(body.investigator || "SIU Lead Investigator");
    const noteEntry = {
      note_id: `NOTE-${String(entry.detail.notes.length + 1).padStart(4, "0")}`,
      case_id: cid,
      investigator,
      note,
      timestamp: new Date().toISOString().slice(0, 19) + "Z",
    };
    entry.detail.notes.push(noteEntry);
    return NextResponse.json({
      case_id: cid,
      note: noteEntry,
      notes: entry.detail.notes,
    });
  }

  return NextResponse.json({ error: `Unknown POST /api/${path}` }, { status: 404 });
}

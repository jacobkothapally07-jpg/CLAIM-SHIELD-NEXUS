"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Network, ArrowRight, ShieldAlert } from "lucide-react";
import { getNetworkIntelligence } from "../../services/api";
import { GraphNode, GraphEdge } from "../../types";
import { formatINR, formatSignalName } from "../../lib/format";
import RelationshipGraph from "../../components/graph/RelationshipGraph";

export default function NetworkIntelligencePage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<
    {
      case_id: string;
      provider_id: string;
      provider_name: string;
      facility_id: string;
      risk_score: number;
      signals: string[];
      potential_exposure: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [providerFilter, setProviderFilter] = useState("");
  const [facilityFilter, setFacilityFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [caseFilter, setCaseFilter] = useState("");
  const [referralOnly, setReferralOnly] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getNetworkIntelligence({
          provider: providerFilter || undefined,
          facility: facilityFilter || undefined,
          risk: riskFilter,
          case_id: caseFilter || undefined,
          referral_only: referralOnly,
        });
        setNodes(res.nodes);
        setEdges(res.edges);
        setClusters(res.clusters);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [providerFilter, facilityFilter, riskFilter, caseFilter, referralOnly]);

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#209b47] flex items-center gap-2">
              <Network className="w-5 h-5 text-[#209b47]" />
              Network Intelligence &amp; Referral Ring Topology
            </h2>
            <p className="text-xs text-[#042126]/75">
              NetworkX graph intelligence surfacing dense provider-facility clusters, reciprocal referral rings, and shared member cliques
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCaseFilter(caseFilter === "CASE-1842" ? "" : "CASE-1842")
              }
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                caseFilter === "CASE-1842"
                  ? "bg-[#209b47] text-white border-[#209b47]"
                  : "bg-[#acf2e5]/20 text-[#042126] border-[#042126]/15 hover:bg-[#acf2e5]/45"
              }`}
            >
              {caseFilter === "CASE-1842"
                ? "Viewing CASE-1842 Subgraph (Reset)"
                : "Focus CASE-1842 Cluster"}
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          <input
            type="text"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            placeholder="Filter by Provider (e.g. PROV-0042)"
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
          />
          <input
            type="text"
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            placeholder="Filter by Facility (e.g. FAC-0001)"
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
          />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>
          <input
            type="text"
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            placeholder="Filter by Case ID (e.g. CASE-1842)"
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
          />
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={referralOnly}
              onChange={(e) => setReferralOnly(e.target.checked)}
              className="rounded border-[#042126]/30 accent-[#209b47]"
            />
            <span>Referral Loops Only</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-white rounded-xl border border-[#042126]/10 animate-pulse" />
      ) : (
        <RelationshipGraph nodes={nodes} edges={edges} height={460} />
      )}

      {/* Detected Suspicious Network & Referral Clusters */}
      <div className="nexus-glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-[#b91c1c]" />
          Detected Suspicious Network &amp; Referral Clusters
        </h3>
        <p className="text-xs text-[#042126]/75 mb-4">
          High-density provider-facility-referral clusters flagged by NetworkX centrality and reciprocity analysis
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((cl) => (
            <div
              key={cl.case_id}
              className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10 flex flex-col justify-between hover:border-[#acf2e5] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-mono text-[#042126]">
                    {cl.case_id} • {cl.provider_id}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] border border-[#b91c1c]/30 font-mono">
                    Risk: {cl.risk_score}
                  </span>
                </div>
                <div className="text-xs text-[#042126] font-medium mb-2">
                  {cl.provider_name} • Primary Facility: {cl.facility_id}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {cl.signals.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#acf2e5] text-[#042126] font-medium"
                    >
                      {formatSignalName(s)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#042126]/10 flex items-center justify-between text-xs">
                <span className="text-[#209b47] font-mono font-bold">
                  Exposure: {formatINR(cl.potential_exposure)}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCaseFilter(cl.case_id)}
                    className="text-[#15497e] hover:text-[#209b47] underline font-medium"
                  >
                    Focus Graph
                  </button>
                  <Link
                    href={`/cases/${cl.case_id}`}
                    className="text-[#209b47] hover:text-[#005f68] font-semibold flex items-center gap-1"
                  >
                    <span>Case</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

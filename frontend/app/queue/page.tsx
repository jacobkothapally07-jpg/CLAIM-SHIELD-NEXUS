"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowRight, CheckCircle2 } from "lucide-react";
import { getCases } from "../../services/api";
import { InvestigationCase } from "../../types";
import {
  formatINR,
  formatSignalName,
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from "../../lib/format";

export default function SIUQueuePage() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [signalFilter, setSignalFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getCases({
          risk_level: riskFilter,
          status: statusFilter,
          signal: signalFilter,
          search,
        });
        setCases(res.cases);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [riskFilter, statusFilter, signalFilter, search]);

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#209b47]">
            SIU Priority Investigation Queue
          </h2>
          <p className="text-xs text-[#042126]/75">
            Prioritized cases distilled from 10,000+ synthetic claims using composite risk score, financial exposure, and evidence strength
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#005f68] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Case ID, Provider..."
              className="pl-8 pr-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical (81–100)</option>
            <option value="HIGH">High (61–80)</option>
            <option value="MEDIUM">Medium (31–60)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Under Review">Under Review</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>

          <select
            value={signalFilter}
            onChange={(e) => setSignalFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="ALL">All FWA Signals</option>
            <option value="duplicate_billing">Duplicate Billing</option>
            <option value="impossible_timing">Impossible Timing</option>
            <option value="excessive_utilization">Excessive Utilization</option>
            <option value="abnormal_billing">Abnormal Billing</option>
            <option value="upcoding">Upcoding</option>
            <option value="unbundling">Unbundling</option>
            <option value="phantom_service">Phantom Service</option>
            <option value="referral_anomaly">Referral Anomaly</option>
            <option value="network_anomaly">Network Anomaly</option>
            <option value="temporal_spike">Temporal Spike</option>
          </select>
        </div>
      </div>

      <div className="nexus-glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#042126]/10 flex items-center justify-between text-xs text-[#042126]/75 bg-[#f2fcff]">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#209b47]" />
            Showing <strong className="text-[#042126]">{cases.length}</strong> prioritized SIU cases
          </span>
          <span className="text-[#005f68] font-medium">Sorted by Composite Risk Score &amp; Financial Exposure</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#042126] text-white text-[11px] uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Risk</th>
                <th className="py-3.5 px-4">Risk Level</th>
                <th className="py-3.5 px-4">Potential Exposure</th>
                <th className="py-3.5 px-4">Primary Signals</th>
                <th className="py-3.5 px-4">Evidence Strength</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#042126]/10 text-xs text-[#042126]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#042126]/65">
                    Loading prioritized SIU queue...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#042126]/65">
                    No cases match the current filters.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.case_id}
                    className={`border-l-[3px] border-l-transparent hover:border-l-[#209b47] hover:bg-[#acf2e5]/15 transition-colors ${
                      c.case_id === "CASE-1842" ? "bg-[#acf2e5]/25" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <Link
                        href={`/cases/${c.case_id}`}
                        className="text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1.5"
                      >
                        <span>{c.case_id}</span>
                        {c.case_id === "CASE-1842" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] font-bold">
                            FLAGSHIP
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/providers/${c.provider_id}`}
                        className="font-semibold text-[#15497e] hover:text-[#209b47] hover:underline"
                      >
                        {c.provider_id} • {c.provider_name}
                      </Link>
                      <div className="text-[11px] text-[#042126]/65">
                        {c.specialty} • {c.facility_id} ({c.location})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#042126] tabular-nums">
                      {c.risk_score} / 100
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskBadgeClasses(
                          c.risk_level
                        )}`}
                      >
                        {c.risk_level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#209b47] tabular-nums">
                      {formatINR(c.potential_exposure)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {c.primary_signals.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#acf2e5] text-[#042126] font-medium"
                          >
                            {formatSignalName(s)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[#042126] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#209b47]" />
                        {c.evidence_strength}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getStatusBadgeClasses(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/cases/${c.case_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold transition-colors"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

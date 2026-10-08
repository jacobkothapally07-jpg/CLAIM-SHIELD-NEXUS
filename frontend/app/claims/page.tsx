"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import { getClaims } from "../../services/api";
import { EnrichedClaim } from "../../types";
import {
  formatINR,
  formatSignalName,
  getRiskBadgeClasses,
} from "../../lib/format";

export default function ClaimsExplorerPage() {
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [date, setDate] = useState("");
  const [provider, setProvider] = useState("");
  const [facility, setFacility] = useState("");
  const [signal, setSignal] = useState("all");
  const [status] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getClaims({
          risk,
          date: date || undefined,
          provider: provider || undefined,
          facility: facility || undefined,
          signal,
          status,
          search: search || undefined,
          limit: 100,
        });
        setClaims(res.claims);
        setTotal(res.total);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load synthetic claims"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [risk, date, provider, facility, signal, status, search]);

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#209b47]">
              Synthetic Claims Explorer
            </h2>
            <p className="text-xs text-[#042126]/75">
              Search and filter across 10,000+ generated synthetic claims (CLM-000001 to CLM-010000) ranked by multi-signal risk
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#042126]/75">
            <span>
              Matching Synthetic Claims:{" "}
              <strong className="text-[#005f68] text-sm font-mono tabular-nums">
                {loading ? "Loading..." : total.toLocaleString()}
              </strong>
            </span>
            <Link
              href="/queue"
              className="text-[#15497e] hover:text-[#209b47] underline font-semibold"
            >
              Open SIU Queue →
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#fee2e2] border border-[#b91c1c]/30 text-[#b91c1c] text-xs">
            {error}
          </div>
        )}

        {/* Multi-Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#005f68] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Claim ID, Member, Procedure..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
            />
          </div>

          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Filter Provider (e.g. PROV-0042)"
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
          />

          <input
            type="text"
            value={facility}
            onChange={(e) => setFacility(e.target.value)}
            placeholder="Filter Facility (e.g. FAC-0001)"
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
          />

          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Date (e.g. 2026-05)"
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
          />

          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={signal}
            onChange={(e) => setSignal(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="all">All FWA Signals</option>
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

      {/* Claims Table */}
      <div className="nexus-glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#042126]/10 flex items-center justify-between text-xs text-[#042126]/75 bg-[#f2fcff]">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#209b47]" />
            Displaying top {claims.length} of {total.toLocaleString()} matching claims
          </span>
          <span className="text-[#005f68] font-medium">Sorted by Risk Score &amp; Claim Amount</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#042126] text-white text-[11px] uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Claim ID</th>
                <th className="py-3.5 px-4">Date &amp; Time</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Facility</th>
                <th className="py-3.5 px-4">Procedure</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Risk</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#042126]/10 text-xs text-[#042126]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#042126]/65">
                    Querying synthetic claims engine...
                  </td>
                </tr>
              ) : (
                claims.map((c) => (
                  <tr
                    key={c.claim_id}
                    className="border-l-[3px] border-l-transparent hover:border-l-[#209b47] hover:bg-[#acf2e5]/15 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#042126]">
                      {c.claim_id}
                    </td>
                    <td className="py-3 px-4 text-[#042126]">
                      <div className="font-mono">{c.claim_date}</div>
                      <div className="text-[10px] text-[#042126]/65">
                        {c.claim_timestamp.split("T")[1]} • {c.location}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/providers/${c.provider_id}`}
                        className="font-semibold text-[#15497e] hover:text-[#209b47] hover:underline"
                      >
                        {c.provider_id}
                      </Link>
                      <div className="text-[11px] text-[#042126]/65">
                        {c.provider_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#042126]">
                      {c.member_id}
                    </td>
                    <td className="py-3 px-4 text-[#042126]">
                      <div className="font-medium">{c.facility_id}</div>
                      <div className="text-[11px] text-[#042126]/65">
                        {c.facility_name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#042126]">
                        {c.procedure_code}
                      </div>
                      <div className="text-[11px] text-[#042126]/65">
                        {c.procedure_name}
                      </div>
                    </td>
                    <td className="py-3 px-4 tabular-nums">
                      <div className="font-semibold text-[#042126] font-mono">
                        {formatINR(c.claim_amount)}
                      </div>
                      <div className="text-[10px] text-[#042126]/65 font-mono">
                        Exp: {formatINR(c.expected_cost)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskBadgeClasses(
                            c.risk_level
                          )}`}
                        >
                          {c.risk_score} ({c.risk_level})
                        </span>
                      </div>
                      {c.signals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.signals.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#acf2e5] text-[#042126] font-medium"
                            >
                              {formatSignalName(s)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#acf2e5] text-[#042126] text-[11px] font-medium">
                        {c.status}
                      </span>
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

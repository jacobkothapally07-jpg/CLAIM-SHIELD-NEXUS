"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Repeat, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getProviderDetail } from "../../../services/api";
import {
  ProviderProfile,
  InvestigationCase,
  EnrichedClaim,
} from "../../../types";
import {
  formatINR,
  formatSignalName,
  getRiskBadgeClasses,
} from "../../../lib/format";

export default function ProviderRiskDetailPage() {
  const params = useParams();
  const providerId = String(params?.providerId || "PROV-0042");

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [referrals, setReferrals] = useState<
    {
      referral_id: string;
      from_provider: string;
      to_provider: string;
      member_id: string;
      date: string;
    }[]
  >([]);
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [recentClaims, setRecentClaims] = useState<EnrichedClaim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getProviderDetail(providerId);
        setProvider(res.provider);
        setReferrals(res.referrals);
        setCases(res.cases);
        setRecentClaims(res.recent_claims);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [providerId]);

  if (loading || !provider) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-xl border border-[#042126]/10" />
        <div className="h-80 bg-white rounded-xl border border-[#042126]/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Link
            href="/providers"
            className="text-xs text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1 mb-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Providers Directory
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-[#209b47]">
              {provider.provider_id} • {provider.provider_name}
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded border ${getRiskBadgeClasses(
                provider.risk_level
              )}`}
            >
              Risk Score: {provider.risk_score} / 100 ({provider.risk_level})
            </span>
          </div>
          <p className="text-xs text-[#042126]/75 mt-1">
            Specialty: <strong className="text-[#042126]">{provider.specialty}</strong> •{" "}
            Synthetic Region: <strong className="text-[#042126]">{provider.location}</strong> •{" "}
            Primary Facility: <strong className="text-[#042126]">{provider.facility_id} ({provider.facility_name})</strong>
          </p>
        </div>

        {cases.length > 0 && (
          <Link
            href={`/cases/${cases[0].case_id}`}
            className="px-5 py-2.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Open Linked SIU Case ({cases[0].case_id})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexus-glass-card rounded-xl p-4">
          <div className="text-xs text-[#005f68] font-semibold">Claim Volume</div>
          <div className="text-2xl font-bold text-[#042126] mt-1 font-mono tabular-nums">
            {provider.claim_volume} claims
          </div>
          <div className="text-[11px] text-[#042126]/65 mt-1">
            Total Billed: {formatINR(provider.total_claimed_amount)}
          </div>
        </div>

        <div className="nexus-glass-card rounded-xl p-4">
          <div className="text-xs text-[#005f68] font-semibold">Average Claim Amount</div>
          <div className="text-2xl font-bold text-[#209b47] mt-1 font-mono tabular-nums">
            {formatINR(provider.average_claim_amount)}
          </div>
          <div className="text-[11px] text-[#042126]/65 mt-1">
            Synthetic peer comparison metric
          </div>
        </div>

        <div className="nexus-glass-card rounded-xl p-4">
          <div className="text-xs text-[#005f68] font-semibold">Peak Daily Utilization</div>
          <div className="text-2xl font-bold text-[#b45309] mt-1 font-mono tabular-nums">
            {provider.utilization_per_day} claims/day
          </div>
          <div className="text-[11px] text-[#042126]/65 mt-1">
            ML Isolation Forest Score: {provider.ml_score}/100
          </div>
        </div>

        <div className="nexus-glass-card rounded-xl p-4">
          <div className="text-xs text-[#005f68] font-semibold">Connected Facilities &amp; Referrals</div>
          <div className="text-2xl font-bold text-[#005f68] mt-1 font-mono tabular-nums">
            {provider.connected_facilities.length} Fac • {provider.referral_volume} Ref
          </div>
          <div className="text-[11px] text-[#042126]/65 mt-1">
            Facilities: {provider.connected_facilities.join(", ")}
          </div>
        </div>
      </div>

      {/* Historical Trend + FWA Signals & Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 nexus-glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#005f68] mb-1">
            Historical Claim &amp; Billing Trend
          </h3>
          <p className="text-xs text-[#042126]/75 mb-4">
            Monthly synthetic claim count and billed amount trajectory for {provider.provider_id}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={provider.historical_trend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(4, 33, 38, 0.08)"
                />
                <XAxis dataKey="month" stroke="#042126" fontSize={11} />
                <YAxis stroke="#042126" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#042126",
                    borderColor: "#005f68",
                    fontSize: "12px",
                    color: "#ffffff",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#acf2e5" }}
                />
                <Area
                  type="monotone"
                  dataKey="claims"
                  name="Claims"
                  stroke="#209b47"
                  fill="#acf2e5"
                  fillOpacity={0.55}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nexus-glass-card rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#b91c1c]" />
              Active FWA Signals
            </h3>
            {provider.fwa_signals.length === 0 ? (
              <p className="text-xs text-[#042126]/70">
                No FWA signals triggered for this provider.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {provider.fwa_signals.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded bg-[#fee2e2] text-[#b91c1c] border border-[#b91c1c]/30 font-semibold"
                  >
                    {formatSignalName(s)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#042126]/10">
            <h4 className="text-xs font-semibold text-[#005f68] flex items-center gap-1.5 mb-2">
              <Building2 className="w-3.5 h-3.5 text-[#209b47]" />
              Connected Facilities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {provider.connected_facilities.map((fid) => (
                <span
                  key={fid}
                  className="text-xs px-2.5 py-1 rounded bg-[#acf2e5] text-[#042126] font-mono font-semibold"
                >
                  {fid}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#042126]/10">
            <h4 className="text-xs font-semibold text-[#005f68] flex items-center gap-1.5 mb-2">
              <Repeat className="w-3.5 h-3.5 text-[#d97706]" />
              Referral Relationships ({referrals.length})
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
              {referrals.slice(0, 8).map((r) => (
                <div
                  key={r.referral_id}
                  className="px-2.5 py-1.5 rounded bg-[#f2fcff] border border-[#042126]/10 flex items-center justify-between"
                >
                  <span className="text-[#042126] font-mono font-medium">
                    {r.from_provider} → {r.to_provider}
                  </span>
                  <span className="text-[10px] text-[#042126]/65 font-mono">
                    {r.member_id} ({r.date})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Claims Table */}
      <div className="nexus-glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#042126]/10 text-xs font-semibold text-[#005f68] bg-[#f2fcff]">
          Recent Synthetic Claims Submitted by {provider.provider_id}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#042126] text-white text-[11px] uppercase font-mono">
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Facility</th>
                <th className="py-3 px-4">Procedure</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Signals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#042126]/10 text-[#042126]">
              {recentClaims.map((c) => (
                <tr
                  key={c.claim_id}
                  className="border-l-[3px] border-l-transparent hover:border-l-[#209b47] hover:bg-[#acf2e5]/15 transition-colors"
                >
                  <td className="py-2.5 px-4 font-mono font-bold text-[#042126]">
                    {c.claim_id}
                  </td>
                  <td className="py-2.5 px-4 text-[#042126] font-mono">
                    {c.claim_timestamp.replace("T", " ")} ({c.location})
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#042126]">
                    {c.member_id}
                  </td>
                  <td className="py-2.5 px-4 text-[#042126] font-medium">
                    {c.facility_id}
                  </td>
                  <td className="py-2.5 px-4 text-[#042126]">
                    {c.procedure_code} • {c.procedure_name}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-[#042126] tabular-nums">
                    {formatINR(c.claim_amount)}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {c.signals.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] font-semibold"
                        >
                          {formatSignalName(s)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

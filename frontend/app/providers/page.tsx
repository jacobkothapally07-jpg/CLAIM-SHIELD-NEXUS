"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, ArrowRight } from "lucide-react";
import { getProviders } from "../../services/api";
import { ProviderProfile } from "../../types";
import {
  formatINR,
  formatSignalName,
  getRiskBadgeClasses,
} from "../../lib/format";

export default function ProvidersDirectoryPage() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [total, setTotal] = useState(500);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [region, setRegion] = useState("ALL");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getProviders({
          risk,
          region: region === "ALL" ? undefined : region,
          search: search || undefined,
        });
        setProviders(res.providers);
        setTotal(res.total);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load synthetic providers"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [risk, region, search]);

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#209b47] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#209b47]" />
            Synthetic Provider Risk Directory ({loading ? "500" : total} Providers)
          </h2>
          <p className="text-xs text-[#042126]/75">
            Ranked by composite multi-signal risk score (Rule 40% + Isolation Forest 30% + NetworkX Graph 20% + Temporal 10%)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#005f68] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PROV-0042, specialty..."
              className="pl-8 pr-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
            />
          </div>

          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical (81–100)</option>
            <option value="HIGH">High (61–80)</option>
            <option value="MEDIUM">Medium (31–60)</option>
            <option value="LOW">Low (0–30)</option>
          </select>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#f2fcff] border border-[#042126]/15 text-[#042126]"
          >
            <option value="ALL">All Synthetic Regions</option>
            <option value="Region-A">Region-A</option>
            <option value="Region-B">Region-B</option>
            <option value="Region-C">Region-C</option>
            <option value="Region-D">Region-D</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#fee2e2] border border-[#b91c1c]/30 text-[#b91c1c] text-xs font-medium">
          {error}
        </div>
      )}

      <div className="nexus-glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#042126] text-white text-[11px] uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Provider ID</th>
                <th className="py-3.5 px-4">Specialty &amp; Region</th>
                <th className="py-3.5 px-4">Claim Volume</th>
                <th className="py-3.5 px-4">Avg Claim Amount</th>
                <th className="py-3.5 px-4">Peak Daily Util</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">FWA Signals</th>
                <th className="py-3.5 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#042126]/10 text-xs text-[#042126]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#042126]/65">
                    Loading synthetic provider profiles...
                  </td>
                </tr>
              ) : (
                providers.map((p) => (
                  <tr
                    key={p.provider_id}
                    className="border-l-[3px] border-l-transparent hover:border-l-[#209b47] hover:bg-[#acf2e5]/15 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold">
                      <Link
                        href={`/providers/${p.provider_id}`}
                        className="text-[#15497e] hover:text-[#209b47] hover:underline"
                      >
                        {p.provider_id} • {p.provider_name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-[#042126]">
                      <div className="font-medium">{p.specialty}</div>
                      <div className="text-[11px] text-[#042126]/65">
                        {p.location} • {p.facility_id}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#042126] tabular-nums">
                      {p.claim_volume}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#042126] tabular-nums">
                      {formatINR(p.average_claim_amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#042126] tabular-nums">
                      {p.utilization_per_day} claims/day
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRiskBadgeClasses(
                          p.risk_level
                        )}`}
                      >
                        {p.risk_score} ({p.risk_level})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.fwa_signals.length === 0 ? (
                        <span className="text-[#042126]/55">Normal Baseline</span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.fwa_signals.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#acf2e5] text-[#042126] font-medium"
                            >
                              {formatSignalName(s)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/providers/${p.provider_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold transition-colors"
                      >
                        <span>Inspect</span>
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

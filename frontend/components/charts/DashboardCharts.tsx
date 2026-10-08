"use client";

import React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ClaimsTrendItem,
  SignalDistributionItem,
  ExposureByCategoryItem,
  ProviderProfile,
} from "../../types";
import { formatINR, getRiskBadgeClasses } from "../../lib/format";

interface DashboardChartsProps {
  claimsTrend: ClaimsTrendItem[];
  signalDistribution: SignalDistributionItem[];
  exposureByCategory: ExposureByCategoryItem[];
  riskDistribution: { level: string; range: string; count: number }[];
  topProviders: ProviderProfile[];
}

const RISK_COLORS: Record<string, string> = {
  LOW: "#209b47",
  MEDIUM: "#d97706",
  HIGH: "#c53030",
  CRITICAL: "#b91c1c",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#042126",
  borderColor: "#005f68",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#ffffff",
};

const TOOLTIP_ITEM_STYLE = {
  color: "#acf2e5",
  fontWeight: 600,
};

export default function DashboardCharts({
  claimsTrend,
  signalDistribution,
  exposureByCategory,
  riskDistribution,
  topProviders,
}: DashboardChartsProps) {
  return (
    <div className="space-y-8">
      {/* Row 1: 2 Spacious Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Provider Risk Distribution */}
        <div className="nexus-glass-card rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#005f68]">
              Provider Risk Distribution
            </h3>
            <p className="text-xs text-[#042126]/70 mt-0.5">
              500 synthetic providers segmented by composite FWA score
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(4, 33, 38, 0.08)"
                />
                <XAxis dataKey="level" stroke="#042126" fontSize={11} />
                <YAxis stroke="#042126" fontSize={11} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {riskDistribution.map((entry) => (
                    <Cell
                      key={entry.level}
                      fill={RISK_COLORS[entry.level] || "#209b47"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Claims & Alert Volume Trend */}
        <div className="nexus-glass-card rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#005f68]">
              Synthetic Claims &amp; Alert Trend
            </h3>
            <p className="text-xs text-[#042126]/70 mt-0.5">
              Monthly ingested claim volume vs. correlated FWA alerts
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={claimsTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(4, 33, 38, 0.08)"
                />
                <XAxis dataKey="month" stroke="#042126" fontSize={11} />
                <YAxis stroke="#042126" fontSize={11} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="claims"
                  name="Total Claims"
                  stroke="#209b47"
                  fill="#acf2e5"
                  fillOpacity={0.55}
                />
                <Area
                  type="monotone"
                  dataKey="alerts"
                  name="Suspicious Alerts"
                  stroke="#005f68"
                  fill="#005f68"
                  fillOpacity={0.22}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: FWA Signal Distribution + Exposure by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="nexus-glass-card rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#005f68]">
              FWA Signal Distribution
            </h3>
            <p className="text-xs text-[#042126]/70 mt-0.5">
              Frequency of independent rule, graph, and temporal signals across SIU cases
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={signalDistribution}
                layout="vertical"
                margin={{ left: 32, right: 16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(4, 33, 38, 0.08)"
                />
                <XAxis type="number" stroke="#042126" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="signal"
                  stroke="#042126"
                  fontSize={10}
                  width={120}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Bar dataKey="count" fill="#209b47" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#005f68]">
              Potential Exposure by Risk Category
            </h3>
            <p className="text-xs text-[#042126]/70 mt-0.5">
              Synthetic estimated financial exposure (INR) segmented by risk tier
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exposureByCategory}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(4, 33, 38, 0.08)"
                />
                <XAxis dataKey="category" stroke="#042126" fontSize={11} />
                <YAxis
                  stroke="#042126"
                  fontSize={10}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatINR(value),
                    "Synthetic Exposure",
                  ]}
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Bar dataKey="exposure" radius={[5, 5, 0, 0]}>
                  {exposureByCategory.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={RISK_COLORS[entry.category] || "#005f68"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Temporal Risk Trend + Provider Risk Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="nexus-glass-card rounded-2xl p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#005f68]">
              Temporal Risk &amp; Billing Velocity Trend
            </h3>
            <p className="text-xs text-[#042126]/70 mt-0.5">
              Average claim risk index across synthetic observation months
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={claimsTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(4, 33, 38, 0.08)"
                />
                <XAxis dataKey="month" stroke="#042126" fontSize={11} />
                <YAxis stroke="#042126" fontSize={11} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                />
                <Line
                  type="monotone"
                  dataKey="avg_risk"
                  name="Mean Risk Score"
                  stroke="#005f68"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#209b47" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nexus-glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#005f68]">
                  Provider Risk Leaderboard
                </h3>
                <p className="text-xs text-[#042126]/70 mt-0.5">
                  Top synthetic providers ranked by composite FWA score
                </p>
              </div>
              <Link
                href="/providers"
                className="text-xs text-[#15497e] hover:text-[#209b47] hover:underline font-semibold"
              >
                View All 500 →
              </Link>
            </div>

            <div className="space-y-2.5">
              {topProviders.slice(0, 5).map((p) => (
                <Link
                  key={p.provider_id}
                  href={`/providers/${p.provider_id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f2fcff] border border-[#042126]/10 hover:bg-[#acf2e5]/20 hover:border-[#209b47] transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#042126]">
                      {p.provider_id} • {p.provider_name}
                    </div>
                    <div className="text-[11px] text-[#042126]/70">
                      {p.specialty} • {p.claim_volume} claims •{" "}
                      {p.fwa_signals.length} signals
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${getRiskBadgeClasses(
                      p.risk_level
                    )}`}
                  >
                    {p.risk_score}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

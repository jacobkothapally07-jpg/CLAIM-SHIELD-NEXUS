"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Cpu, GitBranch, ShieldCheck } from "lucide-react";
import {
  getDashboardSummary,
  getRiskDistribution,
  getTopProviders,
} from "../../services/api";
import DashboardCharts from "../../components/charts/DashboardCharts";
import {
  ClaimsTrendItem,
  SignalDistributionItem,
  ExposureByCategoryItem,
  ProviderProfile,
} from "../../types";

export default function AnalyticsPage() {
  const [claimsTrend, setClaimsTrend] = useState<ClaimsTrendItem[]>([]);
  const [signalDist, setSignalDist] = useState<SignalDistributionItem[]>([]);
  const [exposureByCat, setExposureByCat] = useState<ExposureByCategoryItem[]>([]);
  const [riskDist, setRiskDist] = useState<
    { level: string; range: string; count: number }[]
  >([]);
  const [topProviders, setTopProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [summary, rDist, tProvs] = await Promise.all([
          getDashboardSummary(),
          getRiskDistribution(),
          getTopProviders(12),
        ]);
        setClaimsTrend(summary.claims_trend);
        setSignalDist(summary.signal_distribution);
        setExposureByCat(summary.exposure_by_category);
        setRiskDist(rDist.provider_distribution);
        setTopProviders(tProvs.providers);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[#209b47] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#209b47]" />
          Multi-Engine FWA Detection Analytics &amp; Model Telemetry
        </h2>
        <p className="text-xs text-[#042126]/75 mt-0.5">
          Deep-dive performance across deterministic rules (40%), Scikit-learn Isolation Forest (30%), NetworkX graph topology (20%), and temporal velocity (10%).
        </p>
      </div>

      {/* 4 Complementary Detection Approaches Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexus-glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#b91c1c] mb-1">
            <span>1. Rule Engine (40% Wt)</span>
            <ShieldCheck className="w-4 h-4 text-[#b91c1c]" />
          </div>
          <p className="text-xs text-[#042126]/75">
            10 modular deterministic detectors: duplicate billing (+20), impossible timing (+25), utilization (+15), upcoding, unbundling, phantom, abnormal amount.
          </p>
        </div>

        <div className="nexus-glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#b45309] mb-1">
            <span>2. ML Isolation Forest (30% Wt)</span>
            <Cpu className="w-4 h-4 text-[#d97706]" />
          </div>
          <p className="text-xs text-[#042126]/75">
            Unsupervised Scikit-learn IsolationForest (150 estimators) trained on 10 provider/claim features with z-score feature attribution.
          </p>
        </div>

        <div className="nexus-glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#005f68] mb-1">
            <span>3. NetworkX Graph (20% Wt)</span>
            <GitBranch className="w-4 h-4 text-[#005f68]" />
          </div>
          <p className="text-xs text-[#042126]/75">
            Degree centrality, PageRank, reciprocal referral loops, and multi-facility shared member cliques across 1,000+ referrals.
          </p>
        </div>

        <div className="nexus-glass-card rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#209b47] mb-1">
            <span>4. Temporal Velocity (10% Wt)</span>
            <BarChart3 className="w-4 h-4 text-[#209b47]" />
          </div>
          <p className="text-xs text-[#042126]/75">
            Detects sudden monthly billing acceleration (&gt;4x baseline), rapid &lt;15 min claim bursts, and impossible cross-region travel sequences.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 bg-white rounded-xl border border-[#042126]/10 animate-pulse" />
      ) : (
        <DashboardCharts
          claimsTrend={claimsTrend}
          signalDistribution={signalDist}
          exposureByCategory={exposureByCat}
          riskDistribution={riskDist}
          topProviders={topProviders}
        />
      )}
    </div>
  );
}

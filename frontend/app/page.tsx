"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  Flame,
  IndianRupee,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ListChecks,
  BarChart3,
  Cpu,
  Activity,
} from "lucide-react";
import {
  getDashboardSummary,
  getRiskDistribution,
  getTopProviders,
} from "../services/api";
import {
  DashboardMetrics,
  ClaimsTrendItem,
  SignalDistributionItem,
  ExposureByCategoryItem,
  InvestigationCase,
  ProviderProfile,
} from "../types";
import {
  formatINR,
  formatSignalName,
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from "../lib/format";
import DashboardCharts from "../components/charts/DashboardCharts";
import InteractiveClaimAnalyzer from "../components/dashboard/InteractiveClaimAnalyzer";
import {
  MagneticButton,
  TiltCard,
  AnimatedCounter,
} from "../components/common/InteractivePrimitives";

const ClaimShield3DHero = dynamic(
  () => import("../components/dashboard/ClaimShield3DHero"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-2xl border border-[#042126]/15 bg-[#042126] animate-pulse flex items-center justify-center text-xs font-mono text-[#acf2e5]">
        INITIALIZING CLINICAL TELEMETRY ENGINE...
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [claimsTrend, setClaimsTrend] = useState<ClaimsTrendItem[]>([]);
  const [signalDist, setSignalDist] = useState<SignalDistributionItem[]>([]);
  const [exposureByCat, setExposureByCat] = useState<ExposureByCategoryItem[]>(
    []
  );
  const [priorityQueue, setPriorityQueue] = useState<InvestigationCase[]>([]);
  const [riskDist, setRiskDist] = useState<
    { level: string; range: string; count: number }[]
  >([]);
  const [topProviders, setTopProviders] = useState<ProviderProfile[]>([]);
  const [activeStage, setActiveStage] = useState(2);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "queue" | "lab" | "analytics"
  >("queue");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [summary, rDist, tProvs] = await Promise.all([
          getDashboardSummary(),
          getRiskDistribution(),
          getTopProviders(10),
        ]);
        setMetrics(summary.metrics);
        setClaimsTrend(summary.claims_trend);
        setSignalDist(summary.signal_distribution);
        setExposureByCat(summary.exposure_by_category);
        setPriorityQueue(summary.priority_queue);
        setRiskDist(rDist.provider_distribution);
        setTopProviders(tProvs.providers);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-72 bg-white rounded-2xl border border-[#042126]/10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-2xl border border-[#042126]/10"
            />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-[#042126]/10" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 rounded-2xl bg-[#fee2e2] border border-[#b91c1c]/30 text-[#b91c1c]">
        <div className="font-bold mb-1">
          Unable to connect to ClaimShield Nexus API
        </div>
        <div className="text-xs">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* SECTION 1: CLEAN EXECUTIVE HERO + 3D PIPELINE */}
      <section className="nexus-glass-card rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          {/* Left Hero Copy & CTAs (6 cols) */}
          <div className="xl:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#acf2e5] text-[#042126] text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#209b47]" />
              <span>ACENTRA HEALTH SIU INTELLIGENCE PLATFORM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#209b47] leading-[1.15]">
              CLAIMSHIELD <span className="text-[#005f68]">NEXUS</span>
            </h1>

            <p className="text-base font-semibold text-[#042126]">
              &ldquo;From suspicious claims to evidence-backed investigations.&rdquo;
            </p>

            <p className="text-xs sm:text-sm text-[#042126]/80 leading-relaxed max-w-xl">
              Distilling{" "}
              <strong className="text-[#042126]">
                {metrics.claims_analyzed.toLocaleString()} synthetic claims
              </strong>{" "}
              into{" "}
              <strong className="text-[#b91c1c]">
                {metrics.total_cases} evidence-backed SIU cases
              </strong>{" "}
              using a 4-engine ensemble: Deterministic Rules (40%), Isolation Forest ML (30%), NetworkX Graph Topology (20%), and Temporal Velocity (10%).
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <MagneticButton
                onClick={() => {
                  setActiveWorkspaceTab("lab");
                  document
                    .getElementById("command-workspace")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-2.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold text-xs sm:text-sm flex items-center gap-2"
              >
                <span>Launch Claim Verification Lab</span>
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>

              <Link
                href="/cases/CASE-1842"
                className="px-6 py-2.5 rounded-full bg-white hover:bg-[#042126] text-[#042126] hover:text-white border-[1.5px] border-[#042126] font-semibold text-xs sm:text-sm transition-colors duration-150 flex items-center gap-2"
              >
                <span>Inspect Flagship Case (CASE-1842)</span>
              </Link>
            </div>
          </div>

          {/* Right Interactive 3D Pipeline (6 cols) */}
          <div className="xl:col-span-6">
            <ClaimShield3DHero
              activeStage={activeStage}
              onSelectStage={setActiveStage}
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 SPACIOUS EXECUTIVE KPI CARDS (UNCLUTTERED) */}
      <section id="how-it-works" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TiltCard className="nexus-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#005f68] font-semibold mb-2">
            <span>1. CLAIMS ANALYZED</span>
            <FileText className="w-4 h-4 text-[#209b47]" />
          </div>
          <div className="text-3xl font-bold text-[#042126] font-mono tabular-nums">
            <AnimatedCounter value={metrics.claims_analyzed} />
          </div>
          <div className="text-xs text-[#042126]/70 mt-1.5 flex items-center justify-between">
            <span>500 Providers • 1,000 Members</span>
            <span className="font-mono text-[11px] text-[#209b47] font-semibold">
              Seed=42
            </span>
          </div>
        </TiltCard>

        <TiltCard className="nexus-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#b45309] font-semibold mb-2">
            <span>2. CORRELATED FWA ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="text-3xl font-bold text-[#b45309] font-mono tabular-nums">
            <AnimatedCounter value={metrics.suspicious_alerts} />
          </div>
          <div className="text-xs text-[#042126]/70 mt-1.5">
            Across 10 independent FWA detectors
          </div>
        </TiltCard>

        <TiltCard className="nexus-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#b91c1c] font-semibold mb-2">
            <span>3. PRIORITIZED SIU CASES</span>
            <Flame className="w-4 h-4 text-[#b91c1c]" />
          </div>
          <div className="text-3xl font-bold text-[#b91c1c] font-mono tabular-nums">
            <AnimatedCounter value={metrics.total_cases} />
          </div>
          <div className="text-xs text-[#042126]/70 mt-1.5">
            {metrics.critical_cases} Critical (CASE-1842) •{" "}
            {metrics.high_risk_cases} High Risk
          </div>
        </TiltCard>

        <TiltCard className="nexus-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#209b47] font-semibold mb-2">
            <span>4. POTENTIAL EXPOSURE</span>
            <IndianRupee className="w-4 h-4 text-[#209b47]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#209b47] font-mono truncate tabular-nums">
            {formatINR(metrics.potential_exposure)}
          </div>
          <div className="text-xs text-[#042126]/70 mt-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#209b47]" />
            <span>100% Recall on 55 Planted Scenarios</span>
          </div>
        </TiltCard>
      </section>

      {/* SECTION 3: UNIFIED 3-TAB COMMAND WORKSPACE (NO VERTICAL CLUTTER) */}
      <section id="command-workspace" className="space-y-5">
        <div
          id="risk-engine-lab"
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-[#042126]/10 shadow-[0_2px_10px_rgba(4,33,38,0.03)]"
        >
          <div className="inline-flex flex-wrap p-1 rounded-xl bg-[#f2fcff] border border-[#042126]/10 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab("queue")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                activeWorkspaceTab === "queue"
                  ? "bg-[#209b47] text-white"
                  : "text-[#042126] hover:bg-[#acf2e5]/40"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>1. SIU Priority Queue (Top 8 Cases)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab("lab")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                activeWorkspaceTab === "lab"
                  ? "bg-[#209b47] text-white"
                  : "text-[#042126] hover:bg-[#acf2e5]/40"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>2. Interactive Claim Verification Lab</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                activeWorkspaceTab === "analytics"
                  ? "bg-[#209b47] text-white"
                  : "text-[#042126] hover:bg-[#acf2e5]/40"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>3. Executive Risk &amp; Exposure Charts</span>
            </button>
          </div>

          <Link
            href="/queue"
            className="text-xs font-semibold text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1.5 px-2"
          >
            <span>View Full 55-Case SIU Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* TAB 1: CLEAN SIU PRIORITY QUEUE */}
        {activeWorkspaceTab === "queue" && (
          <div className="nexus-glass-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#042126]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#f2fcff]/60">
              <div>
                <h3 className="text-base font-semibold text-[#209b47]">
                  SIU Priority Investigation Queue
                </h3>
                <p className="text-xs text-[#042126]/75 mt-0.5">
                  Ranked by composite risk score, financial exposure, and multi-signal evidence strength
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#acf2e5] text-[#042126]">
                SHOWING TOP 8 OF {metrics.total_cases} CASES
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#042126] text-white text-[11px] font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5">Case ID</th>
                    <th className="py-3.5 px-5">Provider</th>
                    <th className="py-3.5 px-5">Risk Score</th>
                    <th className="py-3.5 px-5">Risk Level</th>
                    <th className="py-3.5 px-5">Potential Exposure</th>
                    <th className="py-3.5 px-5">Correlated Signals</th>
                    <th className="py-3.5 px-5">Evidence</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#042126]/10 text-xs text-[#042126]">
                  {priorityQueue.slice(0, 8).map((c) => (
                    <tr
                      key={c.case_id}
                      className={`border-l-[3px] border-l-transparent hover:border-l-[#209b47] hover:bg-[#acf2e5]/15 transition-colors ${
                        c.case_id === "CASE-1842" ? "bg-[#acf2e5]/25" : ""
                      }`}
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-[#042126]">
                        <Link
                          href={`/cases/${c.case_id}`}
                          className="text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-2"
                        >
                          <span>{c.case_id}</span>
                          {c.case_id === "CASE-1842" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] font-bold">
                              FLAGSHIP
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#042126]">
                          {c.provider_id} • {c.provider_name}
                        </div>
                        <div className="text-[11px] text-[#042126]/65">
                          {c.specialty} • {c.location}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-[#042126] tabular-nums">
                        {c.risk_score} / 100
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${getRiskBadgeClasses(
                            c.risk_level
                          )}`}
                        >
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-semibold text-[#209b47] tabular-nums">
                        {formatINR(c.potential_exposure)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.primary_signals.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#acf2e5] text-[#042126]"
                            >
                              {formatSignalName(s)}
                            </span>
                          ))}
                          {c.primary_signals.length > 2 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#005f68] text-white">
                              +{c.primary_signals.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1.5 text-[#042126] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#209b47]" />
                          {c.evidence_strength}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded border ${getStatusBadgeClasses(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/cases/${c.case_id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold transition-colors"
                        >
                          <span>Investigate</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CLAIM VERIFICATION LAB */}
        {activeWorkspaceTab === "lab" && (
          <InteractiveClaimAnalyzer cases={priorityQueue} />
        )}

        {/* TAB 3: EXECUTIVE RISK & EXPOSURE CHARTS */}
        {activeWorkspaceTab === "analytics" && (
          <DashboardCharts
            claimsTrend={claimsTrend}
            signalDistribution={signalDist}
            exposureByCategory={exposureByCat}
            riskDistribution={riskDist}
            topProviders={topProviders}
          />
        )}
      </section>
    </div>
  );
}

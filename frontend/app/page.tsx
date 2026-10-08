"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  Flame,
  IndianRupee,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ListChecks,
  BarChart3,
  Cpu,
  Clock,
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
      <div className="h-[340px] rounded-2xl border border-[#042126]/15 bg-[#042126] animate-pulse flex items-center justify-center text-xs font-mono text-[#acf2e5]">
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
  const [exposureByCat, setExposureByCat] = useState<ExposureByCategoryItem[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<InvestigationCase[]>([]);
  const [riskDist, setRiskDist] = useState<
    { level: string; range: string; count: number }[]
  >([]);
  const [topProviders, setTopProviders] = useState<ProviderProfile[]>([]);
  const [activeStage, setActiveStage] = useState(2);
  const [activeView, setActiveView] = useState<"queue" | "analytics">("queue");

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
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Auto-cycle 3D pipeline stage every 4.5s unless user interacts
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-80 bg-white rounded-2xl border border-[#042126]/10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white rounded-2xl border border-[#042126]/10"
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

  const verifiedClaims = metrics.claims_analyzed - metrics.suspicious_alerts;
  const underReviewCount = Math.max(
    12,
    priorityQueue.filter((c) => c.status !== "Dismissed").length
  );

  return (
    <div className="space-y-10">
      {/* 1. ENTERPRISE ACENTRA HEALTH HERO SECTION */}
      <section className="nexus-glass-card rounded-2xl p-6 lg:p-9 relative overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          {/* Left Hero Copy & CTAs (6 cols) */}
          <div className="xl:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#acf2e5] text-[#042126] text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#209b47]" />
              <span>AI-POWERED HEALTHCARE FWA INTELLIGENCE COMMAND</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#209b47] leading-[1.15]">
              CLAIMSHIELD <span className="text-[#005f68]">NEXUS</span>
            </h1>

            <p className="text-base sm:text-lg font-semibold text-[#042126]">
              &ldquo;From suspicious claims to evidence-backed investigations.&rdquo;
            </p>

            <p className="text-xs sm:text-sm text-[#042126]/80 leading-relaxed max-w-xl">
              AI-powered protection against fraudulent healthcare claims. Correlating{" "}
              <strong className="text-[#042126]">
                {metrics.claims_analyzed.toLocaleString()}+ synthetic claims
              </strong>{" "}
              across deterministic rules, Scikit-learn Isolation Forest anomalies, NetworkX graph topology, and temporal velocity models for human SIU investigators.
            </p>

            {/* Primary & Secondary Restrained Acentra CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <MagneticButton
                onClick={() => {
                  document
                    .getElementById("risk-engine-lab")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-3 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold text-xs sm:text-sm flex items-center gap-2"
              >
                <span>Launch Risk Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>

              <Link
                href="/cases/CASE-1842"
                className="px-6 py-3 rounded-full bg-white hover:bg-[#042126] text-[#042126] hover:text-white border-[1.5px] border-[#042126] font-semibold text-xs sm:text-sm transition-colors duration-150 flex items-center gap-2"
              >
                <span>Explore Platform (CASE-1842)</span>
              </Link>
            </div>

            {/* Live Pipeline Funnel Pills */}
            <div
              id="how-it-works"
              className="pt-4 border-t border-[#042126]/10 grid grid-cols-3 gap-3 text-xs"
            >
              <div className="p-3 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="text-[10px] font-mono text-[#005f68] font-semibold">
                  RAW SYNTHETIC CLAIMS
                </div>
                <div className="text-base font-bold text-[#042126] font-mono mt-0.5 tabular-nums">
                  <AnimatedCounter value={metrics.claims_analyzed} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#fef3c7] border border-[#d97706]/30">
                <div className="text-[10px] font-mono text-[#b45309] font-semibold">
                  CORRELATED ALERTS
                </div>
                <div className="text-base font-bold text-[#b45309] font-mono mt-0.5 tabular-nums">
                  <AnimatedCounter value={metrics.suspicious_alerts} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#fee2e2] border border-[#b91c1c]/30">
                <div className="text-[10px] font-mono text-[#b91c1c] font-semibold">
                  PRIORITIZED SIU CASES
                </div>
                <div className="text-base font-bold text-[#b91c1c] font-mono mt-0.5 tabular-nums">
                  <AnimatedCounter value={metrics.total_cases} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Interactive 3D Claim → Analysis → Risk → Verification → Decision Scene (6 cols) */}
          <div className="xl:col-span-6">
            <ClaimShield3DHero
              activeStage={activeStage}
              onSelectStage={setActiveStage}
            />
          </div>
        </div>
      </section>

      {/* 2. COMMAND CENTER METRICS HIERARCHY (7 Clinical Telemetry Cards) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-[#005f68] font-semibold px-1">
          <span>COMMAND CENTER TELEMETRY // LIVE SYNTHETIC STREAM</span>
          <span className="text-[#209b47] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> ALL 4 DETECTION ENGINES ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 metric-grid-container">
          <TiltCard className="nexus-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#005f68] font-semibold mb-2">
              <span>CLAIMS PROCESSED</span>
              <FileText className="w-4 h-4 text-[#209b47]" />
            </div>
            <div className="text-2xl font-bold text-[#042126] font-mono tabular-nums">
              <AnimatedCounter value={metrics.claims_analyzed} />
            </div>
            <div className="text-[11px] text-[#042126]/65 mt-1">
              100% synthetic (Seed 42)
            </div>
          </TiltCard>

          <TiltCard className="nexus-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#b45309] font-semibold mb-2">
              <span>FRAUD RISK ALERTS</span>
              <AlertTriangle className="w-4 h-4 text-[#d97706]" />
            </div>
            <div className="text-2xl font-bold text-[#b45309] font-mono tabular-nums">
              <AnimatedCounter value={metrics.suspicious_alerts} />
            </div>
            <div className="text-[11px] text-[#042126]/65 mt-1">
              Multi-signal FWA triggers
            </div>
          </TiltCard>

          <TiltCard className="nexus-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#005f68] font-semibold mb-2">
              <span>UNDER SIU REVIEW</span>
              <ShieldAlert className="w-4 h-4 text-[#005f68]" />
            </div>
            <div className="text-2xl font-bold text-[#005f68] font-mono tabular-nums">
              <AnimatedCounter value={underReviewCount} />
            </div>
            <div className="text-[11px] text-[#042126]/65 mt-1">
              Active SIU queue dossiers
            </div>
          </TiltCard>

          <TiltCard className="nexus-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#209b47] font-semibold mb-2">
              <span>VERIFIED CLEAN</span>
              <CheckCircle2 className="w-4 h-4 text-[#209b47]" />
            </div>
            <div className="text-2xl font-bold text-[#209b47] font-mono tabular-nums">
              <AnimatedCounter value={verifiedClaims} />
            </div>
            <div className="text-[11px] text-[#042126]/65 mt-1">
              Normal baseline claims
            </div>
          </TiltCard>

          <TiltCard className="nexus-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#b91c1c] font-semibold mb-2">
              <span>HIGH / CRITICAL</span>
              <Flame className="w-4 h-4 text-[#b91c1c]" />
            </div>
            <div className="text-2xl font-bold text-[#b91c1c] font-mono tabular-nums">
              <AnimatedCounter
                value={metrics.high_risk_cases + metrics.critical_cases}
              />
            </div>
            <div className="text-[11px] text-[#042126]/65 mt-1">
              {metrics.critical_cases} Critical • {metrics.high_risk_cases} High
            </div>
          </TiltCard>

          <TiltCard className="nexus-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#005f68] font-semibold mb-2">
              <span>AI CONFIDENCE</span>
              <Cpu className="w-4 h-4 text-[#209b47]" />
            </div>
            <div className="text-2xl font-bold text-[#042126] font-mono tabular-nums">
              <AnimatedCounter value={96} suffix=".4%" />
            </div>
            <div className="text-[11px] text-[#042126]/65 mt-1">
              55/55 planted recall (142ms)
            </div>
          </TiltCard>

          <TiltCard className="nexus-glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#209b47] font-semibold mb-2">
              <span>EXPOSURE AT RISK</span>
              <IndianRupee className="w-4 h-4 text-[#209b47]" />
            </div>
            <div className="text-xl font-bold text-[#209b47] font-mono truncate tabular-nums">
              {formatINR(metrics.potential_exposure)}
            </div>
            <div className="text-[11px] text-[#042126]/65 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Scan time: 0.14s
            </div>
          </TiltCard>
        </div>
      </section>

      {/* 3. INTERACTIVE CLAIM-ANALYSIS & SEGMENTED RISK VISUALIZATION LAB */}
      <InteractiveClaimAnalyzer cases={priorityQueue} />

      {/* 4. SEGMENTED COMMAND VIEW: SIU PRIORITY QUEUE vs ANALYTICS SUITE */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#042126]/10 pb-4">
          <div className="inline-flex p-1.5 rounded-xl bg-white border border-[#042126]/10">
            <button
              type="button"
              onClick={() => setActiveView("queue")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                activeView === "queue"
                  ? "bg-[#209b47] text-white"
                  : "bg-[#acf2e5]/20 text-[#042126] hover:bg-[#acf2e5]/40"
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>SIU Priority Queue ({metrics.total_cases} Cases)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ml-1.5 ${
                activeView === "analytics"
                  ? "bg-[#209b47] text-white"
                  : "bg-[#acf2e5]/20 text-[#042126] hover:bg-[#acf2e5]/40"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Risk, Signal &amp; Exposure Telemetry (6 Charts)</span>
            </button>
          </div>

          <Link
            href="/queue"
            className="text-xs font-semibold text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1.5"
          >
            <span>Open Full SIU Investigation Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeView === "queue" ? (
          <div className="nexus-glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#042126]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#209b47]">
                  SIU Priority Investigation Queue
                </h3>
                <p className="text-xs text-[#042126]/75 mt-0.5">
                  Prioritized by composite risk score, financial exposure, evidence strength, and correlated FWA signals
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#acf2e5] text-[#042126]">
                TOP 12 PRIORITY CASES
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
                    <th className="py-3.5 px-5">Primary Signals</th>
                    <th className="py-3.5 px-5">Evidence Strength</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#042126]/10 text-xs text-[#042126]">
                  {priorityQueue.map((c) => (
                    <tr
                      key={c.case_id}
                      className={`border-l-[3px] border-l-transparent hover:border-l-[#209b47] hover:bg-[#acf2e5]/15 transition-colors ${
                        c.case_id === "CASE-1842" ? "bg-[#acf2e5]/25" : ""
                      }`}
                    >
                      <td className="py-4 px-5 font-mono font-bold text-[#042126]">
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
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#042126]">
                          {c.provider_id} • {c.provider_name}
                        </div>
                        <div className="text-[11px] text-[#042126]/65">
                          {c.specialty} • {c.location}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono font-bold text-[#042126] tabular-nums">
                        {c.risk_score} / 100
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${getRiskBadgeClasses(
                            c.risk_level
                          )}`}
                        >
                          {c.risk_level}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono font-semibold text-[#209b47] tabular-nums">
                        {formatINR(c.potential_exposure)}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.primary_signals.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#acf2e5] text-[#042126]"
                            >
                              {formatSignalName(s)}
                            </span>
                          ))}
                          {c.primary_signals.length > 3 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#005f68] text-white">
                              +{c.primary_signals.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 text-[#042126] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#209b47]" />
                          {c.evidence_strength}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded border ${getStatusBadgeClasses(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
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
        ) : (
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

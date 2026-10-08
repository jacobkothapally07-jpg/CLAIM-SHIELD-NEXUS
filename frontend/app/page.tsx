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
  Network,
  UserCheck,
  ChevronDown,
  ChevronUp,
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
        INITIALIZING MULTI-SIGNAL DETECTION TELEMETRY...
      </div>
    ),
  }
);

const DETECTION_PIPELINE_STAGES = [
  {
    id: "claim",
    step: "01",
    title: "CLAIM",
    weight: "INPUT",
    summary:
      "Receives healthcare claim submissions including provider, member, facility, procedure code, billed amount and encounter timestamp.",
    technical:
      "Processes 10,000+ synthetic claims across 500 providers, 1,000 members and 100 facilities.",
  },
  {
    id: "rules",
    step: "02",
    title: "RULE ENGINE",
    weight: "40%",
    summary: "Checks claims against configurable fraud and policy rules.",
    technical:
      "Evaluates 10 deterministic policy detectors: duplicate billing (+20), impossible timing (+25), excessive utilization (+15), abnormal billing (+15), upcoding (+15), unbundling (+15) and phantom service (+18).",
  },
  {
    id: "isolation_forest",
    step: "03",
    title: "ISOLATION FOREST",
    weight: "30%",
    summary: "Identifies unusual claim patterns and statistical outliers.",
    technical:
      "Unsupervised Isolation Forest anomaly detection model scoring claim and provider behavioral features against specialty peers.",
  },
  {
    id: "network",
    step: "04",
    title: "NETWORK INTELLIGENCE",
    weight: "20%",
    summary:
      "Detects suspicious relationships between providers, facilities and members.",
    technical:
      "NetworkX graph topology analysis identifying reciprocal referral rings, shared member cliques and high-density facility hubs across 1,216+ referral relationships.",
  },
  {
    id: "temporal",
    step: "05",
    title: "TEMPORAL ANALYSIS",
    weight: "10%",
    summary: "Identifies unusual timing, frequency and claim velocity.",
    technical:
      "Detects claim volume acceleration (>4x provider baseline), rapid submission bursts and impossible cross-region encounter intervals (<1 hour).",
  },
  {
    id: "composite",
    step: "06",
    title: "COMPOSITE RISK",
    weight: "0–100",
    summary: "Combines evidence signals into a normalized risk score.",
    technical:
      "Weighted score = 40% Rule Engine + 30% Isolation Forest + 20% Network Intelligence + 10% Temporal Analysis. Categorized into Low (0–30), Medium (31–60), High (61–80) and Critical (81–100).",
  },
  {
    id: "siu",
    step: "07",
    title: "SIU INVESTIGATION",
    weight: "QUEUE",
    summary: "Prioritizes cases for human investigation.",
    technical:
      "Ranks suspicious cases in the SIU Priority Queue by composite risk score, financial exposure and correlated evidence strength.",
  },
  {
    id: "decision",
    step: "08",
    title: "HUMAN DECISION",
    weight: "FINAL",
    summary: "Investigators review evidence and determine the next action.",
    technical:
      "Human-in-the-loop governance: ClaimShield recommends investigation and presents evidence, while the SIU investigator records the final decision (Escalate, Request Documentation, Monitor or Clear).",
  },
];

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
  const [activeStage, setActiveStage] = useState(1);
  const [selectedPipelineIdx, setSelectedPipelineIdx] = useState(1);
  const [showPipelineTechDetails, setShowPipelineTechDetails] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "queue" | "lab" | "analytics"
  >("queue");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
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
          err instanceof Error ? err.message : "Failed to load dashboard data"
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
          Unable to load ClaimShield Nexus synthetic dataset
        </div>
        <div className="text-xs mb-3">{error}</div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-full bg-[#b91c1c] text-white text-xs font-semibold"
        >
          Retry Loading Dataset
        </button>
      </div>
    );
  }

  const activePipelineStage =
    DETECTION_PIPELINE_STAGES[selectedPipelineIdx] ||
    DETECTION_PIPELINE_STAGES[1];

  return (
    <div className="space-y-7">
      {/* SECTION 1: EXECUTIVE PRODUCT STATEMENT + COMPACT SCALE STRIP + 3D PIPELINE */}
      <section className="nexus-glass-card rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          {/* Left Hero Copy & CTAs (6 cols) */}
          <div className="xl:col-span-6 space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#acf2e5] text-[#042126] text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#209b47]" />
                <span>INVESTIGATION INTELLIGENCE PLATFORM</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f2fcff] text-[#005f68] border border-[#042126]/15 text-[11px] font-mono font-semibold">
                DEMO • SYNTHETIC DATA
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#209b47] leading-[1.15]">
                CLAIMSHIELD <span className="text-[#005f68]">NEXUS</span>
              </h1>
              <div className="text-xs font-mono font-semibold text-[#005f68] mt-1">
                &ldquo;Find the claims that don&apos;t add up.&rdquo;
              </div>
            </div>

            {/* Concise Product Statement (Requirement 1) */}
            <p className="text-base sm:text-lg font-semibold text-[#042126] leading-snug">
              Multi-signal investigation intelligence for suspicious healthcare claims.
            </p>

            {/* Supporting Text (Requirement 1) */}
            <p className="text-xs sm:text-sm text-[#042126]/80 leading-relaxed max-w-xl">
              ClaimShield Nexus combines claim rules, anomaly detection, network intelligence and temporal patterns to prioritize cases for SIU investigators — while keeping the final decision with a human investigator.
            </p>

            {/* Compact 6-Metric Dataset Strip (Requirement 1) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="px-3 py-2 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="text-sm font-mono font-bold text-[#042126]">
                  10,000+ Claims
                </div>
                <div className="text-[10px] text-[#042126]/70">
                  Analyzed claim stream
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="text-sm font-mono font-bold text-[#042126]">
                  500 Providers
                </div>
                <div className="text-[10px] text-[#042126]/70">
                  Specialty benchmarked
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="text-sm font-mono font-bold text-[#042126]">
                  1,000 Members
                </div>
                <div className="text-[10px] text-[#042126]/70">
                  Longitudinal histories
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="text-sm font-mono font-bold text-[#042126]">
                  100 Facilities
                </div>
                <div className="text-[10px] text-[#042126]/70">
                  Regional care centers
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="text-sm font-mono font-bold text-[#005f68]">
                  1,216+ Referrals
                </div>
                <div className="text-[10px] text-[#042126]/70">
                  Referral relationships
                </div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#acf2e5]/45 border border-[#209b47]/30">
                <div className="text-sm font-mono font-bold text-[#209b47]">
                  4 Detection Engines
                </div>
                <div className="text-[10px] text-[#042126]/75">
                  Explainable risk score
                </div>
              </div>
            </div>

            {/* Primary & Secondary Demo CTAs (Requirement 18 & 19) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
              <Link
                href="/cases/CASE-1842"
                className="px-5 py-2.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold text-xs sm:text-sm transition-all duration-150 hover:-translate-y-[1px] shadow-[0_3px_8px_rgba(4,33,38,0.1)] flex items-center gap-2"
              >
                <span>START DEMO: INVESTIGATE CASE-1842</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("open-risk-analysis-modal")
                  )
                }
                className="px-4 py-2.5 rounded-full bg-white hover:bg-[#042126] text-[#042126] hover:text-white border-[1.5px] border-[#042126] font-semibold text-xs transition-colors duration-150 flex items-center gap-2 cursor-pointer"
              >
                <span>ANALYZE CLAIM</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-case-diff-modal"))
                }
                className="px-4 py-2.5 rounded-full bg-[#042126] hover:bg-[#005f68] text-[#acf2e5] font-mono font-semibold text-xs transition-colors duration-150 flex items-center gap-2 cursor-pointer"
              >
                <span>COMPARE BILLING EVIDENCE</span>
              </button>
            </div>

            {/* Guided 2-Minute Judge Demo Path (Requirement 18) */}
            <div className="pt-2 border-t border-[#042126]/10 flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="font-bold text-[#005f68] mr-1">DEMO PATH:</span>
              <Link
                href="/cases/CASE-1842"
                className="px-2 py-0.5 rounded bg-[#209b47]/15 text-[#209b47] font-bold hover:underline"
              >
                1. High-Risk Case
              </Link>
              <span className="text-[#042126]/35">→</span>
              <Link
                href="/cases/CASE-1842#why-flagged"
                className="px-2 py-0.5 rounded bg-[#f2fcff] border border-[#042126]/10 text-[#042126] hover:border-[#209b47]"
              >
                2. Why Flagged?
              </Link>
              <span className="text-[#042126]/35">→</span>
              <Link
                href="/cases/CASE-1842#risk-breakdown"
                className="px-2 py-0.5 rounded bg-[#f2fcff] border border-[#042126]/10 text-[#042126] hover:border-[#209b47]"
              >
                3. Risk Breakdown
              </Link>
              <span className="text-[#042126]/35">→</span>
              <Link
                href="/network"
                className="px-2 py-0.5 rounded bg-[#f2fcff] border border-[#042126]/10 text-[#042126] hover:border-[#209b47]"
              >
                4. Network
              </Link>
              <span className="text-[#042126]/35">→</span>
              <Link
                href="/cases/CASE-1842#investigator-action"
                className="px-2 py-0.5 rounded bg-[#042126] text-[#acf2e5] font-semibold hover:bg-[#005f68]"
              >
                5. Investigator Action
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

      {/* SECTION 2: HOW CLAIMSHIELD WORKS (INTERACTIVE 8-STAGE DETECTION FLOW — REQUIREMENT 2) */}
      <section
        id="how-it-works"
        className="nexus-glass-card rounded-2xl p-5 lg:p-6 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#005f68] font-bold">
              HOW CLAIMSHIELD WORKS
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-[#209b47]">
              From Claim Submission to Explainable Risk Score &amp; Human SIU Decision
            </h2>
          </div>
          <span className="text-xs text-[#042126]/70 font-medium">
            Click any stage below to see how evidence signals combine into a normalized risk score
          </span>
        </div>

        {/* Interactive 8-Stage Pipeline Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {DETECTION_PIPELINE_STAGES.map((stage, idx) => {
            const isSelected = selectedPipelineIdx === idx;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedPipelineIdx(idx)}
                className={`text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#042126] text-white border-[#042126] shadow-[0_4px_12px_rgba(4,33,38,0.12)]"
                    : "bg-[#f2fcff] text-[#042126] border-[#042126]/10 hover:border-[#209b47]"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isSelected ? "text-[#acf2e5]" : "text-[#005f68]"
                    }`}
                  >
                    {stage.step}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-[#209b47] text-white"
                        : "bg-[#acf2e5] text-[#042126]"
                    }`}
                  >
                    {stage.weight}
                  </span>
                </div>
                <div className="text-[11px] font-bold leading-tight">
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Explanation Panel + Secondary Technical Details Toggle */}
        <div className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#042126] text-[#acf2e5]">
                {activePipelineStage.title} ({activePipelineStage.weight})
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#042126]">
                {activePipelineStage.summary}
              </span>
            </div>
            {showPipelineTechDetails && (
              <p className="text-xs text-[#042126]/80 font-mono bg-white p-3 rounded-lg border border-[#042126]/10 mt-2">
                {activePipelineStage.technical}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() =>
                setShowPipelineTechDetails(!showPipelineTechDetails)
              }
              className="text-xs font-semibold text-[#15497e] hover:text-[#209b47] flex items-center gap-1"
            >
              <span>
                {showPipelineTechDetails
                  ? "Hide Technical Details"
                  : "Technical Details"}
              </span>
              {showPipelineTechDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <Link
              href="/settings"
              className="text-xs font-semibold text-[#209b47] hover:underline flex items-center gap-1"
            >
              <span>Model &amp; Governance</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3: 4 EXECUTIVE KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TiltCard className="nexus-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#005f68] font-semibold mb-2">
            <span>1. SYNTHETIC CLAIMS ANALYZED</span>
            <FileText className="w-4 h-4 text-[#209b47]" />
          </div>
          <div className="text-3xl font-bold text-[#042126] font-mono tabular-nums">
            <AnimatedCounter value={metrics.claims_analyzed} />
          </div>
          <div className="text-xs text-[#042126]/70 mt-1.5 flex items-center justify-between">
            <span>500 Providers • 1,000 Members</span>
            <Link
              href="/claims"
              className="font-semibold text-[#15497e] hover:text-[#209b47] hover:underline"
            >
              Explore Claims →
            </Link>
          </div>
        </TiltCard>

        <TiltCard className="nexus-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#b45309] font-semibold mb-2">
            <span>2. MULTI-SIGNAL EVIDENCE ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-[#d97706]" />
          </div>
          <div className="text-3xl font-bold text-[#b45309] font-mono tabular-nums">
            <AnimatedCounter value={metrics.suspicious_alerts} />
          </div>
          <div className="text-xs text-[#042126]/70 mt-1.5">
            Correlated across 10 FWA policy &amp; anomaly detectors
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
          <div className="text-xs text-[#042126]/70 mt-1.5 flex items-center justify-between">
            <span>
              {metrics.critical_cases} Critical • {metrics.high_risk_cases} High Risk
            </span>
            <Link
              href="/queue"
              className="font-semibold text-[#15497e] hover:text-[#209b47] hover:underline"
            >
              Open Queue →
            </Link>
          </div>
        </TiltCard>

        <TiltCard className="nexus-glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#209b47] font-semibold mb-2">
            <span>4. FINANCIAL EXPOSURE AT RISK</span>
            <IndianRupee className="w-4 h-4 text-[#209b47]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#209b47] font-mono truncate tabular-nums">
            {formatINR(metrics.potential_exposure)}
          </div>
          <div className="text-xs text-[#042126]/70 mt-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#209b47]" />
            <span>Prioritized for human SIU verification</span>
          </div>
        </TiltCard>
      </section>

      {/* SECTION 4: PRIMARY DEMO WORKSPACE (SIU QUEUE FIRST — REQUIREMENT 3) */}
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
              <span>1. SIU Priority Queue (Primary Demo Entry)</span>
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
              <span>2. Interactive Claim Analysis &amp; What-If Lab</span>
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
              <span>3. Risk &amp; Exposure Analytics</span>
            </button>
          </div>

          <div className="flex items-center gap-4 px-2">
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-[#005f68] font-medium">
              <UserCheck className="w-3.5 h-3.5 text-[#209b47]" />
              Human-in-the-Loop SIU Workflow
            </span>
            <Link
              href="/queue"
              className="text-xs font-semibold text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1.5"
            >
              <span>View All {metrics.total_cases} SIU Cases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* TAB 1: SIU PRIORITY QUEUE (PRIMARY DEMO ENTRY — REQUIREMENT 3) */}
        {activeWorkspaceTab === "queue" && (
          <div className="nexus-glass-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#042126]/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-[#f2fcff]/60">
              <div>
                <h3 className="text-base font-semibold text-[#209b47]">
                  SIU Priority Investigation Queue
                </h3>
                <p className="text-xs text-[#042126]/80 mt-0.5 font-medium">
                  Prioritized investigations ranked by composite risk, financial exposure and evidence strength.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#d97706]/30">
                  ClaimShield prioritizes cases • Final decision remains with SIU investigator
                </span>
                <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#acf2e5] text-[#042126]">
                  TOP 8 OF {metrics.total_cases} CASES
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#042126] text-white text-[11px] font-mono uppercase tracking-wider">
                    <th className="py-3.5 px-5">Case ID</th>
                    <th className="py-3.5 px-5">Provider</th>
                    <th className="py-3.5 px-5">Risk Score</th>
                    <th className="py-3.5 px-5">Risk Level</th>
                    <th className="py-3.5 px-5">Financial Exposure</th>
                    <th className="py-3.5 px-5">Detected Signals</th>
                    <th className="py-3.5 px-5">Evidence</th>
                    <th className="py-3.5 px-5">SIU Status</th>
                    <th className="py-3.5 px-5 text-right">Investigation</th>
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
                        {c.case_id === "CASE-1842" ? (
                          <button
                            type="button"
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("open-case-diff-modal")
                              )
                            }
                            className="text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-2 cursor-pointer text-left"
                            title="Click to inspect CASE-1842 side-by-side billing diff"
                          >
                            <span>{c.case_id}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] font-bold">
                              FLAGSHIP • DIFF
                            </span>
                          </button>
                        ) : (
                          <Link
                            href={`/cases/${c.case_id}`}
                            className="text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-2"
                          >
                            <span>{c.case_id}</span>
                          </Link>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/providers/${c.provider_id}`}
                          className="font-semibold text-[#15497e] hover:text-[#209b47] hover:underline"
                        >
                          {c.provider_id} • {c.provider_name}
                        </Link>
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
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#042126] text-[#acf2e5]">
                            {c.primary_signals.length} signals
                          </span>
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
                          <span>Investigate Case</span>
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

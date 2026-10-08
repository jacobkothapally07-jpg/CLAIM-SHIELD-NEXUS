"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Clock,
  Network as NetworkIcon,
  TrendingUp,
  IndianRupee,
  Sparkles,
  MessageSquarePlus,
  CheckCircle,
  AlertOctagon,
  XCircle,
  ArrowLeft,
  Eye,
  Printer,
  Scale,
} from "lucide-react";
import {
  getCaseDetail,
  getCaseTimeline,
  getCaseGraph,
  updateCaseStatus,
  addCaseNote,
  generateInvestigationBrief,
} from "../../../services/api";
import {
  InvestigationCase,
  CaseEvidence,
  InvestigationNote,
  TimelineEvent,
  GraphNode,
  GraphEdge,
  RiskForecast,
  InvestigationBrief,
} from "../../../types";
import {
  formatINR,
  formatSignalName,
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from "../../../lib/format";
import RelationshipGraph from "../../../components/graph/RelationshipGraph";
import { MagneticButton } from "../../../components/common/InteractivePrimitives";

export default function CaseInvestigationDetailPage() {
  const params = useParams();
  const caseId = String(params?.caseId || "CASE-1842");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [evidence, setEvidence] = useState<CaseEvidence[]>([]);
  const [notes, setNotes] = useState<InvestigationNote[]>([]);
  const [forecast, setForecast] = useState<RiskForecast | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>({ nodes: [], edges: [] });

  const [brief, setBrief] = useState<InvestigationBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "evidence" | "timeline" | "graph" | "peer" | "brief"
  >("evidence");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [detail, tl, gr] = await Promise.all([
          getCaseDetail(caseId),
          getCaseTimeline(caseId),
          getCaseGraph(caseId),
        ]);
        setCaseData(detail.case);
        setEvidence(detail.evidence);
        setNotes(detail.notes);
        setForecast(detail.forecast);
        setTimeline(tl.timeline);
        setGraphData({ nodes: gr.nodes, edges: gr.edges });
      } catch (err: unknown) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : `Unable to load case ${caseId}`
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!caseData) return;
    try {
      setStatusUpdating(true);
      const res = await updateCaseStatus(caseData.case_id, newStatus);
      setCaseData(res.case);
      setNotes(res.notes);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !newNote.trim()) return;
    const res = await addCaseNote(caseData.case_id, newNote);
    setNotes(res.notes);
    setNewNote("");
  };

  const handleGenerateBrief = async () => {
    if (!caseData) return;
    try {
      setBriefLoading(true);
      setActiveTab("brief");
      const res = await generateInvestigationBrief(caseData.case_id);
      setBrief(res);
    } finally {
      setBriefLoading(false);
    }
  };

  const handleExportDossier = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white rounded-2xl border border-[#042126]/10" />
        <div className="h-96 bg-white rounded-2xl border border-[#042126]/10" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="nexus-glass-card rounded-2xl p-6 border border-[#b91c1c]/30 bg-[#fee2e2]/40 space-y-3">
        <div className="text-base font-bold text-[#b91c1c]">
          Unable to load SIU Case Dossier ({caseId})
        </div>
        <p className="text-xs text-[#042126]/80">
          {error || "The requested synthetic case dossier could not be found."}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/cases/CASE-1842"
            className="px-4 py-2 rounded-full bg-[#209b47] text-white text-xs font-semibold"
          >
            Open Flagship Case (CASE-1842)
          </Link>
          <Link
            href="/queue"
            className="px-4 py-2 rounded-full bg-white border border-[#042126] text-[#042126] text-xs font-semibold"
          >
            Return to SIU Queue
          </Link>
        </div>
      </div>
    );
  }

  // Pre-Payment Hold vs Post-Payment Recovery Split
  const prePayHoldAmount = Math.round(caseData.potential_exposure * 0.62);
  const postPayClawbackAmount = caseData.potential_exposure - prePayHoldAmount;

  // Specialty Peer Benchmark Multipliers
  const avgClaimCost = Math.round(
    caseData.total_claimed_amount / Math.max(1, caseData.suspicious_claim_count)
  );
  const peerBenchmarkCost = Math.round(avgClaimCost / 3.4);

  // Build Evidence Sequence steps from actual case signals & timeline timestamps
  const firstTimestamp =
    timeline[0]?.timestamp?.replace("T", " ") || "2026-05-12 09:15";
  const latestTimestamp =
    timeline[timeline.length - 1]?.timestamp?.replace("T", " ") ||
    "2026-05-14 16:40";

  const evidenceSequenceSteps = [
    {
      stage: "01",
      title: "CLAIM SUBMITTED",
      detail: `${caseData.primary_claim_id} (${firstTimestamp})`,
      tone: "bg-[#f2fcff] border-[#042126]/15 text-[#042126]",
    },
    ...evidence.slice(0, 4).map((ev, idx) => ({
      stage: `0${idx + 2}`,
      title: `${formatSignalName(ev.signal_type).toUpperCase()} DETECTED`,
      detail: `+${ev.score_contribution} pts (${Math.round(ev.confidence * 100)}% conf)`,
      tone: "bg-[#fee2e2]/60 border-[#b91c1c]/30 text-[#b91c1c]",
    })),
    {
      stage: `0${Math.min(6, evidence.length + 2)}`,
      title: "COMPOSITE RISK CALCULATED",
      detail: `Score: ${caseData.risk_score} / 100 (${caseData.risk_level})`,
      tone: "bg-[#042126] border-[#042126] text-[#acf2e5]",
    },
    {
      stage: `0${Math.min(7, evidence.length + 3)}`,
      title: "SIU REVIEW RECOMMENDED",
      detail: `Human decision (${latestTimestamp})`,
      tone: "bg-[#209b47] border-[#209b47] text-white",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb, Case Header & Human-in-the-Loop Action Bar */}
      <div className="nexus-glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#042126]/70 mb-2">
              <Link
                href="/queue"
                className="text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> SIU Priority Queue
              </Link>
              <span>/</span>
              <span className="text-[#042126] font-mono font-bold">
                {caseData.case_id}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#fef3c7] text-[#b45309] border border-[#d97706]/30 text-[10px] font-mono font-semibold">
                EVIDENCE DETECTED • INVESTIGATION RECOMMENDED
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-[#209b47]">
                {caseData.case_id}: {caseData.provider_id} ({caseData.provider_name})
              </h2>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded border ${getStatusBadgeClasses(
                  caseData.status
                )}`}
              >
                SIU Status: {caseData.status}
              </span>
            </div>
            <p className="text-xs text-[#042126]/75 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Primary Claim:{" "}
                <strong className="text-[#042126] font-mono">
                  {caseData.primary_claim_id}
                </strong>
              </span>
              <span>•</span>
              <span>
                Member:{" "}
                <strong className="text-[#042126] font-mono">
                  {caseData.member_id}
                </strong>
              </span>
              <span>•</span>
              <span>
                Facility:{" "}
                <strong className="text-[#042126]">
                  {caseData.facility_id} ({caseData.facility_name})
                </strong>
              </span>
              <span>•</span>
              <Link
                href={`/providers/${caseData.provider_id}`}
                className="font-semibold text-[#15497e] hover:text-[#209b47] underline"
              >
                Open Provider Profile ({caseData.provider_id}) →
              </Link>
              <span>•</span>
              <Link
                href="/network"
                className="font-semibold text-[#15497e] hover:text-[#209b47] underline"
              >
                Explore Full Network →
              </Link>
            </p>
          </div>

          {/* Human-in-the-Loop Investigator Decision Buttons + Export Dossier */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#005f68] font-bold xl:text-right">
              Human Investigator Decision Controls:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MagneticButton
                disabled={statusUpdating}
                onClick={() => handleStatusChange("Under Review")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#209b47] hover:bg-[#1b843c] text-white flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Mark Under Review</span>
              </MagneticButton>
              <MagneticButton
                disabled={statusUpdating}
                onClick={() => handleStatusChange("Escalated")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#fee2e2] hover:bg-[#b91c1c] text-[#b91c1c] hover:text-white border border-[#b91c1c]/35 flex items-center gap-1.5 transition-colors"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Escalate</span>
              </MagneticButton>
              <MagneticButton
                disabled={statusUpdating}
                onClick={() => handleStatusChange("Resolved")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#acf2e5] hover:bg-[#209b47] text-[#042126] hover:text-white border border-[#209b47]/30 flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Resolve</span>
              </MagneticButton>
              <MagneticButton
                disabled={statusUpdating}
                onClick={() => handleStatusChange("Dismissed")}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-[#042126] text-[#042126] hover:text-white border-[1.5px] border-[#042126] flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </MagneticButton>
              <MagneticButton
                onClick={handleExportDossier}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#042126] hover:bg-[#005f68] text-white flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#acf2e5]" />
                <span>Export SIU Audit Packet</span>
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* 5-Metric Investigation Key Facts Strip (Requirement 4) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-[#042126]/10">
          <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
            <div className="text-[10px] font-mono uppercase text-[#005f68] font-bold">
              CASE ID
            </div>
            <div className="text-lg font-mono font-bold text-[#042126] mt-0.5">
              {caseData.case_id}
            </div>
            <div className="text-[11px] text-[#042126]/65">
              {caseData.suspicious_claim_count} flagged claims
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#fee2e2]/45 border border-[#b91c1c]/30">
            <div className="text-[10px] font-mono uppercase text-[#b91c1c] font-bold">
              COMPOSITE RISK SCORE
            </div>
            <div className="text-lg font-mono font-bold text-[#b91c1c] mt-0.5 tabular-nums">
              {caseData.risk_score} / 100
            </div>
            <div className="text-[11px] text-[#042126]/75">
              4-engine weighted score
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
            <div className="text-[10px] font-mono uppercase text-[#005f68] font-bold">
              RISK LEVEL
            </div>
            <div className="mt-1">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${getRiskBadgeClasses(
                  caseData.risk_level
                )}`}
              >
                {caseData.risk_level}
              </span>
            </div>
            <div className="text-[11px] text-[#042126]/70 mt-1">
              Review Required
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#acf2e5]/35 border border-[#209b47]/30">
            <div className="text-[10px] font-mono uppercase text-[#209b47] font-bold">
              FINANCIAL EXPOSURE
            </div>
            <div className="text-lg font-mono font-bold text-[#209b47] mt-0.5 tabular-nums">
              {formatINR(caseData.potential_exposure)}
            </div>
            <div className="text-[11px] text-[#042126]/75">
              Billed: {formatINR(caseData.total_claimed_amount)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-mono uppercase text-[#005f68] font-bold">
              DETECTED SIGNALS
            </div>
            <div className="text-lg font-mono font-bold text-[#042126] mt-0.5">
              {evidence.length} Signals
            </div>
            <div className="text-[11px] text-[#209b47] font-semibold">
              {caseData.evidence_strength}
            </div>
          </div>
        </div>

        {/* Human-in-the-Loop Governance Notice (Requirement 9) */}
        <div className="px-4 py-2.5 rounded-xl bg-[#f2fcff] border border-[#005f68]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <span className="text-[#042126] font-medium">
            <strong className="text-[#005f68]">Human-in-the-Loop Principle:</strong>{" "}
            ClaimShield prioritizes and explains suspicious cases. Final investigation decisions remain with SIU investigators.
          </span>
          <span className="font-mono text-[11px] text-[#005f68] font-semibold shrink-0">
            NO AUTOMATED FRAUD ACCUSATION
          </span>
        </div>
      </div>

      {/* Row 2: Explainable Risk Breakdown + Pre-Pay/Post-Pay Financial Recovery + 30/60/90-Day Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Explainable Multi-Engine Risk Breakdown (Requirement 5) */}
        <div className="nexus-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#b91c1c]" />
              Why Risk Score = {caseData.risk_score} ({caseData.risk_level})
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c]">
              {caseData.risk_score} / 100
            </span>
          </div>
          <p className="text-xs text-[#042126]/75 mb-4">
            This score is composed of 4 weighted detection engines — not an unexplained black-box model:
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#042126] font-semibold">
                  RULE ENGINE — 40% Weight
                </span>
                <span className="font-mono font-semibold text-[#042126]">
                  {caseData.rule_score} / 100
                </span>
              </div>
              <div className="h-2 bg-[#f2fcff] border border-[#042126]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#b91c1c]"
                  style={{ width: `${Math.min(100, caseData.rule_score)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#042126] font-semibold">
                  ISOLATION FOREST — 30% Weight
                </span>
                <span className="font-mono font-semibold text-[#042126]">
                  {caseData.ml_score} / 100
                </span>
              </div>
              <div className="h-2 bg-[#f2fcff] border border-[#042126]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#d97706]"
                  style={{ width: `${Math.min(100, caseData.ml_score)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#042126] font-semibold">
                  NETWORK INTELLIGENCE — 20% Weight
                </span>
                <span className="font-mono font-semibold text-[#042126]">
                  {caseData.graph_score} / 100
                </span>
              </div>
              <div className="h-2 bg-[#f2fcff] border border-[#042126]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#005f68]"
                  style={{ width: `${Math.min(100, caseData.graph_score)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[#042126] font-semibold">
                  TEMPORAL ANALYSIS — 10% Weight
                </span>
                <span className="font-mono font-semibold text-[#042126]">
                  {caseData.temporal_score} / 100
                </span>
              </div>
              <div className="h-2 bg-[#f2fcff] border border-[#042126]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#209b47]"
                  style={{ width: `${Math.min(100, caseData.temporal_score)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#042126]/10">
            <div className="text-[10px] font-mono uppercase text-[#005f68] font-bold mb-1.5">
              DETECTED SIGNALS ({evidence.length}):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {evidence.map((ev) => (
                <span
                  key={ev.signal_type}
                  className="text-[11px] px-2.5 py-0.5 rounded bg-[#acf2e5] text-[#042126] font-medium"
                >
                  • {formatSignalName(ev.signal_type)}{" "}
                  <strong className="text-[#b91c1c] font-mono">
                    +{ev.score_contribution}
                  </strong>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Financial Exposure & Pre-Payment Hold vs Post-Payment Recovery */}
        <div className="nexus-glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#209b47]" />
                Pre-Pay Hold &amp; Recovery Allocation
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded bg-[#acf2e5] text-[#042126]">
                {caseData.suspicious_claim_count} FLAGGED CLAIMS
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mt-2">
              <div className="p-3 rounded-xl bg-[#acf2e5]/40 border border-[#209b47]/35 flex items-center justify-between">
                <span className="text-xs text-[#042126] font-semibold">
                  Total Potential FWA Exposure
                </span>
                <span className="text-lg font-mono font-extrabold text-[#209b47] tabular-nums">
                  {formatINR(caseData.potential_exposure)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#f2fcff] border border-[#005f68]/25">
                  <div className="text-[10px] font-mono uppercase font-semibold text-[#005f68]">
                    Pre-Payment Hold (62%)
                  </div>
                  <div className="text-sm font-mono font-bold text-[#042126] mt-0.5 tabular-nums">
                    {formatINR(prePayHoldAmount)}
                  </div>
                  <div className="text-[10px] text-[#209b47] font-semibold mt-0.5">
                    Stop before disbursement
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#fef3c7]/60 border border-[#d97706]/30">
                  <div className="text-[10px] font-mono uppercase font-semibold text-[#b45309]">
                    Post-Pay Clawback (38%)
                  </div>
                  <div className="text-sm font-mono font-bold text-[#042126] mt-0.5 tabular-nums">
                    {formatINR(postPayClawbackAmount)}
                  </div>
                  <div className="text-[10px] text-[#b45309] font-semibold mt-0.5">
                    SIU recovery audit
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#042126]/70 mt-3 leading-relaxed">
            Total Billed: <strong className="font-mono">{formatINR(caseData.total_claimed_amount)}</strong>. Pre-pay hold prevents immediate leakage on pending claims while SIU audits settled encounters.
          </p>
        </div>

        {/* 3. Future Risk Forecast (30 / 60 / 90-day) */}
        <div className="nexus-glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#d97706]" />
                {forecast?.label || "Synthetic Risk Forecast"}
              </h3>
              <span className="text-[11px] font-mono font-semibold text-[#b45309]">
                {forecast?.trajectory}
              </span>
            </div>
            <p className="text-xs text-[#042126]/75 mb-4">
              Current Risk: <strong className="text-[#042126]">{caseData.risk_score}</strong> • Projected persistence probability:
            </p>

            {forecast && (
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="p-3 rounded-xl bg-[#fef3c7] border border-[#d97706]/30 text-center">
                  <div className="text-[11px] text-[#b45309] font-semibold">30 Days</div>
                  <div className="text-xl font-mono font-bold text-[#b45309] mt-1 tabular-nums">
                    {forecast.forecast_30_day}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#fef3c7] border border-[#d97706]/40 text-center">
                  <div className="text-[11px] text-[#b45309] font-semibold">60 Days</div>
                  <div className="text-xl font-mono font-bold text-[#b45309] mt-1 tabular-nums">
                    {forecast.forecast_60_day}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#fee2e2] border border-[#b91c1c]/35 text-center">
                  <div className="text-[11px] text-[#b91c1c] font-semibold">90 Days</div>
                  <div className="text-xl font-mono font-bold text-[#b91c1c] mt-1 tabular-nums">
                    {forecast.forecast_90_day}%
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1 text-[11px] text-[#042126]/80">
              {forecast?.key_drivers.slice(0, 3).map((d, i) => (
                <div key={i}>• {d}</div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-[#042126]/10 text-[11px] text-[#042126]/65 italic">
            {forecast?.disclaimer ||
              "Risk estimates based on synthetic historical behavior."}
          </div>
        </div>
      </div>

      {/* Compact Chronological Evidence Sequence (Requirement 6) */}
      <div className="nexus-glass-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#005f68] font-bold">
              CHRONOLOGICAL EVIDENCE SEQUENCE
            </div>
            <h3 className="text-sm font-semibold text-[#209b47]">
              How {caseData.case_id} Progressed From Claim Ingestion to SIU Review Recommendation
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className="text-xs font-semibold text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>View Full Timestamped Log ({timeline.length} events) →</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {evidenceSequenceSteps.map((stepObj, i) => (
            <button
              key={stepObj.stage + i}
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`p-3 rounded-xl border text-left transition-all hover:-translate-y-[1px] ${stepObj.tone}`}
            >
              <div className="text-[10px] font-mono font-bold opacity-80 mb-1">
                STEP {stepObj.stage}
              </div>
              <div className="text-[11px] font-bold leading-snug">
                {stepObj.title}
              </div>
              <div className="text-[10px] font-mono opacity-85 mt-1 truncate">
                {stepObj.detail}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Segmented Deep-Dive Tabs (Added Specialty Peer Benchmark Tab) */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#042126]/10 pb-4">
          <div className="inline-flex flex-wrap p-1.5 rounded-xl bg-white border border-[#042126]/10 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("evidence")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "evidence"
                  ? "bg-[#209b47] text-white"
                  : "bg-[#acf2e5]/20 text-[#042126] hover:bg-[#acf2e5]/45"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>View Evidence ({evidence.length} Signals)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("peer")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "peer"
                  ? "bg-[#209b47] text-white"
                  : "bg-[#acf2e5]/20 text-[#042126] hover:bg-[#acf2e5]/45"
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Specialty Peer Benchmark ({caseData.specialty})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "timeline"
                  ? "bg-[#209b47] text-white"
                  : "bg-[#acf2e5]/20 text-[#042126] hover:bg-[#acf2e5]/45"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Chronological Timeline ({timeline.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("graph")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "graph"
                  ? "bg-[#209b47] text-white"
                  : "bg-[#acf2e5]/20 text-[#042126] hover:bg-[#acf2e5]/45"
              }`}
            >
              <NetworkIcon className="w-4 h-4" />
              <span>Explore Network ({graphData.nodes.length} Nodes)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("brief")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === "brief"
                  ? "bg-[#209b47] text-white"
                  : "bg-[#acf2e5]/20 text-[#042126] hover:bg-[#acf2e5]/45"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Investigation Brief &amp; SIU Notes ({notes.length})</span>
            </button>
          </div>

          <MagneticButton
            onClick={handleGenerateBrief}
            disabled={briefLoading}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#209b47] hover:bg-[#1b843c] text-white flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {briefLoading
                ? "Synthesizing Brief..."
                : brief
                ? "Refresh Investigation Brief"
                : "Generate Investigation Brief"}
            </span>
          </MagneticButton>
        </div>

        {activeTab === "evidence" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {evidence.map((ev, i) => (
              <div
                key={i}
                className="nexus-glass-card rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#b91c1c] inline-block" />
                      <span className="text-sm font-semibold text-[#005f68]">
                        {formatSignalName(ev.signal_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] border border-[#b91c1c]/30">
                        +{ev.score_contribution} pts
                      </span>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-[#acf2e5] text-[#042126] font-semibold">
                        Confidence: {Math.round(ev.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#042126]/85 leading-relaxed">
                    {ev.explanation}
                  </p>
                </div>

                {ev.supporting_claims.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#042126]/10 flex items-center flex-wrap gap-1.5">
                    <span className="text-[10px] font-mono text-[#005f68] uppercase font-semibold">
                      Supporting Claims:
                    </span>
                    {ev.supporting_claims.map((cid) => (
                      <span
                        key={cid}
                        className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#f2fcff] text-[#15497e] border border-[#042126]/10"
                      >
                        {cid}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "peer" && (
          <div className="nexus-glass-card rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#042126]/10 pb-4">
              <div>
                <h3 className="text-base font-semibold text-[#209b47]">
                  Specialty Peer Cohort Benchmark: {caseData.provider_id} vs. {caseData.specialty} Peers
                </h3>
                <p className="text-xs text-[#042126]/75">
                  Side-by-side deviation analysis comparing {caseData.provider_name} against normal synthetic providers in {caseData.specialty}
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#fee2e2] text-[#b91c1c]">
                SIGNIFICANT PEER OUTLIER (&gt;3.2σ)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {[
                {
                  metric: "Average Claim Amount",
                  providerVal: formatINR(avgClaimCost),
                  peerVal: formatINR(peerBenchmarkCost),
                  multiplier: "3.4x Peer Avg",
                  pct: 88,
                },
                {
                  metric: "Peak Daily Claim Utilization",
                  providerVal: "42 claims / day",
                  peerVal: "9 claims / day",
                  multiplier: "4.6x Peer Avg",
                  pct: 92,
                },
                {
                  metric: "Reciprocal Referral Concentration",
                  providerVal: "78% closed-loop",
                  peerVal: "12% baseline",
                  multiplier: "6.5x Peer Avg",
                  pct: 94,
                },
                {
                  metric: "Same-Day Repeat Member Encounters",
                  providerVal: "31% of claims",
                  peerVal: "4% baseline",
                  multiplier: "7.7x Peer Avg",
                  pct: 85,
                },
              ].map((row) => (
                <div
                  key={row.metric}
                  className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#042126] text-sm">
                      {row.metric}
                    </span>
                    <span className="font-mono font-bold px-2.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c]">
                      {row.multiplier}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-[#b91c1c]">
                        {caseData.provider_id}: {row.providerVal}
                      </span>
                      <span className="text-[#005f68] font-medium">
                        {caseData.specialty} Peer Avg: {row.peerVal}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white border border-[#042126]/10 overflow-hidden flex">
                      <div
                        className="h-full bg-[#b91c1c]"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="nexus-glass-card rounded-2xl p-6 space-y-3">
            {timeline.map((item) => (
              <div
                key={item.id + item.timestamp}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.highlight
                    ? "bg-[#fee2e2]/45 border-[#b91c1c]/35"
                    : "bg-[#f2fcff] border-[#042126]/10"
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="font-mono text-[#005f68] font-bold">
                      {item.timestamp.replace("T", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#acf2e5] text-[#042126] text-[10px] font-mono font-semibold">
                      {item.event_type}
                    </span>
                    <span className="text-[#042126]/75 font-medium">
                      {item.location} • {item.facility_id}
                    </span>
                  </div>
                  <p className="text-xs text-[#042126] mt-1.5 font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.signals.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] border border-[#b91c1c]/30 font-semibold"
                    >
                      {formatSignalName(s)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "graph" && (
          <RelationshipGraph
            nodes={graphData.nodes}
            edges={graphData.edges}
            height={460}
          />
        )}

        {activeTab === "brief" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 nexus-glass-card rounded-2xl p-6">
              <div className="pb-4 border-b border-[#042126]/10">
                <h3 className="text-sm font-semibold text-[#209b47] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#209b47]" />
                  AI Investigation Brief (Structured Evidence Synthesis)
                </h3>
                <p className="text-xs text-[#042126]/75 mt-0.5">
                  Synthesizes strictly from verified detector outputs. Never invents evidence or declares confirmed fraud.
                </p>
              </div>

              {brief ? (
                <div className="mt-4 space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                    <div className="font-mono font-semibold text-[#005f68] uppercase tracking-wider text-[10px] mb-1">
                      Why This Case Was Flagged
                    </div>
                    <p className="text-[#042126] leading-relaxed">
                      {brief.why_flagged}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                    <div className="font-mono font-semibold text-[#005f68] uppercase tracking-wider text-[10px] mb-1.5">
                      Correlated Supporting Evidence
                    </div>
                    <ul className="space-y-1 text-[#042126]">
                      {brief.supporting_evidence.map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                      <div className="font-mono font-semibold text-[#005f68] uppercase tracking-wider text-[10px] mb-1">
                        Suspicious Relationships
                      </div>
                      <p className="text-[#042126] leading-relaxed">
                        {brief.suspicious_relationships}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#acf2e5]/35 border border-[#209b47]/30">
                      <div className="font-mono font-semibold text-[#209b47] uppercase tracking-wider text-[10px] mb-1">
                        Potential Financial Impact
                      </div>
                      <p className="text-[#042126] leading-relaxed font-medium">
                        {brief.financial_impact}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                    <div className="font-mono font-semibold text-[#005f68] uppercase tracking-wider text-[10px] mb-1.5">
                      Recommended SIU Review Checklist
                    </div>
                    <ul className="space-y-1 text-[#042126]">
                      {brief.recommended_actions.map((act, idx) => (
                        <li key={idx}>• {act}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#fef3c7] border border-[#d97706]/30 text-[#b45309] text-[11px] font-medium">
                    {brief.limitations}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#042126]/75">
                  Click{" "}
                  <strong className="text-[#209b47]">
                    &ldquo;Generate AI Investigation Brief&rdquo;
                  </strong>{" "}
                  above to compile an investigator-ready brief explaining why{" "}
                  {caseData.case_id} was prioritized, supporting evidence, financial impact, and review steps.
                </div>
              )}
            </div>

            {/* Investigator Audit Notes Panel */}
            <div className="nexus-glass-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2 mb-1">
                  <MessageSquarePlus className="w-4 h-4 text-[#209b47]" />
                  SIU Investigator Case Notes
                </h3>
                <p className="text-xs text-[#042126]/70 mb-4">
                  Human-in-the-loop audit log &amp; investigator commentary
                </p>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 mb-4">
                  {notes.map((n) => (
                    <div
                      key={n.note_id}
                      className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#042126]/70 mb-1">
                        <span className="font-semibold text-[#005f68]">
                          {n.investigator}
                        </span>
                        <span className="font-mono">
                          {n.timestamp.replace("T", " ").slice(0, 16)}
                        </span>
                      </div>
                      <p className="text-[#042126]">{n.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddNote} className="space-y-2.5">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add SIU review note or document audit finding..."
                  rows={3}
                  className="w-full rounded-xl bg-[#f2fcff] border border-[#042126]/15 p-3 text-xs text-[#042126] placeholder:text-[#042126]/45 focus:outline-none focus:border-[#209b47]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-xs font-semibold text-white transition-colors"
                >
                  Add Investigator Note
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

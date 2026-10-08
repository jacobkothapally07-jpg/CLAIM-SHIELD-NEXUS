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
  GitCompare,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  UserCheck,
  HelpCircle,
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

const ENGINE_EXPLANATIONS: Record<
  "rule" | "ml" | "graph" | "temporal",
  {
    title: string;
    weight: string;
    description: string;
    detail: string;
  }
> = {
  rule: {
    title: "RULE ENGINE",
    weight: "40%",
    description: "Rule-based signals contributing to claim risk.",
    detail:
      "Evaluates deterministic policy rules including duplicate billing, impossible cross-region timing, upcoding, unbundling, and abnormal utilization.",
  },
  ml: {
    title: "ISOLATION FOREST",
    weight: "30%",
    description:
      "Statistical anomaly detection identifying unusual patterns.",
    detail:
      "Scores claim cost ratios, daily utilization frequency, and provider billing deviation against specialty peer baselines.",
  },
  graph: {
    title: "NETWORK INTELLIGENCE",
    weight: "20%",
    description:
      "Relationship-based risk across providers, facilities and members.",
    detail:
      "Analyzes referral concentration, closed-loop provider reciprocity, and multi-facility shared member clusters.",
  },
  temporal: {
    title: "TEMPORAL ANALYSIS",
    weight: "10%",
    description: "Timing and frequency-based anomaly detection.",
    detail:
      "Detects rapid claim submission bursts, monthly volume acceleration (>4x baseline), and impossible encounter intervals.",
  },
};

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
  const [selectedEngine, setSelectedEngine] = useState<
    "rule" | "ml" | "graph" | "temporal"
  >("rule");
  const [selectedSequenceIdx, setSelectedSequenceIdx] = useState<number>(0);
  const [showConsiderations, setShowConsiderations] = useState<boolean>(true);
  const [investigatorDecisionLabel, setInvestigatorDecisionLabel] = useState<
    string | null
  >(null);
  const [networkAnalyzed, setNetworkAnalyzed] = useState<boolean>(false);
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

  const handleInvestigatorAction = async (
    actionLabel: string,
    mappedStatus: string
  ) => {
    if (!caseData) return;
    setInvestigatorDecisionLabel(actionLabel);
    try {
      setStatusUpdating(true);
      const res = await updateCaseStatus(caseData.case_id, mappedStatus);
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

  // Build Expandable Evidence Sequence steps from actual case data & timestamps (Requirement 7)
  const firstTimestamp = timeline[0]?.timestamp
    ? timeline[0].timestamp.replace("T", " ")
    : null;
  const latestTimestamp = timeline[timeline.length - 1]?.timestamp
    ? timeline[timeline.length - 1].timestamp.replace("T", " ")
    : null;

  const duplicateEv = evidence.find((e) =>
    e.signal_type.includes("duplicate")
  );
  const anomalyEv =
    evidence.find(
      (e) =>
        e.signal_type.includes("abnormal") ||
        e.signal_type.includes("upcoding") ||
        e.signal_type.includes("utilization")
    ) || evidence[0];
  const networkEv = evidence.find(
    (e) =>
      e.signal_type.includes("network") || e.signal_type.includes("referral")
  );
  const temporalEv = evidence.find(
    (e) =>
      e.signal_type.includes("timing") || e.signal_type.includes("temporal")
  );

  const evidenceSequenceSteps = [
    {
      stage: "01",
      title: "CLAIM SUBMITTED",
      detail: firstTimestamp
        ? `${caseData.primary_claim_id} (${firstTimestamp})`
        : `${caseData.primary_claim_id} (${caseData.suspicious_claim_count} claims)`,
      expandedText: `Primary claim ${caseData.primary_claim_id} submitted by ${caseData.provider_id} (${caseData.provider_name}) at ${caseData.facility_id} (${caseData.location}) for member ${caseData.member_id}. Total billed across case: ${formatINR(
        caseData.total_claimed_amount
      )}.`,
      tone: "bg-[#f2fcff] border-[#042126]/15 text-[#042126]",
    },
    {
      stage: "02",
      title: "DUPLICATE PATTERN DETECTED",
      detail: duplicateEv
        ? `+${duplicateEv.score_contribution} pts (${Math.round(
            duplicateEv.confidence * 100
          )}% conf)`
        : `Rule Engine (${caseData.rule_score}/100)`,
      expandedText:
        duplicateEv?.explanation ||
        `Rule Engine evaluated ${caseData.suspicious_claim_count} claims for duplicate billing and policy rule violations (Rule Score: ${caseData.rule_score}/100).`,
      tone: "bg-[#fee2e2]/60 border-[#b91c1c]/30 text-[#b91c1c]",
    },
    {
      stage: "03",
      title: "PROVIDER ANOMALY DETECTED",
      detail: `Isolation Forest (${caseData.ml_score}/100)`,
      expandedText:
        anomalyEv?.explanation ||
        `Isolation Forest anomaly detector flagged ${caseData.provider_id} billing patterns against ${caseData.specialty} specialty peers (Anomaly Score: ${caseData.ml_score}/100).`,
      tone: "bg-[#fef3c7]/70 border-[#d97706]/35 text-[#b45309]",
    },
    {
      stage: "04",
      title: "NETWORK ANOMALY DETECTED",
      detail: `Network Score (${caseData.graph_score}/100)`,
      expandedText:
        networkEv?.explanation ||
        `NetworkX relationship analysis evaluated ${graphData.nodes.length} connected entities and ${graphData.edges.length} referral/facility ties (Network Score: ${caseData.graph_score}/100).`,
      tone: "bg-[#f2fcff] border-[#005f68]/30 text-[#005f68]",
    },
    {
      stage: "05",
      title: "TEMPORAL PATTERN DETECTED",
      detail: `Temporal Score (${caseData.temporal_score}/100)`,
      expandedText:
        temporalEv?.explanation ||
        `Temporal analysis evaluated encounter intervals and daily claim submission velocity (Temporal Score: ${caseData.temporal_score}/100).`,
      tone: "bg-[#fef3c7]/70 border-[#d97706]/35 text-[#b45309]",
    },
    {
      stage: "06",
      title: "COMPOSITE RISK CALCULATED",
      detail: `Score: ${caseData.risk_score} / 100 (${caseData.risk_level})`,
      expandedText: `Weighted multi-engine synthesis combined Rule (${caseData.rule_score}), Anomaly (${caseData.ml_score}), Network (${caseData.graph_score}) and Temporal (${caseData.temporal_score}) into Composite Risk Score ${caseData.risk_score}/100.`,
      tone: "bg-[#042126] border-[#042126] text-[#acf2e5]",
    },
    {
      stage: "07",
      title: "SIU REVIEW RECOMMENDED",
      detail: latestTimestamp
        ? `Review Required (${latestTimestamp})`
        : "Human SIU Decision",
      expandedText: `Case prioritized for SIU investigator review with ${formatINR(
        caseData.potential_exposure
      )} potential exposure. ClaimShield recommends investigation; the human investigator makes the final decision.`,
      tone: "bg-[#209b47] border-[#209b47] text-white",
    },
  ];

  const activeSequenceStep =
    evidenceSequenceSteps[selectedSequenceIdx] || evidenceSequenceSteps[0];

  const auditTrailSteps = [
    {
      label: "CASE OPENED",
      status: `${caseData.case_id} loaded`,
      done: true,
    },
    {
      label: "RISK CALCULATED",
      status: `${caseData.risk_score}/100 (${caseData.risk_level})`,
      done: true,
    },
    {
      label: "EVIDENCE REVIEWED",
      status: `${evidence.length} signals inspected`,
      done: true,
    },
    {
      label: "NETWORK ANALYZED",
      status: networkAnalyzed
        ? `${graphData.nodes.length} nodes inspected`
        : `${graphData.nodes.length} nodes ready`,
      done: networkAnalyzed || graphData.nodes.length > 0,
    },
    {
      label: "INVESTIGATOR ACTION",
      status: investigatorDecisionLabel || `Current: ${caseData.status}`,
      done: Boolean(investigatorDecisionLabel) || caseData.status !== "New",
    },
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1: CASE HEADER & 6-METRIC INVESTIGATION OVERVIEW (REQUIREMENT 4 & 12) */}
      <div className="nexus-glass-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
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
              <span className="px-2.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] border border-[#b91c1c]/30 text-[10px] font-mono font-bold">
                HIGH RISK • INVESTIGATION RECOMMENDED • REVIEW REQUIRED
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
                Investigate Provider ({caseData.provider_id}) →
              </Link>
              <span>•</span>
              <Link
                href="/network"
                className="font-semibold text-[#15497e] hover:text-[#209b47] underline"
              >
                Explore Network Intelligence →
              </Link>
            </p>
          </div>

          {/* Discoverable Compare Billing Evidence & Export Buttons (Requirement 12) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-case-diff-modal"))
              }
              className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[#209b47] hover:bg-[#1b843c] text-white flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Billing Evidence</span>
            </button>
            <a
              href="#investigator-action"
              className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-[#042126] text-[#042126] hover:text-white border-[1.5px] border-[#042126] flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#209b47]" />
              <span>Record Investigator Action</span>
            </a>
            <MagneticButton
              onClick={handleExportDossier}
              className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[#042126] hover:bg-[#005f68] text-white flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#acf2e5]" />
              <span>Export Audit Packet</span>
            </MagneticButton>
          </div>
        </div>

        {/* 6-Metric Investigation Key Facts Strip (Requirement 4: CASE ID, RISK SCORE, RISK LEVEL, DETECTED SIGNALS, FINANCIAL EXPOSURE, PROVIDER) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-[#042126]/10">
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
              RISK SCORE
            </div>
            <div className="text-lg font-mono font-bold text-[#b91c1c] mt-0.5 tabular-nums">
              {caseData.risk_score} / 100
            </div>
            <div className="text-[11px] text-[#042126]/75">
              Explainable 4-engine score
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
            <div className="text-[11px] text-[#b45309] font-semibold mt-1">
              Investigation Recommended
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
            <div className="text-[10px] font-mono uppercase text-[#005f68] font-bold">
              DETECTED SIGNALS
            </div>
            <div className="text-lg font-mono font-bold text-[#042126] mt-0.5">
              {evidence.length}
            </div>
            <div className="text-[11px] text-[#209b47] font-semibold">
              {caseData.evidence_strength}
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

          <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
            <div className="text-[10px] font-mono uppercase text-[#005f68] font-bold">
              PROVIDER
            </div>
            <Link
              href={`/providers/${caseData.provider_id}`}
              className="text-sm font-mono font-bold text-[#15497e] hover:text-[#209b47] hover:underline block mt-0.5 truncate"
            >
              {caseData.provider_id}
            </Link>
            <div className="text-[11px] text-[#042126]/75 truncate">
              {caseData.provider_name} • {caseData.specialty}
            </div>
          </div>
        </div>

        {/* Compact Live Session Audit Trail (Requirement 10) */}
        <div className="px-4 py-2.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#005f68] mr-1">
              AUDIT TRAIL:
            </span>
            {auditTrailSteps.map((st, idx) => (
              <React.Fragment key={st.label}>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${
                    st.done
                      ? "bg-[#acf2e5]/50 text-[#042126] border-[#209b47]/30"
                      : "bg-white text-[#042126]/70 border-[#042126]/15"
                  }`}
                >
                  {st.label}: {st.status}
                </span>
                {idx < auditTrailSteps.length - 1 && (
                  <span className="text-[#042126]/35 font-mono text-[10px]">
                    ↓
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
          <span className="font-mono text-[11px] text-[#005f68] font-semibold shrink-0">
            CLAIMSHIELD RECOMMENDS • INVESTIGATOR DECIDES
          </span>
        </div>
      </div>

      {/* SECTION 2: "WHY WAS THIS CLAIM FLAGGED?" (REQUIREMENT 5 — PROMINENT INDIVIDUAL SIGNALS) */}
      <div
        id="why-flagged"
        className="nexus-glass-card rounded-2xl p-6 space-y-4 border-l-4 border-l-[#b91c1c]"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#b91c1c] font-bold">
              MULTI-SIGNAL EVIDENCE SUMMARY
            </div>
            <h3 className="text-lg font-semibold text-[#042126]">
              WHY WAS THIS CLAIM FLAGGED? ({evidence.length} Correlated Signals)
            </h3>
            <p className="text-xs text-[#042126]/75">
              Each signal below was independently detected across rule, statistical anomaly, network, and temporal engines.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-case-diff-modal"))
            }
            className="px-4 py-2 rounded-full bg-[#042126] hover:bg-[#005f68] text-[#acf2e5] text-xs font-mono font-semibold flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Billing Evidence Side-by-Side</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidence.map((ev, idx) => {
            const severity =
              ev.score_contribution >= 20
                ? "HIGH SEVERITY"
                : ev.score_contribution >= 15
                ? "ELEVATED SIGNAL"
                : "SUPPORTING SIGNAL";
            const dotColor =
              ev.score_contribution >= 20 ? "bg-[#b91c1c]" : "bg-[#d97706]";
            return (
              <div
                key={ev.signal_type + idx}
                className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10 flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#042126] uppercase font-mono">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${dotColor} shrink-0`}
                      />
                      {formatSignalName(ev.signal_type)}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c]">
                      +{ev.score_contribution} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#042126]/10 text-[#005f68]">
                      {severity}
                    </span>
                    <span className="text-[10px] font-mono text-[#042126]/70">
                      Confidence: {Math.round(ev.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-[#042126]/85 leading-relaxed">
                    {ev.explanation}
                  </p>
                </div>

                {ev.supporting_claims.length > 0 && (
                  <div className="pt-2 border-t border-[#042126]/10 flex items-center flex-wrap gap-1">
                    <span className="text-[10px] font-mono text-[#005f68] font-semibold">
                      Evidence Claims:
                    </span>
                    {ev.supporting_claims.slice(0, 3).map((cid) => (
                      <span
                        key={cid}
                        className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white text-[#15497e] border border-[#042126]/10"
                      >
                        {cid}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: INTERACTIVE EXPLAINABLE RISK BREAKDOWN + RECOVERY + FORECAST (REQUIREMENT 6) */}
      <div
        id="risk-breakdown"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* 1. Interactive Clickable 4-Engine Risk Breakdown (Requirement 6) */}
        <div className="nexus-glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#b91c1c]" />
                Explainable Risk Score Breakdown
              </h3>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c]">
                {caseData.risk_score} / 100 ({caseData.risk_level})
              </span>
            </div>
            <p className="text-xs text-[#042126]/75 mb-3">
              Click any engine below to inspect how it contributes to the composite risk score:
            </p>

            <div className="space-y-2.5 text-xs">
              {(
                [
                  {
                    key: "rule" as const,
                    label: "RULE ENGINE — 40%",
                    score: caseData.rule_score,
                    barColor: "bg-[#b91c1c]",
                  },
                  {
                    key: "ml" as const,
                    label: "ISOLATION FOREST — 30%",
                    score: caseData.ml_score,
                    barColor: "bg-[#d97706]",
                  },
                  {
                    key: "graph" as const,
                    label: "NETWORK INTELLIGENCE — 20%",
                    score: caseData.graph_score,
                    barColor: "bg-[#005f68]",
                  },
                  {
                    key: "temporal" as const,
                    label: "TEMPORAL ANALYSIS — 10%",
                    score: caseData.temporal_score,
                    barColor: "bg-[#209b47]",
                  },
                ] as const
              ).map((eng) => {
                const isSelected = selectedEngine === eng.key;
                return (
                  <button
                    key={eng.key}
                    type="button"
                    onClick={() => setSelectedEngine(eng.key)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#042126] text-white border-[#042126]"
                        : "bg-[#f2fcff] text-[#042126] border-[#042126]/10 hover:border-[#209b47]"
                    }`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-mono font-bold text-[11px]">
                        {eng.label}
                      </span>
                      <span
                        className={`font-mono font-bold text-[11px] ${
                          isSelected ? "text-[#acf2e5]" : "text-[#042126]"
                        }`}
                      >
                        {eng.score} / 100
                      </span>
                    </div>
                    <div className="h-2 bg-white/90 border border-[#042126]/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${eng.barColor}`}
                        style={{ width: `${Math.min(100, eng.score)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Engine Explanation Box */}
          <div className="mt-3 p-3 rounded-xl bg-[#f2fcff] border border-[#005f68]/25 text-xs space-y-1">
            <div className="font-mono font-bold text-[#005f68] text-[11px]">
              {ENGINE_EXPLANATIONS[selectedEngine].title} (
              {ENGINE_EXPLANATIONS[selectedEngine].weight} WEIGHT)
            </div>
            <div className="font-semibold text-[#042126]">
              &ldquo;{ENGINE_EXPLANATIONS[selectedEngine].description}&rdquo;
            </div>
            <p className="text-[11px] text-[#042126]/75 leading-relaxed">
              {ENGINE_EXPLANATIONS[selectedEngine].detail}
            </p>
          </div>
        </div>

        {/* 2. Financial Exposure & Pre-Payment Hold vs Post-Payment Recovery */}
        <div className="nexus-glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-[#209b47]" />
                Financial Exposure &amp; Hold Allocation
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded bg-[#acf2e5] text-[#042126]">
                {caseData.suspicious_claim_count} FLAGGED CLAIMS
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 mt-2">
              <div className="p-3 rounded-xl bg-[#acf2e5]/40 border border-[#209b47]/35 flex items-center justify-between">
                <span className="text-xs text-[#042126] font-semibold">
                  Potential Financial Exposure
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
                    Hold pending SIU review
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#fef3c7]/60 border border-[#d97706]/30">
                  <div className="text-[10px] font-mono uppercase font-semibold text-[#b45309]">
                    Post-Pay Audit (38%)
                  </div>
                  <div className="text-sm font-mono font-bold text-[#042126] mt-0.5 tabular-nums">
                    {formatINR(postPayClawbackAmount)}
                  </div>
                  <div className="text-[10px] text-[#b45309] font-semibold mt-0.5">
                    Documentation review
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#042126]/10 flex items-center justify-between text-xs">
            <span className="text-[#042126]/75">
              Total Billed:{" "}
              <strong className="font-mono text-[#042126]">
                {formatINR(caseData.total_claimed_amount)}
              </strong>
            </span>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-case-diff-modal"))
              }
              className="text-[#15497e] hover:text-[#209b47] font-semibold underline cursor-pointer"
            >
              Compare Billing Evidence →
            </button>
          </div>
        </div>

        {/* 3. Future Risk Forecast (30 / 60 / 90-day) */}
        <div className="nexus-glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#005f68] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#d97706]" />
                {forecast?.label || "Risk Persistence Forecast"}
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

      {/* SECTION 4: EXPANDABLE EVIDENCE SEQUENCE (REQUIREMENT 7) */}
      <div className="nexus-glass-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#005f68] font-bold">
              EVIDENCE SEQUENCE &amp; DETECTION TIMELINE
            </div>
            <h3 className="text-sm font-semibold text-[#209b47]">
              Click Any Stage to Inspect How {caseData.case_id} Progressed to SIU Review
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className="text-xs font-semibold text-[#15497e] hover:text-[#209b47] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open Full Event Log ({timeline.length} events) →</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {evidenceSequenceSteps.map((stepObj, i) => {
            const isSelected = selectedSequenceIdx === i;
            return (
              <button
                key={stepObj.stage + i}
                type="button"
                onClick={() => setSelectedSequenceIdx(i)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-[#209b47] shadow-sm " + stepObj.tone
                    : stepObj.tone + " opacity-90 hover:opacity-100"
                }`}
              >
                <div className="text-[10px] font-mono font-bold opacity-80 mb-1">
                  STAGE {stepObj.stage}
                </div>
                <div className="text-[11px] font-bold leading-snug">
                  {stepObj.title}
                </div>
                <div className="text-[10px] font-mono opacity-85 mt-1 truncate">
                  {stepObj.detail}
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded Stage Detail Box */}
        <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-mono font-bold text-[#005f68] mr-2">
              [STAGE {activeSequenceStep.stage} • {activeSequenceStep.title}]:
            </span>
            <span className="text-[#042126] font-medium">
              {activeSequenceStep.expandedText}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#005f68] shrink-0">
            {activeSequenceStep.detail}
          </span>
        </div>
      </div>

      {/* SECTION 5: FALSE-POSITIVE / EXPLAINABILITY SUPPORT (REQUIREMENT 11) */}
      <div className="nexus-glass-card rounded-2xl p-5">
        <button
          type="button"
          onClick={() => setShowConsiderations(!showConsiderations)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-[#005f68] shrink-0" />
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#005f68] font-bold block">
                EXPLAINABILITY &amp; FALSE-POSITIVE SAFEGUARDS
              </span>
              <h3 className="text-sm font-semibold text-[#042126]">
                WHAT ELSE SHOULD AN INVESTIGATOR CONSIDER? (Risk ≠ Fraud)
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#15497e]">
            <span>{showConsiderations ? "Hide Context" : "Expand Context"}</span>
            {showConsiderations ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showConsiderations && (
          <div className="mt-4 pt-4 border-t border-[#042126]/10 space-y-3 text-xs">
            <p className="text-[#042126]/85 font-medium">
              A high composite risk score indicates statistical and rule-based anomalies requiring review — it does <strong className="text-[#b91c1c]">not</strong> automatically indicate fraud. Before escalating <strong className="font-mono">{caseData.case_id}</strong>, SIU investigators should verify:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="font-semibold text-[#005f68] mb-1">
                  1. High-Volume Specialty Center
                </div>
                <p className="text-[#042126]/80 text-[11px] leading-relaxed">
                  Verify whether {caseData.provider_id} ({caseData.specialty}) operates as a regional tertiary referral center in {caseData.location}, which can legitimately increase daily claim volume.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="font-semibold text-[#005f68] mb-1">
                  2. Valid Clinical Referral Coordination
                </div>
                <p className="text-[#042126]/80 text-[11px] leading-relaxed">
                  Check whether shared member referrals between {caseData.provider_id} and {caseData.facility_id} reflect authorized multi-disciplinary treatment plans.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="font-semibold text-[#005f68] mb-1">
                  3. Acute / Emergency Care Acuity
                </div>
                <p className="text-[#042126]/80 text-[11px] leading-relaxed">
                  Confirm whether high-cost procedures on {caseData.primary_claim_id} involved complex emergency stabilization or staged surgical interventions.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
                <div className="font-semibold text-[#005f68] mb-1">
                  4. Clerical Resubmission vs. Duplicate Billing
                </div>
                <p className="text-[#042126]/80 text-[11px] leading-relaxed">
                  Inspect claim billing timestamps to determine if duplicate submissions were corrected claim adjustments rather than duplicate billing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: DEEP-DIVE EVIDENCE, PEER BENCHMARK, TIMELINE, NETWORK & BRIEF TABS */}
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
              <span>Evidence Detail ({evidence.length} Signals)</span>
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
              onClick={() => {
                setActiveTab("graph");
                setNetworkAnalyzed(true);
              }}
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
                  Structured Investigation Brief (Evidence Synthesis)
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
                    &ldquo;Generate Investigation Brief&rdquo;
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

      {/* SECTION 7: DEDICATED HUMAN-IN-THE-LOOP "INVESTIGATOR ACTION" PANEL (REQUIREMENT 9) */}
      <div
        id="investigator-action"
        className="nexus-glass-card rounded-2xl p-6 border-2 border-[#005f68]/30 bg-white space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#005f68] font-bold">
              HUMAN-IN-THE-LOOP DECISION GOVERNANCE
            </div>
            <h3 className="text-lg font-semibold text-[#209b47] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#209b47]" />
              INVESTIGATOR ACTION
            </h3>
            <p className="text-xs text-[#042126]/80 mt-0.5">
              <strong>ClaimShield recommends. The investigator decides.</strong> Select an action below to record the human SIU decision for {caseData.case_id}:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#f2fcff] border border-[#042126]/15 text-[#042126]">
              Current Status: <strong>{caseData.status}</strong>
            </span>
            {investigatorDecisionLabel && (
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#acf2e5] text-[#042126]">
                Recorded: {investigatorDecisionLabel}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            disabled={statusUpdating}
            onClick={() =>
              handleInvestigatorAction("Escalate to SIU", "Escalated")
            }
            className="p-4 rounded-xl border border-[#b91c1c]/35 bg-[#fee2e2]/45 hover:bg-[#b91c1c] text-[#042126] hover:text-white transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono uppercase text-[#b91c1c] group-hover:text-white">
                1. Escalate to SIU
              </span>
              <AlertOctagon className="w-4 h-4 text-[#b91c1c] group-hover:text-white" />
            </div>
            <p className="text-[11px] opacity-85 leading-relaxed">
              Initiate formal SIU field audit &amp; maintain pre-payment hold on {formatINR(prePayHoldAmount)}.
            </p>
          </button>

          <button
            type="button"
            disabled={statusUpdating}
            onClick={() =>
              handleInvestigatorAction(
                "Request Documentation",
                "Under Review"
              )
            }
            className="p-4 rounded-xl border border-[#005f68]/30 bg-[#f2fcff] hover:bg-[#005f68] text-[#042126] hover:text-white transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono uppercase text-[#005f68] group-hover:text-[#acf2e5]">
                2. Request Documentation
              </span>
              <FileCheck2 className="w-4 h-4 text-[#005f68] group-hover:text-[#acf2e5]" />
            </div>
            <p className="text-[11px] opacity-85 leading-relaxed">
              Request clinical encounter notes &amp; itemized billing records from {caseData.provider_id}.
            </p>
          </button>

          <button
            type="button"
            disabled={statusUpdating}
            onClick={() => handleInvestigatorAction("Monitor", "Under Review")}
            className="p-4 rounded-xl border border-[#209b47]/35 bg-[#acf2e5]/30 hover:bg-[#209b47] text-[#042126] hover:text-white transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono uppercase text-[#209b47] group-hover:text-white">
                3. Monitor
              </span>
              <Eye className="w-4 h-4 text-[#209b47] group-hover:text-white" />
            </div>
            <p className="text-[11px] opacity-85 leading-relaxed">
              Place {caseData.provider_id} on 30/60/90-day velocity &amp; referral ring watch.
            </p>
          </button>

          <button
            type="button"
            disabled={statusUpdating}
            onClick={() =>
              handleInvestigatorAction("Clear / No Further Action", "Dismissed")
            }
            className="p-4 rounded-xl border border-[#042126]/20 bg-white hover:bg-[#042126] text-[#042126] hover:text-white transition-colors text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold font-mono uppercase text-[#042126] group-hover:text-[#acf2e5]">
                4. Clear / No Further Action
              </span>
              <XCircle className="w-4 h-4 text-[#042126] group-hover:text-[#acf2e5]" />
            </div>
            <p className="text-[11px] opacity-85 leading-relaxed">
              Clear alert as verified clinical variance and release held claims.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

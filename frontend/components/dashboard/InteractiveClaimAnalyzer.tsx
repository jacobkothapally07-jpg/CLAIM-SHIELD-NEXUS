"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  ShieldAlert,
  CheckCircle2,
  Play,
  ArrowRight,
  Activity,
  Sparkles,
  FileSearch,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { InvestigationCase } from "../../types";
import { formatINR, formatSignalName } from "../../lib/format";
import { MagneticButton } from "../common/InteractivePrimitives";

const ANALYSIS_STEPS = [
  { step: "STEP 01", label: "Receiving claim data..." },
  { step: "STEP 02", label: "Checking policy rules (Rule Engine — 40%)..." },
  { step: "STEP 03", label: "Analyzing anomalies (Isolation Forest — 30%)..." },
  { step: "STEP 04", label: "Checking provider/network relationships (NetworkX — 20%)..." },
  { step: "STEP 05", label: "Evaluating temporal patterns (Temporal Velocity — 10%)..." },
  { step: "STEP 06", label: "Calculating composite risk..." },
  { step: "STEP 07", label: "Investigation recommended (Human SIU review)." },
];

function SegmentedRiskBar({
  label,
  blocksFilled,
  colorClass,
  active,
}: {
  label: string;
  blocksFilled: number;
  colorClass: string;
  active: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border transition-colors ${
        active
          ? "bg-white border-[#005f68] shadow-[0_2px_8px_rgba(4,33,38,0.05)]"
          : "bg-[#f2fcff] border-[#042126]/10 opacity-75"
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
        <span
          className={
            active ? "font-bold text-[#042126]" : "text-[#042126]/70"
          }
        >
          {label}
        </span>
        <span className="text-[#005f68] font-semibold">
          {blocksFilled * 10}%
        </span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={idx}
            className={`h-2.5 rounded-sm transition-colors duration-200 ${
              idx < blocksFilled ? colorClass : "bg-[#042126]/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function InteractiveClaimAnalyzer({
  cases,
}: {
  cases: InvestigationCase[];
}) {
  const samplePool = cases.slice(0, 6);
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(
    samplePool[0] || null
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(ANALYSIS_STEPS.length);
  const [labMode, setLabMode] = useState<"dossier" | "simulator">("dossier");

  // Live What-If Sandbox Parameters
  const [simAmount, setSimAmount] = useState(145000);
  const [simExpected, setSimExpected] = useState(32000);
  const [simDailyClaims, setSimDailyClaims] = useState(44);
  const [simDuplicate, setSimDuplicate] = useState(true);
  const [simCrossRegion, setSimCrossRegion] = useState(true);
  const [simReferralLoop, setSimReferralLoop] = useState(true);
  const [simUnbundling, setSimUnbundling] = useState(false);

  useEffect(() => {
    if (!selectedCase && cases.length > 0) {
      setSelectedCase(cases[0]);
    }
  }, [cases, selectedCase]);

  const runLiveSimulation = (targetCase?: InvestigationCase) => {
    const chosen = targetCase || selectedCase;
    if (!chosen) return;
    setSelectedCase(chosen);
    setAnalyzing(true);
    setCurrentStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < ANALYSIS_STEPS.length) {
        setCurrentStep(step);
      } else {
        clearInterval(interval);
        setAnalyzing(false);
        setCurrentStep(ANALYSIS_STEPS.length);
      }
    }, 240);
  };

  if (!selectedCase) return null;

  // Dynamic What-If Calculation
  const costRatio = simAmount / Math.max(1000, simExpected);
  const simSignals: string[] = [];
  let simRuleRaw = 10;
  if (simDuplicate) {
    simRuleRaw += 24;
    simSignals.push("duplicate_billing");
  }
  if (simCrossRegion) {
    simRuleRaw += 26;
    simSignals.push("impossible_timing");
  }
  if (costRatio >= 2.2) {
    simRuleRaw += Math.min(25, Math.round(costRatio * 6));
    simSignals.push("abnormal_billing");
    simSignals.push("upcoding");
  }
  if (simDailyClaims >= 28) {
    simRuleRaw += 18;
    simSignals.push("excessive_utilization");
  }
  if (simUnbundling) {
    simRuleRaw += 15;
    simSignals.push("unbundling");
  }
  if (simReferralLoop) {
    simSignals.push("referral_anomaly");
    simSignals.push("network_anomaly");
  }

  const simRuleScore = Math.min(100, simRuleRaw);
  const simMlScore = Math.min(
    100,
    Math.round(costRatio * 14 + (simDailyClaims / 60) * 45 + (simDuplicate ? 15 : 0))
  );
  const simGraphScore = simReferralLoop ? 88 : 24;
  const simTemporalScore = Math.min(
    100,
    (simCrossRegion ? 55 : 15) + Math.round((simDailyClaims / 60) * 40)
  );
  const simCompositeScore = Math.min(
    100,
    Math.round(
      0.4 * simRuleScore +
        0.3 * simMlScore +
        0.2 * simGraphScore +
        0.1 * simTemporalScore
    )
  );
  const simLevel =
    simCompositeScore >= 81
      ? "CRITICAL"
      : simCompositeScore >= 61
      ? "HIGH"
      : simCompositeScore >= 31
      ? "MEDIUM"
      : "LOW";

  const activeScore = labMode === "simulator" ? simCompositeScore : selectedCase.risk_score;
  const activeLevel = labMode === "simulator" ? simLevel : selectedCase.risk_level;
  const activeRule = labMode === "simulator" ? simRuleScore : selectedCase.rule_score;
  const activeMl = labMode === "simulator" ? simMlScore : selectedCase.ml_score;
  const activeGraph = labMode === "simulator" ? simGraphScore : selectedCase.graph_score;
  const activeTemporal =
    labMode === "simulator" ? simTemporalScore : selectedCase.temporal_score;
  const activeExposure =
    labMode === "simulator"
      ? Math.max(0, simAmount - simExpected)
      : selectedCase.potential_exposure;
  const activeSignals =
    labMode === "simulator" ? simSignals : selectedCase.primary_signals;

  return (
    <section
      id="risk-engine-lab"
      className="nexus-glass-card rounded-2xl p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-[#042126]/10">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#005f68] font-semibold mb-1">
            <Cpu className="w-4 h-4 text-[#209b47]" /> Multi-Signal Claim Verification &amp; What-If Risk Lab
          </div>
          <h3 className="text-xl font-semibold text-[#209b47]">
            Interactive Claim Analysis &amp; What-If Sandbox
          </h3>
          <p className="text-xs text-[#042126]/75 mt-0.5">
            Click &ldquo;ANALYZE CLAIM&rdquo; to step through the 4-engine risk calculation or test custom claim parameters in the What-If Simulator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher: Dossier Mode vs What-If Simulator */}
          <div className="inline-flex p-1 rounded-full bg-[#f2fcff] border border-[#042126]/15 text-xs">
            <button
              type="button"
              onClick={() => setLabMode("dossier")}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors ${
                labMode === "dossier"
                  ? "bg-[#042126] text-white"
                  : "text-[#042126] hover:bg-[#acf2e5]/40"
              }`}
            >
              Flagged Dossiers
            </button>
            <button
              type="button"
              onClick={() => setLabMode("simulator")}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
                labMode === "simulator"
                  ? "bg-[#209b47] text-white"
                  : "text-[#042126] hover:bg-[#acf2e5]/40"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>What-If Simulator</span>
            </button>
          </div>

          <MagneticButton
            onClick={() => runLiveSimulation(selectedCase)}
            disabled={analyzing}
            className="px-5 py-2.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold text-xs flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{analyzing ? "Analyzing Claim..." : "ANALYZE CLAIM"}</span>
          </MagneticButton>
        </div>
      </div>

      {/* Mode 1: Claim Selector Pills OR Mode 2: Live What-If Sliders */}
      {labMode === "dossier" ? (
        <div className="py-4 flex items-center gap-2 overflow-x-auto border-b border-[#042126]/10">
          <span className="text-[11px] font-mono uppercase text-[#005f68] font-semibold shrink-0 mr-1 flex items-center gap-1">
            <FileSearch className="w-3.5 h-3.5 text-[#209b47]" /> Select Claim Dossier:
          </span>
          {samplePool.map((c) => {
            const isSelected = c.case_id === selectedCase.case_id;
            return (
              <button
                key={c.case_id}
                type="button"
                onClick={() => runLiveSimulation(c)}
                className={`px-3.5 py-2 rounded-full text-xs font-mono transition-colors duration-150 shrink-0 border ${
                  isSelected
                    ? "bg-[#209b47] text-white border-[#209b47] font-semibold"
                    : "bg-[#acf2e5]/20 text-[#042126] border-[#042126]/10 hover:bg-[#acf2e5]/45"
                }`}
              >
                {c.primary_claim_id} ({c.case_id}) • {c.risk_score}%
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-5 border-b border-[#042126]/10 bg-[#f2fcff]/70 px-4 rounded-xl my-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-[#005f68] uppercase">
              LIVE WHAT-IF CLAIM PARAMETER SANDBOX (ADJUST SLIDERS TO TEST 4-ENGINE SCORING)
            </div>
            <button
              type="button"
              onClick={() => {
                setSimAmount(145000);
                setSimExpected(32000);
                setSimDailyClaims(44);
                setSimDuplicate(true);
                setSimCrossRegion(true);
                setSimReferralLoop(true);
                setSimUnbundling(false);
              }}
              className="text-xs font-semibold text-[#15497e] hover:text-[#209b47] flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Preset
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-[#042126]/10">
              <div className="flex justify-between font-semibold text-[#042126] mb-1.5">
                <span>Billed Claim Amount</span>
                <span className="font-mono text-[#209b47]">{formatINR(simAmount)}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={250000}
                step={5000}
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full accent-[#209b47]"
              />
              <div className="text-[11px] text-[#042126]/65 mt-1">
                Peer Expected Cost: {formatINR(simExpected)} ({costRatio.toFixed(1)}x benchmark)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#042126]/10">
              <div className="flex justify-between font-semibold text-[#042126] mb-1.5">
                <span>Provider Daily Claim Velocity</span>
                <span className="font-mono text-[#005f68]">{simDailyClaims} claims/day</span>
              </div>
              <input
                type="range"
                min={4}
                max={65}
                step={1}
                value={simDailyClaims}
                onChange={(e) => setSimDailyClaims(Number(e.target.value))}
                className="w-full accent-[#209b47]"
              />
              <div className="text-[11px] text-[#042126]/65 mt-1">
                Specialty Peer Baseline: 9 claims/day
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#042126]/10 grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#042126]">
                <input
                  type="checkbox"
                  checked={simDuplicate}
                  onChange={(e) => setSimDuplicate(e.target.checked)}
                  className="accent-[#209b47]"
                />
                <span>Duplicate Claim</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#042126]">
                <input
                  type="checkbox"
                  checked={simCrossRegion}
                  onChange={(e) => setSimCrossRegion(e.target.checked)}
                  className="accent-[#209b47]"
                />
                <span>Cross-Region (&lt;1h)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#042126]">
                <input
                  type="checkbox"
                  checked={simReferralLoop}
                  onChange={(e) => setSimReferralLoop(e.target.checked)}
                  className="accent-[#209b47]"
                />
                <span>Circular Referral</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-[#042126]">
                <input
                  type="checkbox"
                  checked={simUnbundling}
                  onChange={(e) => setSimUnbundling(e.target.checked)}
                  className="accent-[#209b47]"
                />
                <span>Split Unbundling</span>
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
        {/* Left Column: 5-Step Simulated Engine Sequence & Block Risk Bars (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-4 rounded-xl bg-[#f2fcff] border border-[#042126]/10">
            <div className="flex items-center justify-between text-xs font-mono text-[#005f68] font-semibold mb-3">
              <span>ENGINE TELEMETRY SEQUENCE</span>
              <span className="text-[#209b47]">
                {analyzing ? "ACTIVE SCAN" : "COMPLETE (142ms)"}
              </span>
            </div>

            <div className="space-y-2">
              {ANALYSIS_STEPS.map((st, idx) => {
                const done = idx < currentStep;
                const active = analyzing && idx === currentStep;
                return (
                  <div
                    key={st.step}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      active
                        ? "bg-[#acf2e5]/40 border-[#005f68] text-[#042126] font-semibold"
                        : done
                        ? "bg-white border-[#042126]/10 text-[#042126]"
                        : "bg-white/60 border-[#042126]/5 text-[#042126]/45"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold text-[#005f68]">
                        {st.step}
                      </span>
                      <span>{st.label}</span>
                    </div>
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-[#209b47] shrink-0" />
                    ) : active ? (
                      <Activity className="w-4 h-4 text-[#005f68] animate-spin shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segmented Block Risk Meter */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-wider text-[#005f68] font-semibold">
              Multi-Tier Claim Risk Spectrum
            </div>
            <SegmentedRiskBar
              label="LOW RISK (0–30)"
              blocksFilled={activeLevel === "LOW" ? 3 : 2}
              colorClass="bg-[#209b47]"
              active={activeLevel === "LOW"}
            />
            <SegmentedRiskBar
              label="MEDIUM RISK (31–60)"
              blocksFilled={activeLevel === "MEDIUM" ? 6 : 5}
              colorClass="bg-[#d97706]"
              active={activeLevel === "MEDIUM"}
            />
            <SegmentedRiskBar
              label="HIGH RISK (61–80)"
              blocksFilled={activeLevel === "HIGH" ? 8 : 7}
              colorClass="bg-[#c53030]"
              active={activeLevel === "HIGH"}
            />
            <SegmentedRiskBar
              label="CRITICAL RISK (81–100)"
              blocksFilled={
                activeLevel === "CRITICAL" ? Math.max(8, Math.round(activeScore / 10)) : 9
              }
              colorClass="bg-[#b91c1c]"
              active={activeLevel === "CRITICAL"}
            />
          </div>
        </div>

        {/* Right Column: Live Claim Intelligence Readout (7 cols — Deep Obsidian Pine Card #042126) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#042126] text-[#f2fcff] border border-[#acf2e5]/35 flex flex-col justify-between relative overflow-hidden">
          {analyzing && (
            <div className="absolute inset-x-0 top-0 h-1 bg-[#209b47] animate-data-stream" />
          )}

          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#acf2e5]/20">
              <div>
                <div className="text-xs font-mono text-[#acf2e5]">
                  {labMode === "simulator"
                    ? "WHAT-IF SANDBOX SIMULATION // SYNTHETIC CLAIM TEST"
                    : `CLAIM #${selectedCase.primary_claim_id} // DOSSIER ${selectedCase.case_id}`}
                </div>
                <h4 className="text-2xl font-semibold text-white mt-1">
                  {labMode === "simulator"
                    ? "Simulated Claim Scenario"
                    : `${selectedCase.provider_id} • ${selectedCase.provider_name}`}
                </h4>
                <div className="text-xs text-[#f2fcff]/80 mt-1">
                  Specialty: <strong className="text-white">{selectedCase.specialty}</strong> •{" "}
                  Facility: <strong className="text-white">{selectedCase.facility_id} ({selectedCase.location})</strong> •{" "}
                  Member: <strong className="text-[#acf2e5] font-mono">{selectedCase.member_id}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-mono uppercase text-[#acf2e5]">
                  Composite Risk Score
                </div>
                <div
                  className={`text-3xl font-bold font-mono mt-0.5 px-2.5 py-0.5 rounded inline-block ${
                    activeScore >= 61
                      ? "bg-[#fee2e2] text-[#b91c1c]"
                      : activeScore >= 31
                      ? "bg-[#fef3c7] text-[#b45309]"
                      : "bg-[#acf2e5] text-[#042126]"
                  }`}
                >
                  {analyzing ? "--" : `${activeScore}%`}
                </div>
                <div className="text-[11px] text-[#f2fcff]/80 mt-1">
                  Tier: <strong className="text-[#acf2e5]">{activeLevel}</strong>
                </div>
              </div>
            </div>

            {/* Detected Anomalies List */}
            <div className="py-5">
              <div className="text-xs font-mono uppercase tracking-wider text-[#acf2e5] mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#209b47]" />
                Detected Correlated Anomalies ({activeSignals.length})
              </div>
              {activeSignals.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/25 text-xs text-[#acf2e5]">
                  No high-risk FWA signals triggered under current What-If parameters. Claim aligns with peer baseline.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeSignals.map((sig) => (
                    <div
                      key={sig}
                      className="p-3 rounded-lg bg-[#005f68]/40 border border-[#acf2e5]/25 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-white">
                        • {formatSignalName(sig)}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c]">
                        TRIGGERED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Engine Sub-Scores (4 Weighted Detection Engines) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-t border-[#acf2e5]/20 text-xs">
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">
                  RULE ENGINE (40%)
                </div>
                <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                  {activeRule} / 100
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">
                  ISOLATION FOREST (30%)
                </div>
                <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                  {activeMl} / 100
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">
                  NETWORK INTEL (20%)
                </div>
                <div className="text-base font-bold text-white mt-0.5 tabular-nums">
                  {activeGraph} / 100
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">
                  TEMPORAL (10%)
                </div>
                <div className="text-base font-bold text-[#acf2e5] mt-0.5 tabular-nums">
                  {activeTemporal} / 100
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Banner */}
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              activeScore >= 61
                ? "bg-[#fee2e2] text-[#042126] border-[#b91c1c]/30"
                : "bg-[#acf2e5] text-[#042126] border-[#209b47]/30"
            }`}
          >
            <div>
              <div
                className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                  activeScore >= 61 ? "text-[#b91c1c]" : "text-[#005f68]"
                }`}
              >
                Multi-Signal Risk Engine Recommendation (Human-in-the-Loop) • Exposure: {formatINR(activeExposure)}
              </div>
              <div className="text-sm font-bold text-[#042126] mt-0.5 flex items-center gap-2">
                <Sparkles
                  className={`w-4 h-4 ${
                    activeScore >= 61 ? "text-[#b91c1c]" : "text-[#209b47]"
                  }`}
                />
                <span>
                  {activeScore >= 61
                    ? "INVESTIGATION RECOMMENDED — ROUTE TO HUMAN SIU INVESTIGATOR"
                    : "WITHIN PEER BASELINE — NO SIU ESCALATION REQUIRED"}
                </span>
              </div>
            </div>

            <Link
              href={`/cases/${selectedCase.case_id}`}
              className="px-4 py-2 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Investigate Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

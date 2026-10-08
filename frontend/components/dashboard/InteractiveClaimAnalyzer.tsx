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
} from "lucide-react";
import { InvestigationCase } from "../../types";
import { formatINR, formatSignalName } from "../../lib/format";
import { MagneticButton } from "../common/InteractivePrimitives";

const ANALYSIS_STEPS = [
  { step: "STEP 01", label: "Receiving synthetic claim & encounter telemetry..." },
  { step: "STEP 02", label: "Checking provider specialty & regional history..." },
  { step: "STEP 03", label: "Detecting cross-claim & temporal anomalies..." },
  { step: "STEP 04", label: "Running Isolation Forest + NetworkX fraud-risk models..." },
  { step: "STEP 05", label: "Generating explainable SIU recommendation..." },
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
  const [currentStep, setCurrentStep] = useState(5);

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
    }, 340);
  };

  if (!selectedCase) return null;

  const score = selectedCase.risk_score;
  const level = selectedCase.risk_level;

  return (
    <section
      id="risk-engine-lab"
      className="nexus-glass-card rounded-2xl p-6 lg:p-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-[#042126]/10">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#005f68] font-semibold mb-1">
            <Cpu className="w-4 h-4 text-[#209b47]" /> Interactive AI Claim-Analysis &amp; Risk Telemetry Lab
          </div>
          <h3 className="text-xl font-semibold text-[#209b47]">
            Real-Time Claim Verification &amp; Anomaly Inspection
          </h3>
          <p className="text-xs text-[#042126]/75 mt-0.5">
            Select any flagged synthetic claim dossier below and trigger the 5-stage multi-engine verification sequence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <MagneticButton
            onClick={() => runLiveSimulation(selectedCase)}
            disabled={analyzing}
            className="px-5 py-2.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold text-xs flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{analyzing ? "Running AI Verification..." : "Analyze Claim"}</span>
          </MagneticButton>

          <Link
            href={`/cases/${selectedCase.case_id}`}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-[#042126] text-[#042126] hover:text-white border-[1.5px] border-[#042126] text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150"
          >
            <span>Open Full SIU Dossier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Claim Selector Pills */}
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
              blocksFilled={level === "LOW" ? 3 : 2}
              colorClass="bg-[#209b47]"
              active={level === "LOW"}
            />
            <SegmentedRiskBar
              label="MEDIUM RISK (31–60)"
              blocksFilled={level === "MEDIUM" ? 6 : 5}
              colorClass="bg-[#d97706]"
              active={level === "MEDIUM"}
            />
            <SegmentedRiskBar
              label="HIGH RISK (61–80)"
              blocksFilled={level === "HIGH" ? 8 : 7}
              colorClass="bg-[#c53030]"
              active={level === "HIGH"}
            />
            <SegmentedRiskBar
              label="CRITICAL RISK (81–100)"
              blocksFilled={
                level === "CRITICAL" ? Math.round(score / 10) : 9
              }
              colorClass="bg-[#b91c1c]"
              active={level === "CRITICAL"}
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
                  CLAIM #{selectedCase.primary_claim_id} // DOSSIER {selectedCase.case_id}
                </div>
                <h4 className="text-2xl font-semibold text-white mt-1">
                  {selectedCase.provider_id} • {selectedCase.provider_name}
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
                    score >= 81
                      ? "bg-[#fee2e2] text-[#b91c1c]"
                      : "bg-[#fef3c7] text-[#b45309]"
                  }`}
                >
                  {analyzing ? "--" : `${score}%`}
                </div>
                <div className="text-[11px] text-[#f2fcff]/80 mt-1">
                  AI Confidence: <strong className="text-[#acf2e5]">96.4%</strong>
                </div>
              </div>
            </div>

            {/* Detected Anomalies List */}
            <div className="py-5">
              <div className="text-xs font-mono uppercase tracking-wider text-[#acf2e5] mb-3 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#209b47]" />
                Detected Correlated Anomalies ({selectedCase.primary_signals.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedCase.primary_signals.map((sig) => (
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
            </div>

            {/* Engine Sub-Scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-t border-[#acf2e5]/20 text-xs">
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">RULE ENGINE</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedCase.rule_score}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">ISOLATION FOREST</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedCase.ml_score}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">NETWORKX GRAPH</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedCase.graph_score}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#005f68]/30 border border-[#acf2e5]/20">
                <div className="text-[10px] font-mono text-[#acf2e5]">EXPOSURE</div>
                <div className="text-base font-bold text-[#acf2e5] mt-0.5">
                  {formatINR(selectedCase.potential_exposure)}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Banner */}
          <div className="mt-4 p-4 rounded-xl bg-[#fee2e2] text-[#042126] border border-[#b91c1c]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#b91c1c]">
                AI Engine Recommendation (Human-in-the-Loop)
              </div>
              <div className="text-sm font-bold text-[#042126] mt-0.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#b91c1c]" />
                <span>FLAG FOR HUMAN SIU REVIEW — POTENTIAL FWA PATTERN</span>
              </div>
            </div>

            <Link
              href={`/cases/${selectedCase.case_id}`}
              className="px-4 py-2 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white font-semibold text-xs transition-colors shrink-0"
            >
              Inspect Evidence &amp; Graph →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

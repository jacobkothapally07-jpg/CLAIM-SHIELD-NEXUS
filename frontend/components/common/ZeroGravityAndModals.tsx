"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  X,
  Terminal,
  Sparkles,
  ArrowRight,
  GitCompare,
  ShieldAlert,
  CheckCircle2,
  Play,
  AlertTriangle,
} from "lucide-react";

/**
 * 1. ZERO-GRAVITY PARTICLE PHYSICS LAYER
 * Subtle, translucent floating particle canvas behind dashboard cards that drifts upward
 * and gently repels on mouse movement. Uses strict Acentra Health matte clinical tokens.
 */
export function ZeroGravityParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const mouse = { x: -9999, y: -9999, radius: 135 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    const palette = [
      "rgba(32, 155, 71, 0.22)", // Forest Green #209b47
      "rgba(0, 95, 104, 0.20)", // Deep Ocean Teal #005f68
      "rgba(21, 73, 126, 0.16)", // Slate Navy #15497e
      "rgba(4, 33, 38, 0.14)", // Obsidian Pine #042126
    ];

    const particleCount = 46;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: ((i * 197) % 100) * 0.01 * width,
      y: ((i * 353) % 100) * 0.01 * height,
      vx: (((i * 73) % 100) * 0.01 - 0.5) * 0.25,
      vy: -0.28 - ((i * 41) % 100) * 0.0045, // Upward zero-gravity drift
      size: 2 + (i % 3) * 1.1,
      color: palette[i % palette.length],
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Upward drift
        p.x += p.vx;
        p.y += p.vy;

        // Gentle mouse repulsion physics
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < mouse.radius * mouse.radius && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (mouse.radius - dist) / mouse.radius;
          p.x += (dx / dist) * force * 2.4;
          p.y += (dy / dist) * force * 2.4;
        }

        // Wrap around screen edges smoothly
        if (p.y < -12) {
          p.y = height + 12;
          p.x = Math.random() * width;
        }
        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Subtle connecting filaments between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const ldx = p.x - p2.x;
          const ldy = p.y - p2.y;
          const lDistSq = ldx * ldx + ldy * ldy;
          if (lDistSq < 110 * 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = "rgba(0, 95, 104, 0.055)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-10"
    />
  );
}

/**
 * 2. ANIMATED TYPEWRITER RISK ENGINE TERMINAL POPOVER
 * Triggered when clicking "Launch Risk Analysis" in the header or dashboard.
 */
const AGENT_SIMULATION_LOGS = [
  {
    agent: "INGESTION_AGENT",
    weight: "SEED=42",
    text: "Streaming 10,000 synthetic claims across 500 providers & 1,216 referral edges...",
    signal: null,
  },
  {
    agent: "RULE_ENGINE_AGENT",
    weight: "40% WT",
    text: "Auditing PROV-0042 (CLM-001842): Duplicate submission detected within 14m + Cross-region encounter <28m.",
    signal: "DUPLICATE_BILLING (+20) • IMPOSSIBLE_TIMING (+25)",
  },
  {
    agent: "ISOLATION_FOREST_AGENT",
    weight: "30% WT",
    text: "Evaluating 150-tree statistical outlier model: Billed ₹1,45,000 vs ₹32,000 specialty baseline (z = +4.1σ).",
    signal: "STATISTICAL_ANOMALY (ML Score: 92/100)",
  },
  {
    agent: "NETWORKX_GRAPH_AGENT",
    weight: "20% WT",
    text: "Tracing referral topology: Closed-loop reciprocity ring detected between PROV-0042 ↔ PROV-0108 ↔ FAC-0004.",
    signal: "REFERRAL_RING_TOPOLOGY (Graph Score: 89/100)",
  },
  {
    agent: "TEMPORAL_VELOCITY_AGENT",
    weight: "10% WT",
    text: "Measuring claim velocity: 44 claims/day burst (>4.8x specialty peer average).",
    signal: "TEMPORAL_VELOCITY_SPIKE (Temporal Score: 95/100)",
  },
  {
    agent: "SIU_SYNTHESIS_AGENT",
    weight: "COMPOSITE",
    text: "Composite Risk = 94 / 100 (CRITICAL). Routing CASE-1842 to human SIU investigator for final decision.",
    signal: "INVESTIGATION_RECOMMENDED • EXPOSURE ₹1,84,500",
  },
];

export function RiskEngineTerminalModal({
  open,
  onClose,
  onOpenBillingDiff,
}: {
  open: boolean;
  onClose: () => void;
  onOpenBillingDiff: () => void;
}) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setVisibleLines(0);
    setTypedChars(0);
    setRunning(true);
  }, [open]);

  useEffect(() => {
    if (!open || !running) return;
    if (visibleLines >= AGENT_SIMULATION_LOGS.length) {
      setRunning(false);
      return;
    }

    const currentLog = AGENT_SIMULATION_LOGS[visibleLines];
    if (typedChars < currentLog.text.length) {
      const timer = setTimeout(() => {
        setTypedChars((prev) => prev + 3);
      }, 16);
      return () => clearTimeout(timer);
    } else {
      const nextLineTimer = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
        setTypedChars(0);
      }, 220);
      return () => clearTimeout(nextLineTimer);
    }
  }, [open, running, visibleLines, typedChars]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#042126]/65 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[#042126] text-[#f2fcff] border border-[#acf2e5]/40 shadow-[0_18px_45px_rgba(4,33,38,0.35)] overflow-hidden">
        {/* Terminal Top Header */}
        <div className="px-5 py-3.5 bg-[#005f68]/45 border-b border-[#acf2e5]/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-[#acf2e5]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#acf2e5]">
              CLAIMSHIELD MULTI-AGENT RISK ENGINE // LIVE TELEMETRY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#209b47] text-white font-semibold">
              {running ? "AGENTS ACTIVE" : "SCAN COMPLETE"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#acf2e5] hover:bg-[#005f68] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Typewriter Stream Body */}
        <div className="p-5 space-y-3 font-mono text-xs min-h-[340px] max-h-[65vh] overflow-y-auto bg-[#042126]">
          {AGENT_SIMULATION_LOGS.slice(0, visibleLines + 1).map((item, idx) => {
            if (!item) return null;
            const isCurrent = idx === visibleLines && running;
            const displayedText = isCurrent
              ? item.text.slice(0, typedChars)
              : item.text;
            const showSignal = !isCurrent || typedChars >= item.text.length;

            return (
              <div
                key={item.agent}
                className="p-3.5 rounded-xl bg-[#005f68]/25 border border-[#acf2e5]/20 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#acf2e5] font-bold">
                    [{item.agent}]
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#042126] text-[#acf2e5] border border-[#acf2e5]/25 text-[10px]">
                    {item.weight}
                  </span>
                </div>
                <div className="text-[#f2fcff] leading-relaxed">
                  &gt; {displayedText}
                  {isCurrent && (
                    <span className="inline-block w-2 h-3.5 bg-[#209b47] ml-1 animate-pulse" />
                  )}
                </div>
                {showSignal && item.signal && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] text-[10px] font-bold">
                      <ShieldAlert className="w-3 h-3" />
                      {item.signal}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Verdict & Action Bar */}
        <div className="px-5 py-4 bg-[#005f68]/35 border-t border-[#acf2e5]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#209b47] shrink-0" />
            <span className="text-[#f2fcff]/90">
              Flagship Verdict:{" "}
              <strong className="text-[#acf2e5] font-mono">
                CASE-1842 (94/100 CRITICAL)
              </strong>{" "}
              — Human SIU decision required
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setVisibleLines(0);
                setTypedChars(0);
                setRunning(true);
              }}
              className="px-3.5 py-2 rounded-full bg-[#042126] hover:bg-[#005f68] text-[#acf2e5] border border-[#acf2e5]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3 h-3" />
              <span>Replay Scan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBillingDiff();
              }}
              className="px-4 py-2 rounded-full bg-[#acf2e5] hover:bg-white text-[#042126] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Inspect CASE-1842 Billing Diff</span>
            </button>

            <Link
              href="/cases/CASE-1842"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Open Full Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. SIDE-BY-SIDE BILLING DIFF MODAL FOR FLAGSHIP CASE-1842
 * Opens when clicking CASE-1842 in the sidebar, queue, or header diff action.
 */
export function CaseBillingDiffModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const diffRows = [
    {
      field: "Claim ID & Encounter Pair",
      baseline: "CLM-001842-BASE (Primary Submission)",
      flagged: "CLM-001842 + CLM-001842-DUP (Duplicate Pair)",
      delta: "Duplicate Billing (+20 pts)",
      critical: true,
    },
    {
      field: "Procedure Code & Billed Amount",
      baseline: "PROC-304 • Expected Peer Cost: ₹32,000",
      flagged: "PROC-304 • Billed Amount: ₹1,45,000",
      delta: "+₹1,13,000 (+353% Upcoding Outlier)",
      critical: true,
    },
    {
      field: "Encounter Timestamp & Region",
      baseline: "2026-05-12 09:15 • Region-A (FAC-0004)",
      flagged: "2026-05-12 09:43 • Region-C (FAC-0019)",
      delta: "28m gap across regions (Impossible Timing +25 pts)",
      critical: true,
    },
    {
      field: "Provider Daily Claim Velocity",
      baseline: "9 claims / day (Specialty Peer Average)",
      flagged: "44 claims / day (PROV-0042 Peak Burst)",
      delta: "4.8x Peer Utilization Spike (+15 pts)",
      critical: false,
    },
    {
      field: "Referral Network Topology",
      baseline: "12% Open-Network Referral Baseline",
      flagged: "78% Closed-Loop Ring (PROV-0042 ↔ PROV-0108)",
      delta: "6.5x Reciprocal Referral Concentration",
      critical: true,
    },
    {
      field: "Total Case Financial Exposure",
      baseline: "₹32,000 Standard Adjudicated Benchmark",
      flagged: "₹1,84,500 Total Flagged Exposure",
      delta: "Pre-Pay Hold Eligible: ₹1,14,390 (62%)",
      critical: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#042126]/65 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white text-[#042126] border border-[#042126]/20 shadow-[0_18px_45px_rgba(4,33,38,0.3)] overflow-hidden">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#042126] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#acf2e5]">
              <GitCompare className="w-4 h-4 text-[#209b47]" />
              <span>SIDE-BY-SIDE BILLING &amp; ENCOUNTER DIFF // CASE-1842</span>
              <span className="px-2 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c] font-bold text-[10px]">
                RISK SCORE: 94 / 100 (CRITICAL)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mt-0.5">
              PROV-0042 (Apex Multispecialty Center) — Expected Baseline vs. Flagged Submission
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#acf2e5] hover:bg-[#005f68] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diff Comparison Table */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-4 bg-[#f2fcff]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-white border border-[#005f68]/25">
              <div className="text-[10px] font-mono uppercase font-bold text-[#005f68]">
                COLUMN A • EXPECTED SPECIALTY PEER BASELINE
              </div>
              <div className="text-xs font-semibold text-[#042126] mt-0.5">
                Standard Clinical Encounter &amp; Fee Schedule Norm
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#fee2e2]/55 border border-[#b91c1c]/35">
              <div className="text-[10px] font-mono uppercase font-bold text-[#b91c1c]">
                COLUMN B • FLAGGED SUBMISSION (CASE-1842 • PROV-0042)
              </div>
              <div className="text-xs font-semibold text-[#042126] mt-0.5">
                6 Correlated Multi-Engine FWA Signals Triggered
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#042126]/15 overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#042126] text-white font-mono text-[11px] uppercase">
                  <th className="py-3 px-4">Audit Dimension</th>
                  <th className="py-3 px-4">Expected Peer Baseline</th>
                  <th className="py-3 px-4">Flagged Claim Submission</th>
                  <th className="py-3 px-4">Detected Variance / Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#042126]/10">
                {diffRows.map((row) => (
                  <tr key={row.field} className="hover:bg-[#acf2e5]/15">
                    <td className="py-3 px-4 font-semibold text-[#042126]">
                      {row.field}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#005f68] bg-[#f2fcff]/50">
                      {row.baseline}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-[#b91c1c] bg-[#fee2e2]/25">
                      {row.flagged}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                          row.critical
                            ? "bg-[#fee2e2] text-[#b91c1c]"
                            : "bg-[#fef3c7] text-[#b45309]"
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {row.delta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#042126]/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-[#042126]/75 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#209b47]" />
            <span>
              Human-in-the-Loop SIU Review: Evidence supports{" "}
              <strong className="text-[#042126]">Pre-Payment Hold</strong> pending audit.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white hover:bg-[#042126] text-[#042126] hover:text-white border-[1.5px] border-[#042126] text-xs font-semibold transition-colors"
            >
              Close Diff
            </button>
            <Link
              href="/cases/CASE-1842"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Open Full CASE-1842 Investigation Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

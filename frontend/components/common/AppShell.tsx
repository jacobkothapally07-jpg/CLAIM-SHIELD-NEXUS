"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  FileSpreadsheet,
  ListChecks,
  Network,
  Users,
  BarChart3,
  Settings,
  Database,
  Sparkles,
  ArrowUpRight,
  GitCompare,
} from "lucide-react";
import { SmoothScrollAndSpotlight } from "./InteractivePrimitives";
import {
  ZeroGravityParticleCanvas,
  RiskEngineTerminalModal,
  CaseBillingDiffModal,
} from "./ZeroGravityAndModals";

const SIDEBAR_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "SIU Queue", href: "/queue", icon: ListChecks },
  { name: "Claims", href: "/claims", icon: FileSpreadsheet },
  { name: "Network Intelligence", href: "/network", icon: Network },
  { name: "Providers", href: "/providers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [riskTerminalOpen, setRiskTerminalOpen] = useState(false);
  const [billingDiffOpen, setBillingDiffOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 18);
    };
    const onOpenTerminal = () => setRiskTerminalOpen(true);
    const onOpenDiff = () => setBillingDiffOpen(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("open-risk-analysis-modal", onOpenTerminal);
    window.addEventListener("open-case-diff-modal", onOpenDiff);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("open-risk-analysis-modal", onOpenTerminal);
      window.removeEventListener("open-case-diff-modal", onOpenDiff);
    };
  }, []);

  const currentModule =
    SIDEBAR_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    )?.name || "Case Investigation Dossier";

  return (
    <SmoothScrollAndSpotlight>
      <div className="min-h-screen bg-[#f2fcff] nexus-grid-bg text-[#042126] flex relative">
        {/* 1. Interactive Zero-Gravity Floating Particle Layer Behind Cards */}
        <ZeroGravityParticleCanvas />

        {/* Grounded Acentra Obsidian Pine Left Command Rail (#042126) */}
        <aside className="w-64 shrink-0 bg-[#042126] border-r border-[#005f68]/40 flex flex-col justify-between sticky top-0 h-screen z-30 text-[#f2fcff]">
          <div>
            {/* Brand Identity */}
            <div className="p-5 border-b border-[#acf2e5]/15">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-[#209b47] flex items-center justify-center text-white transition-colors group-hover:bg-[#1b843c] shadow-sm">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div
                    className="text-[15px] font-semibold tracking-[0.04em] leading-tight text-white"
                    style={{
                      fontFamily:
                        "'Plus Jakarta Sans', 'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                    }}
                  >
                    CLAIMSHIELD{" "}
                    <span className="text-[#acf2e5] font-medium">NEXUS</span>
                  </div>
                  <div className="text-[10px] text-[#acf2e5]/85 font-mono tracking-[0.08em] mt-0.5">
                    ACENTRA HEALTH SIU
                  </div>
                </div>
              </Link>
            </div>

            {/* Primary SIU Navigation */}
            <div className="px-3.5 py-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#acf2e5]/70 px-3 mb-2.5">
                Intelligence Modules
              </div>
              <nav className="space-y-1">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                        active
                          ? "bg-[#209b47] text-white"
                          : "text-[#f2fcff]/80 hover:text-white hover:bg-[#005f68]/60"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? "text-white" : "text-[#acf2e5]"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Priority Flagship Dossier (CASE-1842, Score 94/100, PROV-0042) Pinned in Sidebar */}
              <div className="mt-6 pt-5 border-t border-[#acf2e5]/15 px-1.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#acf2e5]/70 px-1 mb-2.5">
                  Priority Flagship Dossier
                </div>
                <div className="p-3.5 rounded-xl bg-[#005f68]/35 border border-[#acf2e5]/30 hover:border-[#acf2e5] transition duration-150 space-y-2">
                  <button
                    type="button"
                    onClick={() => setBillingDiffOpen(true)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold font-mono text-[#acf2e5] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#209b47]" /> CASE-1842
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c]">
                        94 / 100
                      </span>
                    </div>
                    <div className="text-xs text-white font-semibold flex items-center justify-between">
                      <span>PROV-0042 • 6 Signals</span>
                      <GitCompare className="w-3.5 h-3.5 text-[#acf2e5] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-[11px] text-[#f2fcff]/75 mt-0.5">
                      Click for Side-by-Side Billing Diff
                    </div>
                  </button>

                  <div className="pt-2 border-t border-[#acf2e5]/15 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBillingDiffOpen(true)}
                      className="text-[#acf2e5] hover:underline font-mono font-semibold"
                    >
                      Compare Diff
                    </button>
                    <Link
                      href="/cases/CASE-1842"
                      className="text-white hover:text-[#acf2e5] font-semibold flex items-center gap-0.5"
                    >
                      <span>Open Dossier</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Human-in-the-Loop Governance Notice */}
          <div className="p-4 border-t border-[#acf2e5]/15 bg-[#042126]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#acf2e5]">
              <Database className="w-3.5 h-3.5 text-[#209b47] shrink-0" />
              <span>RANDOM_SEED = 42</span>
            </div>
            <p className="text-[11px] text-[#f2fcff]/80 mt-1.5 leading-relaxed">
              ClaimShield prioritizes and explains suspicious cases. Final investigation decisions remain with SIU investigators.
            </p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 relative z-20">
          {/* Crisp Enterprise Sticky Top Bar */}
          <header
            className={`h-16 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors duration-150 ${
              scrolled
                ? "bg-white border-b border-[#042126]/15 shadow-[0_2px_10px_rgba(4,33,38,0.05)]"
                : "bg-white/95 border-b border-[#042126]/10"
            }`}
          >
            {/* Clean Active Workspace Indicator (No Redundant Navigation Flow) */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-[#042126]">
                {currentModule}
              </span>
              <span className="text-[#042126]/25 text-xs">•</span>
              <span className="hidden sm:inline text-xs text-[#005f68] font-medium">
                SIU Investigation Intelligence Platform
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#acf2e5] text-[#042126] border border-[#042126]/10">
                <span className="w-2 h-2 rounded-full bg-[#209b47]" />
                SYNTHETIC DATA • DEMONSTRATION ENVIRONMENT
              </span>

              <button
                type="button"
                onClick={() => setRiskTerminalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#209b47] hover:bg-[#1b843c] text-white transition-all duration-150 hover:-translate-y-[1px] shadow-[0_3px_8px_rgba(4,33,38,0.1)]"
              >
                <span>Launch Risk Analysis</span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-6 lg:px-10 py-7 max-w-[1560px] w-full mx-auto">
            {children}
          </main>
        </div>

        {/* 2. Animated Risk Engine Typewriter Popover */}
        <RiskEngineTerminalModal
          open={riskTerminalOpen}
          onClose={() => setRiskTerminalOpen(false)}
          onOpenBillingDiff={() => setBillingDiffOpen(true)}
        />

        {/* 3. Side-by-Side Billing Diff Modal for CASE-1842 */}
        <CaseBillingDiffModal
          open={billingDiffOpen}
          onClose={() => setBillingDiffOpen(false)}
        />
      </div>
    </SmoothScrollAndSpotlight>
  );
}

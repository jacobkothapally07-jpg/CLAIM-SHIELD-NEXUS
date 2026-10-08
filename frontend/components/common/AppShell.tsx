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
} from "lucide-react";
import { SmoothScrollAndSpotlight } from "./InteractivePrimitives";

const SIDEBAR_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "SIU Queue", href: "/queue", icon: ListChecks },
  { name: "Claims", href: "/claims", icon: FileSpreadsheet },
  { name: "Network Intelligence", href: "/network", icon: Network },
  { name: "Providers", href: "/providers", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const TOP_NAV_LINKS = [
  { label: "Product", href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Risk Engine", href: "/#risk-engine-lab" },
  { label: "Analytics", href: "/analytics" },
  { label: "About", href: "/settings" },
  { label: "Demo", href: "/cases/CASE-1842" },
];

const WORKFLOW_JOURNEY = [
  { step: "1", label: "Overview", href: "/" },
  { step: "2", label: "SIU Queue", href: "/queue" },
  { step: "3", label: "Case & Evidence (CASE-1842)", href: "/cases/CASE-1842" },
  { step: "4", label: "Network Intelligence", href: "/network" },
  { step: "5", label: "Analytics", href: "/analytics" },
  { step: "6", label: "Governance & Rules", href: "/settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 18);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <SmoothScrollAndSpotlight>
      <div className="min-h-screen bg-[#f2fcff] nexus-grid-bg text-[#042126] flex">
        {/* Grounded Acentra Obsidian Pine Left Command Rail (#042126) */}
        <aside className="w-64 shrink-0 bg-[#042126] border-r border-[#005f68]/40 flex flex-col justify-between sticky top-0 h-screen z-30 text-[#f2fcff]">
          <div>
            {/* Brand Identity */}
            <div className="p-5 border-b border-[#acf2e5]/15">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-[#209b47] flex items-center justify-center text-white transition-colors group-hover:bg-[#1b843c]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold tracking-tight text-sm text-white">
                    CLAIMSHIELD NEXUS
                  </div>
                  <div className="text-[11px] text-[#acf2e5] font-mono">
                    ACENTRA HEALTH SIU
                  </div>
                </div>
              </Link>
            </div>

            {/* Primary SIU Navigation */}
            <div className="px-3.5 py-5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#acf2e5]/70 px-3 mb-2.5">
                Investigation Modules
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

              {/* Featured CASE-1842 Quick Launch */}
              <div className="mt-6 pt-5 border-t border-[#acf2e5]/15 px-1.5">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#acf2e5]/70 px-1 mb-2.5">
                  Flagship Demo Case
                </div>
                <Link
                  href="/cases/CASE-1842"
                  className="block p-3.5 rounded-xl bg-[#005f68]/35 border border-[#acf2e5]/30 hover:border-[#acf2e5] transition duration-150 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold font-mono text-[#acf2e5] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#209b47]" /> CASE-1842
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#fee2e2] text-[#b91c1c]">
                      94 / 100 CRITICAL
                    </span>
                  </div>
                  <div className="text-xs text-white font-semibold flex items-center justify-between">
                    <span>PROV-0042 • 6 Signals</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#acf2e5] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] text-[#f2fcff]/75 mt-0.5">
                    Duplicate, Timing, Network &amp; Spike
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Human-in-the-Loop Governance Notice */}
          <div className="p-4 border-t border-[#acf2e5]/15 bg-[#042126]">
            <div className="flex items-center gap-2 text-xs font-mono text-[#acf2e5]">
              <Database className="w-3.5 h-3.5 text-[#209b47] shrink-0" />
              <span>DEMO • SYNTHETIC DATA (SEED=42)</span>
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
            {/* Connected Investigation Story Steps */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="hidden 2xl:inline text-[10px] font-mono uppercase tracking-wider text-[#005f68] font-bold mr-1">
                Investigation Flow:
              </span>
              <nav className="hidden lg:flex items-center gap-1.5 text-xs">
                {WORKFLOW_JOURNEY.map((item, idx) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <React.Fragment key={item.step}>
                      <Link
                        href={item.href}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                          isActive
                            ? "bg-[#042126] text-white"
                            : "text-[#15497e] hover:bg-[#acf2e5]/40 hover:text-[#042126]"
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-75 mr-1">
                          {item.step}.
                        </span>
                        {item.label}
                      </Link>
                      {idx < WORKFLOW_JOURNEY.length - 1 && (
                        <span className="text-[#042126]/30 text-[10px] font-mono">
                          →
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#acf2e5] text-[#042126] border border-[#042126]/10">
                <span className="w-2 h-2 rounded-full bg-[#209b47]" />
                DEMO • SYNTHETIC DATA
              </span>

              <Link
                href="/cases/CASE-1842"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#209b47] hover:bg-[#1b843c] text-white transition-all duration-150 hover:-translate-y-[1px] shadow-[0_3px_8px_rgba(4,33,38,0.1)]"
              >
                <span>START DEMO (CASE-1842)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </header>

          <main className="flex-1 px-6 lg:px-10 py-7 max-w-[1560px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SmoothScrollAndSpotlight>
  );
}

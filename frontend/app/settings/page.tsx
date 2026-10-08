"use client";

import React, { useState } from "react";
import {
  Settings,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function SettingsPage() {
  const [weights, setWeights] = useState({
    duplicate_billing: 20,
    impossible_timing: 25,
    excessive_utilization: 15,
    abnormal_billing: 15,
    referral_anomaly: 10,
    network_anomaly: 15,
    upcoding: 15,
    unbundling: 15,
    phantom_service: 18,
    temporal_spike: 15,
  });
  const [savedBanner, setSavedBanner] = useState(false);
  const [showTechnicalDataset, setShowTechnicalDataset] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#005f68] font-bold">
            ADMINISTRATOR &amp; MODEL GOVERNANCE
          </div>
          <h2 className="text-lg font-semibold text-[#209b47] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#209b47]" />
            SIU Risk Engine Governance &amp; Rule Weight Configuration
          </h2>
          <p className="text-xs text-[#042126]/75 mt-0.5">
            Manage rule weights, detection engine blend, human-in-the-loop safeguards, and dataset configuration
          </p>
        </div>
        {savedBanner && (
          <div className="px-3.5 py-1.5 rounded-full bg-[#acf2e5] border border-[#209b47]/35 text-[#042126] text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#209b47]" />
            <span>Configuration saved for active SIU session</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSave}
          className="nexus-glass-card rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#005f68]">
            <Sliders className="w-4 h-4 text-[#209b47]" />
            Configurable Rule Engine Signal Weights
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {Object.entries(weights).map(([key, val]) => (
              <div
                key={key}
                className="p-3 rounded-lg bg-[#f2fcff] border border-[#042126]/10 flex items-center justify-between"
              >
                <span className="text-[#042126] font-medium capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setWeights({ ...weights, [key]: Number(e.target.value) })
                  }
                  className="w-16 px-2 py-1 rounded bg-white border border-[#042126]/20 text-right font-mono font-bold text-[#005f68] focus:outline-none focus:border-[#209b47]"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-[#209b47] hover:bg-[#1b843c] text-white text-xs font-semibold transition-colors"
          >
            Save Rule Weights
          </button>
        </form>

        <div className="nexus-glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#005f68]">
            <ShieldAlert className="w-4 h-4 text-[#209b47]" />
            Detection Engine &amp; Human-in-the-Loop Governance
          </div>
          <div className="space-y-3 text-xs text-[#042126] leading-relaxed">
            <div className="p-3.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10">
              <div className="font-semibold text-[#005f68] mb-1">
                1. Human-in-the-Loop SIU Policy
              </div>
              <p className="text-[#042126]/80">
                ClaimShield prioritizes and explains suspicious cases. The platform never declares &ldquo;Fraud Confirmed&rdquo; automatically — all final audit and escalation decisions remain with human SIU investigators.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10">
              <div className="font-semibold text-[#005f68] mb-1">
                2. Multi-Engine Composite Risk Architecture
              </div>
              <p className="text-[#042126]/80">
                Normalized Risk Score (0–100) = 40% Rule Engine + 30% Isolation Forest Anomaly Detection + 20% Network Intelligence + 10% Temporal Analysis.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10">
              <div className="font-semibold text-[#005f68] mb-1">
                3. Ground-Truth Label Isolation
              </div>
              <p className="text-[#042126]/80">
                Ground-truth evaluation labels are isolated strictly to offline validation (`validate_dataset.py`) and never leaked into live risk scoring.
              </p>
            </div>
          </div>

          {/* Secondary Dataset / Technical Details Area (Requirement 13) */}
          <div className="pt-3 border-t border-[#042126]/10">
            <button
              type="button"
              onClick={() => setShowTechnicalDataset(!showTechnicalDataset)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#15497e] hover:text-[#209b47]"
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#005f68]" />
                Dataset &amp; Technical Details (Synthetic Environment)
              </span>
              {showTechnicalDataset ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTechnicalDataset && (
              <div className="mt-3 p-3.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10 text-xs font-mono text-[#042126]/85 space-y-1.5">
                <div>
                  • Deterministic Seed: <strong>RANDOM_SEED = 42</strong>
                </div>
                <div>
                  • Dataset Scale: 10,000+ Claims • 500 Providers • 1,000 Members • 100 Facilities • 1,216+ Referrals
                </div>
                <div>
                  • Anomaly Model: Scikit-learn IsolationForest (150 estimators, z-score feature attribution)
                </div>
                <div>
                  • Graph Engine: NetworkX directed referral reciprocity &amp; shared-member clique topology
                </div>
                <div>
                  • Privacy Guarantee: 100% synthetic demonstration data; zero patient or provider PII
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Settings, Sliders, ShieldAlert, CheckCircle2 } from "lucide-react";

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="nexus-glass-card rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#209b47] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#209b47]" />
            SIU Risk Scoring &amp; Rule Weight Configuration
          </h2>
          <p className="text-xs text-[#042126]/75 mt-0.5">
            Configure deterministic rule weights, composite scoring engine blend, and synthetic environment parameters
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
            Synthetic Data &amp; Ethical Governance Guardrails
          </div>
          <div className="space-y-3 text-xs text-[#042126] leading-relaxed">
            <div className="p-3.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10">
              <div className="font-semibold text-[#005f68] mb-1">
                1. 100% Deterministic Synthetic Data (RANDOM_SEED = 42)
              </div>
              <p className="text-[#042126]/80">
                All 10,000 claims, 500 providers, 1,000 members, 100 facilities, and 1,216 referrals are deterministically generated. No real patient, provider, or insurance PII is stored or processed.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10">
              <div className="font-semibold text-[#005f68] mb-1">
                2. Composite Risk Engine Formula
              </div>
              <p className="text-[#042126]/80">
                Final Risk Score = 40% Rule Risk + 30% Scikit-learn Isolation Forest ML Anomaly + 20% NetworkX Graph Risk + 10% Temporal Risk (Normalized 0–100).
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#f2fcff] border border-[#042126]/10">
              <div className="font-semibold text-[#005f68] mb-1">
                3. Human-in-the-Loop SIU Policy
              </div>
              <p className="text-[#042126]/80">
                Ground truth labels are isolated strictly to internal test evaluation (`validate_dataset.py`). The UI never declares &ldquo;Fraud Confirmed&rdquo; and requires human SIU investigator review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

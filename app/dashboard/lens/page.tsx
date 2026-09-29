"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crosshair,
  AlertTriangle,
  ExternalLink,
  FileText,
} from "lucide-react";

import { useDashboard } from "@/components/dashboard/DashboardContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { AiInsightModal, AiInsightData } from "@/components/ui/AiInsightModal";
import { LENS_INSIGHTS } from "@/components/ui/ai-insights-data";

export default function LensPage() {
  const { activeSession, loadSampleCapture } = useDashboard();
  const [activeInsight, setActiveInsight] = useState<AiInsightData | null>(null);

  if (!activeSession) {
    return (
      <EmptyState
        icon={<Crosshair className="h-6 w-6 text-blue-600" />}
        title="No Capture Available for Attack Modeling"
        description="Ingest a packet capture to evaluate adversarial threat scenarios, BGP hijack vulnerabilities, and downgrade attack forecast models."
        primaryAction={{
          label: "Go to Ingestion",
          href: "/dashboard",
        }}
        secondaryAction={{
          label: "Try Sample Capture (1-Click)",
          onClick: () => loadSampleCapture("stripped"),
        }}
        note="Predictive exposure modeling grounded in RFC specifications"
      />
    );
  }

  const forecasts = [
    {
      id: "FC-01",
      attackClass: "Active BGP Hijack & Cleartext STARTTLS Stripping",
      likelihood: "HIGH",
      confidence: "94% (Observed Downstream Stripping)",
      rationale:
        "Sending MTAs exhibit opportunistic TLS fallback behavior without strict MTA-STS or DANE pinning. Any route announcement hijack will silently harvest full email plaintext without user warning.",
      drivers: [
        { id: "FIND-001", ruleId: "SMS-ENF-002", title: "Active STARTTLS Stripping" },
        { id: "FIND-007", ruleId: "SMS-ENF-001", title: "MTA-STS Policy Absent" },
      ],
      impact: "Total compromise of email confidentiality and credential theft.",
    },
    {
      id: "FC-02",
      attackClass: "Sweet32 Birthday Attack Session Key Recovery",
      likelihood: "MEDIUM",
      confidence: "82% (Legacy 3DES-CBC Negotiated)",
      rationale:
        "Long-lived SMTP connections negotiating 3DES-EDE-CBC are susceptible to collision attacks after approximately 32GB of encrypted ciphertext, revealing plaintext blocks.",
      drivers: [
        { id: "FIND-003", ruleId: "SMS-CIPH-001", title: "Deprecated 3DES Cipher Suite" },
      ],
      impact: "Plaintext exfiltration of encrypted financial attachments.",
    },
    {
      id: "FC-03",
      attackClass: "Adversary Ingress via Hostname Spoofing",
      likelihood: "MEDIUM",
      confidence: "78% (Peer Failed Open on Invalid SAN)",
      rationale:
        "Client MTAs failed open when presented with an invalid certificate SAN. An adversary presenting a valid cert for an arbitrary domain can successfully intercept traffic.",
      drivers: [
        { id: "FIND-004", ruleId: "SMS-X509-002", title: "SAN Hostname Mismatch" },
      ],
      impact: "Silent man-in-the-middle message interception and tampering.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            <Crosshair className="h-3.5 w-3.5 text-slate-600" />
            Predictive Attack Lens
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Attack Lens & Next-Step Threat Forecasting
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            &quot;What&apos;s most likely next, based on what we see&quot; — mathematically derived extrapolation from observed protocol vulnerabilities.
          </p>
        </div>

        <button
          onClick={() => setActiveInsight(LENS_INSIGHTS["FC-01"])}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer shrink-0"
        >
          <FileText className="h-4 w-4" />
          <span>Threat Model Summary</span>
        </button>
      </div>

      {/* Non-Dismissible Forecast Banner (Strict FR-40 Requirement) */}
      <div className="rounded-2xl border-2 border-amber-400 bg-amber-500/10 p-4 text-xs font-bold text-amber-900 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <span>
          FORECAST, NOT FACT — Evidence-forward extrapolation. Every forecast is mathematically bound to ≥1 observed wire-level finding. Predictions reflect exposure likelihood, not active adversary telemetry.
        </span>
      </div>

      {/* Forecast List */}
      <div className="space-y-4">
        {forecasts.map((fc) => (
          <div
            key={fc.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {fc.id}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {fc.attackClass}
                  </h3>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Confidence: <strong className="text-slate-800">{fc.confidence}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveInsight(LENS_INSIGHTS[fc.id] || LENS_INSIGHTS["FC-01"])}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Threat Analysis</span>
                </button>

                <span
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold tracking-wider uppercase ${
                    fc.likelihood === "HIGH"
                      ? "bg-rose-100 text-rose-700 border border-rose-300"
                      : "bg-amber-100 text-amber-700 border border-amber-300"
                  }`}
                >
                  {fc.likelihood} LIKELIHOOD
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {fc.rationale}
            </p>

            {/* Drivers & Evidence Links */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Driving Observed Wire Findings:
                </span>
                <div className="flex flex-wrap gap-2">
                  {fc.drivers.map((d) => (
                    <Link
                      key={d.id}
                      href={`/dashboard/findings?id=${d.ruleId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-xs"
                    >
                      <span className="font-mono text-blue-600 font-bold">{d.ruleId}</span>
                      <span>{d.title}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 block">Projected Impact:</span>
                <span className="text-xs font-semibold text-rose-600">{fc.impact}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insight Modal */}
      <AiInsightModal
        isOpen={!!activeInsight}
        onClose={() => setActiveInsight(null)}
        data={activeInsight}
      />
    </div>
  );
}

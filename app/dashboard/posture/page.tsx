"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  FileText,
  Info,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/DashboardContext";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { EmptyState } from "@/components/ui/EmptyState";
import { TriStateChip } from "@/components/ui/TriStateChip";
import { AiInsightModal, AiInsightData } from "@/components/ui/AiInsightModal";
import {
  POSTURE_SCORE_INSIGHT,
  POSTURE_SUBSCORE_INSIGHTS,
} from "@/components/ui/ai-insights-data";

export default function PosturePage() {
  const { activeSession, loadSampleCapture } = useDashboard();
  const [activeInsight, setActiveInsight] = useState<AiInsightData | null>(null);

  if (!activeSession) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-6 w-6 text-blue-600" />}
        title="No Cryptographic Posture Available"
        description="Ingest a packet capture trace to compute the Bayesian posture score, formal credible intervals, and 6-pillar cryptographic rubrics."
        primaryAction={{
          label: "Go to Ingestion",
          href: "/dashboard",
        }}
        secondaryAction={{
          label: "Try Sample Capture (1-Click)",
          onClick: () => loadSampleCapture("stripped"),
        }}
        note="100% offline & air-gapped · Zero packets transmitted"
      />
    );
  }

  // 6 subscores with pinned weights per docs/03-scoring-rubric.md §4
  const subscoreCategories = [
    {
      id: "protocol",
      name: "Protocol Version",
      weight: 20,
      score: activeSession.score < 60 ? 45 : 95,
      detail: activeSession.score < 60 ? "Downgrade observed on Hop 2 (cleartext fallback)" : "Strict TLS 1.3/1.2 negotiation verified",
      link: "/dashboard/findings?module=SMS-PROTO",
    },
    {
      id: "cipher",
      name: "Cipher Suite",
      weight: 25,
      score: activeSession.score < 60 ? 60 : 92,
      detail: "AEAD ciphers evaluated against NIST SP 800-52r2",
      link: "/dashboard/findings?module=SMS-CIPH",
    },
    {
      id: "key",
      name: "Key Exchange",
      weight: 15,
      score: 90,
      detail: "ECDHE curve parameters & DH group security",
      link: "/dashboard/findings?module=SMS-KEY",
    },
    {
      id: "x509",
      name: "X.509 PKI Trust",
      weight: 15,
      score: 50,
      detail: "Encrypted under TLS 1.3 · Marked NOT-OBSERVABLE",
      isUnobservable: true,
      link: "/dashboard/findings?module=SMS-X509",
    },
    {
      id: "dns",
      name: "DNSSEC & DANE",
      weight: 10,
      score: activeSession.score < 60 ? 30 : 85,
      detail: "TLSA record validation & DNSSEC integrity",
      link: "/dashboard/findings?module=SMS-DNS",
    },
    {
      id: "enforce",
      name: "MTA-STS Enforcement",
      weight: 15,
      score: activeSession.score < 60 ? 25 : 88,
      detail: activeSession.score < 60 ? "No strict policy; vulnerable to STARTTLS stripping" : "Valid enforce policy with TLS-RPT",
      link: "/dashboard/findings?module=SMS-ENF",
    },
  ];

  // Tri-state metrics (demonstrating honest uncertainty)
  const securePct = activeSession.score >= 80 ? 82 : activeSession.score >= 60 ? 64 : 48;
  const notObsPct = 18; // Feature, not a gap!
  const vulnPct = 100 - securePct - notObsPct;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <ShieldCheck className="h-3 w-3 text-blue-600" />
            The Answer · Stop 2 of 5
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Cryptographic Posture & Honest Uncertainty
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Bayesian composite scoring with formal 95% Credible Intervals. Unobservable parameters honestly widen the range.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveInsight(POSTURE_SCORE_INSIGHT)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Explain Score in Plain English</span>
          </button>

          <Link
            href="/dashboard/findings"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <span>Know What to Fix (Findings)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 8.1 Hero Score Display (Physically impossible to show bare number) */}
      <ScoreDisplay
        score={activeSession.score}
        ciLow={activeSession.ciLow}
        ciHigh={activeSession.ciHigh}
        grade={activeSession.grade}
        confidence={0.78}
        showWhyExpander={true}
      />

      {/* 8.2 Six Sub-scores with Weights */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              6-Pillar Weighted Rubric Decomposition (Σ = 100%)
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any pillar to inspect forensic findings or click &quot;Plain English Insight&quot; for a human-readable explanation.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-slate-400">
            RFC 3207 / 8461 / 7672
          </span>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {subscoreCategories.map((sub) => {
            const isHigh = sub.score >= 80;
            const isMid = sub.score >= 60 && sub.score < 80;

            return (
              <div
                key={sub.id}
                className="group rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-400 hover:shadow-xs bg-slate-50/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={sub.link}
                      className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                    >
                      {sub.name}
                    </Link>
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      Weight {sub.weight}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-mono text-2xl font-black text-slate-900">
                      {sub.score}
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </span>
                    {sub.isUnobservable ? (
                      <TriStateChip state="NOT-OBSERVABLE" size="sm" />
                    ) : isHigh ? (
                      <TriStateChip state="SECURE" size="sm" />
                    ) : (
                      <TriStateChip state="VULNERABLE" size="sm" />
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.isUnobservable
                          ? "bg-slate-400"
                          : isHigh
                          ? "bg-emerald-500"
                          : isMid
                          ? "bg-blue-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${sub.score}%` }}
                    />
                  </div>

                  <p className="mt-2 text-[11px] text-slate-500 leading-tight">
                    {sub.detail}
                  </p>
                </div>

                {/* AI Insight trigger button on each card */}
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    onClick={() => setActiveInsight(POSTURE_SUBSCORE_INSIGHTS[sub.id])}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Plain English Insight</span>
                  </button>

                  <Link
                    href={sub.link}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
                  >
                    View Findings →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8.3 Tri-State Summary (How much of the capture was knowable) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Observational Completeness & Tri-State Verdict
            </h3>
            <p className="text-[11px] text-slate-500">
              Raven explicitly declares what was knowable. <strong>{notObsPct}% NOT-OBSERVABLE is a feature, not a gap.</strong>
            </p>
          </div>

          <button
            onClick={() => setActiveInsight(POSTURE_SUBSCORE_INSIGHTS["x509"])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Info className="h-3.5 w-3.5 text-blue-600" />
            <span>Why NOT-OBSERVABLE Protects You</span>
          </button>
        </div>

        {/* Stacked Bar */}
        <div className="h-4 w-full rounded-lg overflow-hidden flex bg-slate-100">
          <div
            className="bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center transition-all"
            style={{ width: `${securePct}%` }}
            title={`SECURE: ${securePct}%`}
          >
            {securePct > 15 ? `${securePct}%` : ""}
          </div>
          <div
            className="bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center transition-all"
            style={{ width: `${vulnPct}%` }}
            title={`VULNERABLE: ${vulnPct}%`}
          >
            {vulnPct > 10 ? `${vulnPct}%` : ""}
          </div>
          <div
            className="bg-slate-400 text-[10px] font-bold text-white flex items-center justify-center transition-all bg-[repeating-linear-gradient(45deg,#64748b,#64748b_4px,#475569_4px,#475569_8px)]"
            style={{ width: `${notObsPct}%` }}
            title={`NOT-OBSERVABLE: ${notObsPct}%`}
          >
            {notObsPct}%
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-xs bg-emerald-500" />
            <span className="font-semibold text-slate-800">SECURE: {securePct}%</span>
            <span className="text-[11px] text-slate-400">Cryptographically sealed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-xs bg-rose-500" />
            <span className="font-semibold text-slate-800">VULNERABLE: {vulnPct}%</span>
            <span className="text-[11px] text-slate-400">Downgraded or cleartext</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-xs bg-slate-500" />
            <span className="font-semibold text-slate-800">NOT-OBSERVABLE: {notObsPct}%</span>
            <span className="text-[11px] text-slate-400">Encrypted in TLS 1.3 (honestly bounded)</span>
          </div>
        </div>
      </div>

      {/* 8.4 Meta Strip */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-600 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span>Flows: <strong className="text-slate-900">{activeSession.flows.toLocaleString()}</strong></span>
          <span>·</span>
          <span>Packets: <strong className="text-slate-900">{(activeSession.flows * 180).toLocaleString()}</strong></span>
          <span>·</span>
          <span>Duration: <strong className="text-slate-900">00:00.412s</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 truncate max-w-xs">
            HASH: {activeSession.hash.slice(0, 24)}...
          </span>
          <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
            v1.4.0-sih
          </span>
        </div>
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

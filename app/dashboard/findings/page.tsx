"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  ChevronRight,
  CheckCircle2,
  Filter,
  FileText,
} from "lucide-react";
import { useDashboard, Severity } from "@/components/dashboard/DashboardContext";
import { EvidenceDrawer } from "@/components/dashboard/EvidenceDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { RuleChip } from "@/components/ui/RuleChip";
import { AiInsightModal, AiInsightData } from "@/components/ui/AiInsightModal";
import { getFindingInsight } from "@/components/ui/ai-insights-data";

export default function FindingsPage() {
  const { findings, selectedFinding, setSelectedFinding, activeSession, loadSampleCapture } =
    useDashboard();

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"severity" | "cvss" | "confidence">("severity");
  const [activeAiInsight, setActiveAiInsight] = useState<AiInsightData | null>(null);

  if (!activeSession) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6 text-blue-600" />}
        title="No Capture Analyzed Yet"
        description="Ingest a packet capture or try a sample scenario to discover risk-ranked cryptographic vulnerabilities and wire byte proofs."
        primaryAction={{
          label: "Go to Ingestion",
          href: "/dashboard",
        }}
        secondaryAction={{
          label: "Try Sample Capture (1-Click)",
          onClick: () => loadSampleCapture("stripped"),
        }}
        note="Court-grade RFC rule evaluation with zero packet egress"
      />
    );
  }

  // Zero findings state: "No findings. That's not the same as clean." (Spec 9.4)
  if (findings.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
        title="No Vulnerabilities Detected"
        description="That's not the same as clean. In modern TLS 1.3 handshakes, intermediate certificates and host policies are encrypted on wire and strictly unobservable without private keys. Verify unobservable hops in the posture matrix."
        primaryAction={{
          label: "Inspect Posture Matrix & Blindspots →",
          href: "/dashboard/posture",
        }}
        secondaryAction={{
          label: "Try Vulnerable Sample (STARTTLS Stripping)",
          onClick: () => loadSampleCapture("stripped"),
        }}
        note="Rule catalog evaluated 14 deterministic RFC rules with 0 violations"
      />
    );
  }

  const getOneLineFix = (ruleId: string) => {
    if (ruleId.includes("ENF-002")) return "Enforce mandatory DANE / MTA-STS to reject unencrypted cleartext fallback.";
    if (ruleId.includes("CIPH")) return "Disable legacy 3DES/CBC ciphers in MTA; restrict to AEAD suites (AES-256-GCM).";
    if (ruleId.includes("KEY")) return "Upgrade host key size to minimum 2048-bit RSA or Ed25519.";
    if (ruleId.includes("RADAR")) return "Inspect network tap or middlebox suppressing 250-STARTTLS advertisement.";
    return "Publish strict MTA-STS policy on HTTPS well-known endpoint.";
  };

  // Filter & Search
  const filteredFindings = findings.filter((f) => {
    const matchesSearch =
      f.ruleTitle.toLowerCase().includes(search.toLowerCase()) ||
      f.ruleId.toLowerCase().includes(search.toLowerCase()) ||
      f.mxHost.toLowerCase().includes(search.toLowerCase()) ||
      f.summary.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === "ALL" || f.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Sort: Default to highest severity first (Critical -> High -> Medium -> Low)
  const sortedFindings = [...filteredFindings].sort((a, b) => {
    if (sortBy === "severity") {
      const rank: Record<Severity, number> = {
        CRITICAL: 5,
        HIGH: 4,
        MEDIUM: 3,
        LOW: 2,
        INFO: 1,
      };
      return rank[b.severity] - rank[a.severity];
    } else if (sortBy === "cvss") {
      return b.cvss - a.cvss;
    }
    return b.confidence - a.confidence;
  });

  const exportCSV = () => {
    const headers = "id,ruleId,severity,state,service,mxHost,cvss,cwe,confidence,byteOffset,spanHash\n";
    const rows = sortedFindings
      .map(
        (f) =>
          `"${f.id}","${f.ruleId}","${f.severity}","${f.state}","${f.service}","${f.mxHost}",${f.cvss},"${f.cwe}",${f.confidence},"${f.provenance.byteOffset}","${f.provenance.spanHash}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `raven_findings_${activeSession.id}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Search className="h-3 w-3 text-blue-600" />
            Know What to Fix · Stop 3 of 5
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Forensic Findings & Remediation Playbook
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Ranked list of verified vulnerabilities. Click any finding to inspect packet frames, wire byte offsets, and RFC clauses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sortedFindings.length > 0 && (
            <button
              onClick={() => setActiveAiInsight(getFindingInsight(sortedFindings[0]))}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Executive Briefing</span>
            </button>
          )}

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Evidence</span>
          </button>
          <Link
            href="/dashboard/graph"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>Delivery Graph →</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by rule ID, CVE, MTA host, or keyword..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Severity:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                severityFilter === sev
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-400 font-sans font-semibold">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "severity" | "cvss" | "confidence")}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700"
          >
            <option value="severity">Ranked Severity</option>
            <option value="cvss">CVSS Score</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>
      </div>

      {/* 9.1 Ranked Findings Table (Top severity first) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-3">Rule ID</th>
                <th className="py-3 px-4">Title & Remediation Fix</th>
                <th className="py-3 px-4">Target Hop / Host</th>
                <th className="py-3 px-3 text-center">CVSS</th>
                <th className="py-3 px-4 text-right">Wire Offset</th>
                <th className="py-3 px-3 text-center">AI Insight</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {sortedFindings.map((finding) => (
                <tr
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding)}
                  className="group cursor-pointer hover:bg-blue-50/40 transition-colors"
                >
                  {/* Severity */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        finding.severity === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : finding.severity === "HIGH"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  {/* Rule ID */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <RuleChip ruleId={finding.ruleId} />
                  </td>

                  {/* Title & One-Line Fix */}
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {finding.ruleTitle}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500 font-mono truncate">
                      Fix: {getOneLineFix(finding.ruleId)}
                    </div>
                  </td>

                  {/* Hop */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] font-semibold text-slate-700">
                    {finding.mxHost}
                  </td>

                  {/* CVSS */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold">
                    <span
                      className={
                        finding.cvss >= 9.0
                          ? "text-rose-600"
                          : finding.cvss >= 7.0
                          ? "text-amber-600"
                          : "text-slate-600"
                      }
                    >
                      {finding.cvss.toFixed(1)}
                    </span>
                  </td>

                  {/* Wire Offset */}
                  <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {finding.provenance.byteOffset}
                  </td>

                  {/* Direct AI Insight Trigger */}
                  <td
                    className="py-3.5 px-3 text-center whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAiInsight(getFindingInsight(finding));
                    }}
                  >
                    <button
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700 transition-colors cursor-pointer"
                      title="Explain this finding in human language"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Explain</span>
                    </button>
                  </td>

                  {/* Arrow */}
                  <td className="py-3.5 px-3 text-right">
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />

      {/* AI Insight Modal */}
      <AiInsightModal
        isOpen={!!activeAiInsight}
        onClose={() => setActiveAiInsight(null)}
        data={activeAiInsight}
      />
    </div>
  );
}
